const MP_API = "https://api.mercadopago.com";

async function llamarMP(metodo, ruta, cuerpo, cabeceras = {}) {
  const r = await fetch(MP_API + ruta, {
    method: metodo,
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json", ...cabeceras },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  let data;
  try { data = JSON.parse(texto); } catch { data = { raw: texto }; }
  return { ok: r.ok, httpStatus: r.status, data };
}

const uuid = () => globalThis.crypto.randomUUID();

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const p = req.query || {};

  if (p.accion === "ping") {
    return res.status(200).json({ ok: true, configurado: !!(process.env.MP_ACCESS_TOKEN && process.env.MP_TERMINAL_ID) });
  }
  if (process.env.APP_CLAVE && p.clave !== process.env.APP_CLAVE) return res.status(200).json({ ok: false, error: "clave" });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(200).json({ ok: false, error: "sin_token" });

  try {
    switch (p.accion) {
      case "terminales":
        return res.status(200).json(await llamarMP("GET", "/terminals/v1/list?limit=50"));

      case "crear": {
        const monto = parseInt(p.monto, 10);
        if (!(monto > 0)) return res.status(200).json({ ok: false, error: "monto" });
        const terminal = process.env.MP_TERMINAL_ID;
        if (!terminal) return res.status(200).json({ ok: false, error: "sin_terminal" });
        const cuerpo = {
          type: "point",
          external_reference: String(p.ref || `DA-${Date.now()}`),
          expiration_time: "PT16M",
          transactions: { payments: [{ amount: String(monto) }] },
          config: { point: { terminal_id: terminal } },
        };
        return res.status(200).json(await llamarMP("POST", "/v1/orders", cuerpo, { "X-Idempotency-Key": String(p.idem || uuid()) }));
      }

      case "estado":
        return res.status(200).json(await llamarMP("GET", `/v1/orders/${encodeURIComponent(p.id)}`));

      case "cancelar":
        return res.status(200).json(await llamarMP("POST", `/v1/orders/${encodeURIComponent(p.id)}/cancel`, null, {
          "x-allow-cancelable-status": "at_terminal",
          "X-Idempotency-Key": String(p.idem || uuid()),
        }));

      case "pago":
        return res.status(200).json(await llamarMP("GET", `/v1/payments/${encodeURIComponent(p.id)}`));
      case "modo": {
        if (process.env.PERMITIR_CAMBIO_MODO !== "1") return res.status(200).json({ ok: false, error: "cambio_de_modo_deshabilitado" });
        const id = p.id || process.env.MP_TERMINAL_ID;
        if (!id) return res.status(200).json({ ok: false, error: "sin_terminal" });
        const modo = p.modo === "STANDALONE" ? "STANDALONE" : "PDV";
        return res.status(200).json(await llamarMP("PATCH", "/terminals/v1/setup", { terminals: [{ id, operating_mode: modo }] }));
      }
      default:
        return res.status(200).json({ ok: false, error: "accion" });
    }
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err) });
  }
}
