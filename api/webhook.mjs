/**
 * Don Abel · Aviso automático de Mercado Pago (webhook)
 *
 * Cuando un cobro con Point queda aprobado, Mercado Pago avisa a esta función y ella guarda la venta en la base de datos
 * SIN depender de ningún celular ni de que la app esté abierta.
 *
 * Va en el repositorio como  api/webhook.mjs  (al lado de api/point.mjs).
 *
 * Variables de entorno en Vercel (Settings → Environment Variables), y luego volver a desplegar:
 *   MP_ACCESS_TOKEN    (ya está puesta)
 *   SUPABASE_URL       la misma dirección que está en src/supabase.js (https://xxxx.supabase.co)
 *   SUPABASE_KEY       la misma clave "anon" que está en src/supabase.js
 *   MP_WEBHOOK_SECRET  (opcional) clave secreta que entrega Mercado Pago al configurar las notificaciones
 *
 * En Mercado Pago (Tus integraciones → tu aplicación → Webhooks → Configurar notificaciones → Modo producción):
 *   URL:    https://donabel-foodtruck.vercel.app/api/webhook
 *   Evento: Order (Mercado Pago)
 */
import crypto from "node:crypto";

const MP_API = "https://api.mercadopago.com";
// Medios con los que realmente entra plata (si no, por ejemplo efectivo marcado en la terminal, la venta NO se guarda sola)
const TIPOS_CON_DINERO = ["debit_card", "credit_card", "prepaid_card", "account_money", "bank_transfer", "qr", "digital_wallet"];

const horaChile = (d) => d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" });

async function mpGet(ruta) {
  const r = await fetch(MP_API + ruta, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
  const txt = await r.text();
  let data = null; try { data = JSON.parse(txt); } catch { data = null; }
  return { ok: r.ok, httpStatus: r.status, data };
}

async function sb(metodo, ruta, cuerpo) {
  const clave = String(process.env.SUPABASE_KEY || "").trim();
  const cabeceras = { apikey: clave, "Content-Type": "application/json", Prefer: "return=representation" };
  if (clave.startsWith("eyJ")) cabeceras.Authorization = `Bearer ${clave}`; // clave antigua (JWT); las nuevas "sb_publishable_..." van solo en apikey
  const r = await fetch(`${String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "")}/rest/v1/${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const txt = await r.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  return { ok: r.ok, status: r.status, data };
}

// ---- Arma las filas de la venta: copia exacta de la que usa la app ----
export function construirFilasVenta(items, recetas, { fecha, quien, extraNota, efectivo, hora: horaForzada }) {
  const hora = horaForzada || horaChile(new Date());
  const rows = [];
  items.forEach((c) => {
    if (c.productos_combo && c.productos_combo.length > 0) {
      // Combo: registrar el combo como una línea + cada producto interno
      rows.push({ fecha, hora, producto: c.nombre, cantidad: c.cantidad, precio_unitario: c.precio_unitario, total: c.total, metodo_pago: c.metodo_pago, persona: quien || null, nota: JSON.stringify({ combo: c.combo, productos: c.productos_combo }) });
      // Registrar cada producto del combo con precio 0 para stock
      const sumaNormal = c.productos_combo.reduce((s, p) => { const r = recetas.find((r) => r.nombre_producto === p); return s + (r ? r.precio_venta : 0); }, 0);
      c.productos_combo.forEach((nombreProd) => {
        const r = recetas.find((r) => r.nombre_producto === nombreProd);
        if (!r) return;
        const precioProp = sumaNormal > 0 ? Math.round((r.precio_venta / sumaNormal) * c.precio_unitario) : 0;
        rows.push({ fecha, hora, producto: nombreProd, cantidad: c.cantidad, precio_unitario: precioProp, total: precioProp * c.cantidad, metodo_pago: c.metodo_pago, persona: quien || null, nota: JSON.stringify({ combo: c.combo, es_componente: true }) });
      });
    } else {
      rows.push({ fecha, hora, producto: c.nombre, cantidad: c.cantidad, precio_unitario: c.precio_unitario, total: c.total, metodo_pago: c.metodo_pago, persona: quien || null, nota: JSON.stringify({ ...(c.descuento || {}), ...(c.combo ? { combo: c.combo } : {}), ...(c.variante ? { variante: c.variante } : {}) }) || null });
    }
  });
  // Pago mixto: el efectivo se reparte en proporción al valor de cada fila; el resto es tarjeta
  const efectivoMixto = Math.round(Number(efectivo) || 0);
  if (efectivoMixto > 0) {
    const esComp = (r) => { try { return JSON.parse(r.nota || "{}").es_componente === true; } catch { return false; } };
    const principales = rows.filter((r) => !esComp(r));
    const totalVenta = principales.reduce((a, r) => a + r.total, 0);
    if (totalVenta > 0) {
      let asignado = 0;
      const partes = rows.map((r) => Math.round(r.total * efectivoMixto / totalVenta));
      rows.forEach((r, i) => { if (!esComp(r)) asignado += partes[i]; });
      // el redondeo se corrige en la última fila principal con valor
      for (let i = rows.length - 1; i >= 0; i--) { if (!esComp(rows[i]) && rows[i].total > 0) { partes[i] += efectivoMixto - asignado; break; } }
      rows.forEach((r, i) => {
        let n = {}; try { n = JSON.parse(r.nota || "{}"); } catch { n = {}; }
        const ef = Math.max(Math.min(partes[i], r.total), 0);
        r.metodo_pago = "Mixto";
        r.nota = JSON.stringify({ ...n, pagos: { Efectivo: ef, Tarjeta: r.total - ef } });
      });
    }
  }
  if (extraNota) rows.forEach((r) => { let n = {}; try { n = JSON.parse(r.nota || "{}"); } catch { n = {}; } r.nota = JSON.stringify({ ...n, ...extraNota }); });
  return rows;
}

// ---- Procesa una orden: si quedó pagada con tarjeta o QR por el monto cobrado (más propina), guarda la venta ----
export async function procesarOrden(orderId, deps = {}) {
  const mp = deps.mp || mpGet;
  const db = deps.db || sb;
  const enc = encodeURIComponent(orderId);
  const marcar = (estado) => db("PATCH", `cobros_point?order_id=eq.${enc}`, { estado });

  const sel = await db("GET", `cobros_point?order_id=eq.${enc}&select=*`);
  const cobro = Array.isArray(sel.data) ? sel.data[0] : null;
  if (!cobro) return { resultado: "no_es_de_la_app" };
  if (!["pendiente", "revisar"].includes(cobro.estado)) return { resultado: "ya_" + cobro.estado };
  const pend = cobro.datos;
  if (!pend || !Array.isArray(pend.items)) { await marcar("cerrado"); return { resultado: "sin_datos" }; }

  const o = await mp(`/v1/orders/${enc}`);
  if (!o.ok || !o.data) throw new Error("No se pudo leer la orden (" + o.httpStatus + ")");
  const orden = o.data;
  if (["failed", "expired", "canceled"].includes(orden.status)) { await marcar("cerrado"); return { resultado: "cerrada_" + orden.status }; }
  if (orden.status !== "processed") return { resultado: "aun_" + orden.status };

  const pago0 = orden.transactions && orden.transactions.payments ? orden.transactions.payments[0] : null;
  // Monto pagado: puede ser mayor al cobrado si el cliente dejó propina (hasta +30%)
  const montosPagados = [pago0 && pago0.amount, pago0 && pago0.paid_amount, orden.total_paid_amount].map((x) => Number(x) || 0);
  const enRango = (x) => x >= pend.monto && x <= Math.round(pend.monto * 1.3);
  const validos = montosPagados.filter(enRango);
  if (orden.status_detail !== "accredited" || !pago0 || validos.length === 0) { await marcar("revisar"); return { resultado: "revisar_monto" }; }
  const propina = Math.max(0, Math.round(Math.max(...validos) - pend.monto));

  // Datos del pago: tipo de tarjeta, comisión real y hora de aprobación
  const payId = (pago0.reference && pago0.reference.id) || pago0.reference_id || null;
  let fee = null, tipoPago = null, aprobadoISO = null;
  if (payId) {
    const pg = await mp(`/v1/payments/${encodeURIComponent(payId)}`);
    if (pg.ok && pg.data) {
      tipoPago = pg.data.payment_type_id || null;
      aprobadoISO = pg.data.date_approved || null;
      const suma = (pg.data.fee_details || []).filter((f) => !f.fee_payer || f.fee_payer === "collector").reduce((a, f) => a + Number(f.amount || 0), 0);
      if (suma > 0) fee = Math.round(suma);
    }
  }
  if (!aprobadoISO && orden.last_updated_date) aprobadoISO = orden.last_updated_date;
  const tipoOrden = pago0.payment_method ? pago0.payment_method.type || null : null;
  const tipo = tipoPago || tipoOrden || null;
  // Si no fue tarjeta ni QR (por ejemplo efectivo en la terminal) no se guarda sola: la app muestra la alerta roja para decidir
  if (!tipo || !TIPOS_CON_DINERO.includes(tipo)) return { resultado: "medio_a_revisar", tipo };

  // El primero que reclama el cobro es quien guarda la venta (la app también lo hace: nunca se duplica)
  const claim = await db("PATCH", `cobros_point?order_id=eq.${enc}&estado=in.(pendiente,revisar)`, { estado: "registrando" });
  if (!claim.ok || !Array.isArray(claim.data) || claim.data.length === 0) return { resultado: "ya_lo_registro_otro" };

  try {
    const rec = await db("GET", "recetas?select=nombre_producto,precio_venta");
    const recetas = Array.isArray(rec.data) ? rec.data : [];
    const f = aprobadoISO ? new Date(aprobadoISO) : null;
    const hora = f && !isNaN(f.getTime()) ? horaChile(f) : undefined;
    const rows = construirFilasVenta(pend.items, recetas, {
      fecha: pend.fecha, quien: pend.quien, efectivo: pend.efectivo, hora,
      extraNota: { point_order: orderId, ...(propina > 0 ? { point_propina: propina } : {}), ...(pend.ref ? { point_ref: pend.ref } : {}), ...(hora ? { point_aprobado: aprobadoISO } : {}), ...(payId ? { point_payment: String(payId) } : {}), point_servidor: true },
    });
    if (rows.length === 0) throw new Error("La venta no tiene filas");
    let n = {}; try { n = JSON.parse(rows[0].nota || "{}"); } catch { n = {}; }
    rows[0].nota = JSON.stringify({ ...n, point_total: pend.monto, ...(fee !== null ? { point_fee: fee } : {}), point_tipo: tipo });
    const ins = await db("POST", "ventas", rows);
    if (!ins.ok) throw new Error("No se pudo guardar la venta (" + ins.status + ")");
    await marcar("registrado");
    return { resultado: "registrado", filas: rows.length, tipo, propina };
  } catch (e) {
    await marcar("pendiente"); // vuelve a quedar pendiente: Mercado Pago reintenta y la app también lo revisa
    throw e;
  }
}

// ---- Receptor del aviso de Mercado Pago ----
export default async function handler(req, res) {
  if (req.method !== "POST") {
    if (req.query && req.query.diagnostico) {
      const out = { ok: true, variables: { MP_ACCESS_TOKEN: !!process.env.MP_ACCESS_TOKEN, SUPABASE_URL: !!process.env.SUPABASE_URL, SUPABASE_KEY: !!process.env.SUPABASE_KEY } };
      try { const r = await sb("GET", "cobros_point?select=order_id&limit=1"); out.supabase = r.ok ? "ok" : `error ${r.status}${r.data && r.data.message ? ": " + r.data.message : ""}`; } catch (e) { out.supabase = "error: " + String(e.message || e).slice(0, 80); }
      try { const r = await mpGet("/users/me"); out.mercadopago = r.ok ? "ok" : `error ${r.httpStatus}`; } catch (e) { out.mercadopago = "error"; }
      return res.status(200).json(out);
    }
    return res.status(200).json({ ok: true, info: "webhook de Don Abel" });
  }
  try {
    const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
    const dataId = (req.query && (req.query["data.id"] || req.query.data_id)) || (body.data && body.data.id);

    // Firma (solo si se configuró MP_WEBHOOK_SECRET): comprueba que el aviso viene de Mercado Pago
    if (process.env.MP_WEBHOOK_SECRET) {
      const partes = Object.fromEntries(String(req.headers["x-signature"] || "").split(",").map((x) => x.trim().split("=")));
      const manifest = `id:${String(dataId || "").toLowerCase()};request-id:${req.headers["x-request-id"] || ""};ts:${partes.ts};`;
      const esperada = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET).update(manifest).digest("hex");
      if (!partes.v1 || partes.v1 !== esperada) return res.status(401).json({ ok: false, error: "firma" });
    }

    // No se asume cómo empieza el identificador: se busca en la tabla de cobros de la app y, si no está, se ignora
    if (!dataId || !/^[A-Za-z0-9_-]{1,64}$/.test(String(dataId))) return res.status(200).json({ ok: true, ignorado: true });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.MP_ACCESS_TOKEN) {
      console.error("webhook: faltan variables de entorno");
      return res.status(500).json({ ok: false, error: "configuracion" });
    }
    const r = await procesarOrden(String(dataId));
    return res.status(200).json({ ok: true, ...r });
  } catch (e) {
    console.error("webhook:", e);
    return res.status(500).json({ ok: false }); // Mercado Pago reintenta
  }
}
