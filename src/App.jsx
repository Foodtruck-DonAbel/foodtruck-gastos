import { useState, useEffect, useRef, Fragment } from "react";
import { supabase } from "./supabase";

const C = {
  bg: "#18161A", surface: "#221F26", card: "#2A2730", border: "#3A3640",
  mustard: "#E8B84B", mustardDim: "#B8902A", red: "#E05252",
  green: "#5BAD7F", text: "#F2EEF8", muted: "#8A8496", tag: "#332F3C",
  blue: "#6B9FD4", purple: "#C97DDB", orange: "#FF6B35",
};

const PERSONAS = ["Raul", "Pepe", "Alejandro", "Gustavo"];
const FONDOS = ["Efectivo foodtruck", "Efectivo Don Abel", "Tarjeta foodtruck", "Tarjeta Don Abel", "Pago personal", "Botillería"];
// Buscador de precios de la botillería (Apps Script). Devuelve [{ nombre, codigo, proveedor, costoReal, fecha }]
const BOTILLERIA_URL = "https://script.google.com/macros/s/AKfycbwcNig7G26Th8jJzdpnJkt5Ic8qIMYDtk_6iZ_gUaJxFbpsxRT4mFyd9NfWOdsoGtGU/exec";
const INSUMOS_BASE = [
  "Aceite para Freir","Aceite para Mayonesa Casera","Ají en Pasta","Cebolla Caramelizada","Chicken Fingers","Chucrut","Churrascos","Ciboulette","Cilantro","Empanadas de Queso","Envase para Papas / Sandwich/ PY","Envases para completos","Gas / combustible","Ketchup","Limpieza","Mayonesa","Mayonesa Casera","Mayonesa en Polvo","Mostaza","Palta","Pan para completo","Pan para Sandwich Castaño","Papas fritas","Pepinillo","Queso cheddar","Queso Normal","Retiro de Caja","Salchichas 17 cm","Salsa Americana","Salsa BBQ","Servilletas / bolsas","Tocino","Tomate","Patente y permisos","Contador","Publicidad","Internet y celular","Seguros","Mantención camión","Arriendo lugar","Inversión / equipamiento","Pago sueldo Gustavo","Toalla nova","Guantes","Reparaciones","Otro",
];
const fondoColors = {
  "Efectivo foodtruck": "#6B9FD4", "Efectivo Don Abel": "#5BAD7F",
  "Tarjeta foodtruck": "#C97DDB", "Tarjeta Don Abel": "#E8B84B", "Pago personal": "#FF6B35", "Botillería": "#4CC9C0",
};
const metodoPagoColors = { "Efectivo": "#5BAD7F", "Tarjeta": "#6B9FD4", "Pedidos Ya": "#FF6B35" };
const personColor = (n) => ({ Raul: "#6B9FD4", Pepe: "#E8B84B", Alejandro: "#5BAD7F", Gustavo: "#C97DDB" }[n] || C.muted);
const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-CL");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
// Mayúscula inicial por palabra; reconoce ñ y tildes (con \b\w, "castaño" salía "CastañO")
const normProv = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/(^|\s)(\p{L})/gu, (m, sep, c) => sep + c.toUpperCase());
const UNIDAD_DEFAULT_INSUMO = {
  "Salchichas": "unidad", "Chicken Fingers": "unidad", "Churrascos": "unidad",
  "Pan para completo": "unidad", "Pan Castaño Brioche para Sandwich": "unidad",
  "Queso cheddar": "unidad", "Nuggets": "unidad", "Nuggets pollo": "unidad",
  "Palta": "kg", "Tomate": "kg", "Tocino": "kg", "Papas fritas": "kg", "Ají en Pasta": "kg",
  "Mayonesa": "kg", "Mayonesa Casera": "kg", "Mostaza": "kg", "Ketchup": "kg",
  "Chucrut": "kg", "Pepinillo": "kg", "Cebolla": "kg", "Aceite para Freir": "litro", "Empanadas de Queso": "unidad",
  "Patente y permisos": "unidad", "Contador": "unidad", "Publicidad": "unidad", "Internet y celular": "unidad", "Seguros": "unidad", "Mantención camión": "unidad", "Arriendo lugar": "unidad", "Inversión / equipamiento": "unidad", "Pago sueldo Gustavo": "unidad", "Toalla nova": "unidad", "Guantes": "unidad", "Reparaciones": "unidad",
  "Aceite para Mayonesa Casera": "litro",
};

// Unidad de respaldo para todos los insumos de la lista de gastos (se usa si Recetas → Insumos no la tiene)
const UNIDAD_RESPALDO = {
  "Aceite para Freir": "litro", "Aceite para Mayonesa Casera": "litro", "Ají en Pasta": "kg", "Cebolla Caramelizada": "kg",
  "Chicken Fingers": "unidad", "Chucrut": "kg", "Churrascos": "unidad", "Ciboulette": "unidad", "Cilantro": "unidad",
  "Empanadas de Queso": "unidad", "Envase para Papas / Sandwich/ PY": "unidad", "Envases para completos": "unidad",
  "Gas / combustible": "unidad", "Ketchup": "kg", "Limpieza": "unidad", "Mayonesa": "kg", "Mayonesa Casera": "kg",
  "Mayonesa en Polvo": "kg", "Mostaza": "kg", "Palta": "kg", "Pan para completo": "unidad", "Pan para Sandwich Castaño": "unidad",
  "Papas fritas": "kg", "Pepinillo": "kg", "Queso cheddar": "unidad", "Queso Normal": "kg", "Retiro de Caja": "unidad",
  "Salchichas 17 cm": "unidad", "Salsa Americana": "kg", "Salsa BBQ": "kg", "Servilletas / bolsas": "unidad", "Tocino": "kg", "Tomate": "kg",
};

// Mapa de equivalencias: nombre en gastos -> nombre en insumos_precio
const MERMA_INSUMOS = { "Palta": 0.30 }; // 30% merma

const MAPA_INSUMOS = {
  "ají": "Ají en Pasta",
  "aji": "Ají en Pasta",
  "aji pasta": "Ají en Pasta",
  "ají pasta": "Ají en Pasta",
  "aji en pasta": "Ají en Pasta",
  "ají en pasta": "Ají en Pasta",
  "palta": "Palta",
  "tomate": "Tomate",
  "pan para completo": "Pan para completo",
  "pan para sandwich castaño": "Pan para Sandwich Castaño",
  "pan castaño brioche para sandwich": "Pan para Sandwich Castaño",
  "salchichas 17 cm": "Salchichas 17 cm",
  "salchichas": "Salchichas 17 cm",
  "chicken fingers": "Chicken Fingers",
  "churrascos": "Churrascos",
  "tocino": "Tocino",
  "ketchup": "Ketchup",
  "mayonesa": "Mayonesa",
  "mayonesa casera": "Mayonesa Casera",
  "mayonesa en polvo": "Mayonesa en Polvo",
  "aceite para mayonesa casera": "Aceite para Mayonesa Casera",
  "ciboulette": "Ciboulette",
  "cilantro": "Cilantro",
  "mostaza": "Mostaza",
  "queso cheddar": "Queso cheddar",
  "envases para completos": "Envases para completos",
  "envase para papas / sandwich/ py": "Envase para Papas / Sandwich/ PY",
  "chucrut": "Chucrut",
  "papas fritas": "Papas fritas",
  "salsa americana": "Salsa Americana",
  "salsa bbq": "Salsa BBQ",
  "cebolla caramelizada": "Cebolla Caramelizada",
  "aceite para freir": "Aceite para Freir",
  "empanadas de queso": "Empanadas de Queso",
  "empanada de queso": "Empanadas de Queso",
  "empanada frita de queso": "Empanadas de Queso",
  "empanadas fritas de queso": "Empanadas de Queso",
};

// Convierte todo a gramos/unidades para comparar
const aGramos = (cantidad, unidad) => {
  if (!cantidad || isNaN(Number(cantidad))) return 0;
  const n = Number(cantidad);
  if (unidad === "kg") return n * 1000;
  if (unidad === "litro") return n * 1000;
  if (unidad === "g") return n;
  if (unidad === "ml") return n;
  return n; // unidad, caja, etc.
};

const resolverInsumo = (nombreGasto) => {
  const norm = (nombreGasto || "").trim().toLowerCase();
  return MAPA_INSUMOS[norm] || null;
};

// Merma detectada en los ajustes de inventario.
// Por cada insumo, compara lo que DEBÍA haber (ajuste anterior + compras - consumo según recetas)
// con lo que se contó en el ajuste siguiente. Positivo = faltante (merma), negativo = sobrante.
const calcularMermasBase = (historial, gastosData, ventasData, recetasData, insumosData, ingredientesEfectivosFn, parseNotaFn) => {
  const porInsumo = {};
  [...historial].sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0)).forEach((h) => {
    (porInsumo[h.insumo] = porInsumo[h.insumo] || []).push(h);
  });
  const out = [];
  Object.entries(porInsumo).forEach(([nombre, ajustes]) => {
    const ins = insumosData.find((i) => i.nombre === nombre);
    if (!ins) return;
    const factor = MERMA_INSUMOS[nombre] || 0; // merma natural ya incluida en el precio (ej: palta)
    for (let k = 1; k < ajustes.length; k++) {
      const prev = ajustes[k - 1];
      const cur = ajustes[k];
      const base = aGramos(prev.cantidad, prev.unidad);
      let compras = 0;
      gastosData.forEach((g) => {
        if (resolverInsumo(g.insumo) !== nombre) return;
        if (g.created_at < prev.created_at || g.created_at >= cur.created_at) return;
        compras += aGramos(g.cantidad, g.unidad);
      });
      let consumo = 0;
      ventasData.forEach((v) => {
        if (v.created_at < prev.created_at || v.created_at >= cur.created_at) return;
        const rec = recetasData.find((r) => r.nombre_producto === v.producto);
        if (!rec || !rec.ingredientes) return;
        ingredientesEfectivosFn(rec, parseNotaFn(v)).forEach((ing) => {
          if (ing.insumo === nombre) consumo += (ing.gramos || 0) * v.cantidad;
        });
      });
      if (factor > 0) consumo = consumo / (1 - factor);
      const esperado = base + compras - consumo;
      const contado = aGramos(cur.cantidad, cur.unidad);
      const dif = esperado - contado;
      if (Math.abs(dif) < 0.5) continue;
      const costoUnit = (ins.unidad === "unidad" ? ins.precio_por_kg : ins.precio_por_kg / 1000) * (factor > 0 ? 1 - factor : 1);
      out.push({ id: cur.id, insumo: nombre, fecha: cur.fecha, persona: cur.persona, motivo: cur.motivo || "", unidad: ins.unidad, esperado, contado, dif, costo: Math.round(dif * costoUnit) });
    }
  });
  return out;
};

// Comisión efectiva de Pedidos Ya: $142.931 sobre $509.920 de ventas (liquidación a oct-2026) = 28,0%
// Gustavo: fijo mensual + comisión por cada completo vendido (cuentan los AS y los que van dentro de combos)
const GUSTAVO_FIJO = 600000;
const GUSTAVO_POR_COMPLETO = 225;
const COMISION_PEDIDOS_YA = 0.28;
// Comisión Mercado Pago por tarjeta (con IVA 19% incluido): débito/prepago 2,19% + IVA, crédito 2,60% + IVA.
// La app no separa débito de crédito, así que se usa un promedio con la mezcla real del portal
// (14-sep a 14-oct-2026): débito $443.980 + prepago $70.660 + crédito $103.080 = $617.720 → 16,69% crédito.
const COMISION_TARJETA_DEBITO = 0.0219 * 1.19;
const COMISION_TARJETA_CREDITO = 0.026 * 1.19;
const PCT_CREDITO_ESTIMADO = 0.1669; // proporción de crédito en las ventas con tarjeta (revisar cada tanto con el portal)
const COMISION_TARJETA = COMISION_TARJETA_DEBITO * (1 - PCT_CREDITO_ESTIMADO) + COMISION_TARJETA_CREDITO * PCT_CREDITO_ESTIMADO;

// Meses recientes (YYYY-MM) y nombre legible, para elegir a qué mes corresponde un gasto
const mesesRecientes = (n = 12) => { const out = []; const d = new Date(); for (let i = 0; i < n; i++) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`); } return out; };
const nombreMes = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("es-CL", { month: "long", year: "numeric" }); };

// Categoría contable de cada gasto (para el estado de resultados)
const GASTOS_OPERACIONALES = ["Gas / combustible", "Limpieza", "Toalla nova", "Guantes"];
const GASTOS_FIJOS = ["Patente y permisos", "Contador", "Publicidad", "Internet y celular", "Seguros", "Mantención camión", "Arriendo lugar"];
const GASTOS_INVERSION = ["Inversión / equipamiento"];
const GASTOS_RETIRO = ["Retiro de Caja"];
const GASTOS_PAGO_GUSTAVO = ["Pago sueldo Gustavo"];
// Gastos donde la cantidad no aporta (se asume 1 si se deja vacía)
// Estos movimientos no se le compran a nadie: el proveedor es opcional
const PROVEEDOR_OPCIONAL = [...GASTOS_RETIRO, ...GASTOS_PAGO_GUSTAVO];
const INSUMOS_SIN_CANTIDAD = [...GASTOS_RETIRO, ...GASTOS_PAGO_GUSTAVO, ...GASTOS_FIJOS, ...GASTOS_INVERSION, "Reparaciones"];
// Tipos que se pueden elegir al ingresar un gasto con "Otro" (o al reclasificarlo en el Historial)
const TIPOS_GASTO = [
  { id: "costo_ventas", label: "Costo de ventas", ayuda: "ingredientes y envases que van en el producto" },
  { id: "operacional", label: "Operacional", ayuda: "consumibles y utensilios chicos: guantes, toalla, gas, limpieza, canastillo" },
  { id: "fijo", label: "Costo fijo", ayuda: "patente, contador, arriendo, internet, seguros" },
  { id: "equipamiento", label: "Equipamiento / reparación (resta en el mes)", ayuda: "compras de equipos o reparaciones que quieres ver en el resultado del mes: canasto, plancha, reparación de agua" },
  { id: "inversion", label: "Inversión (aparte, no resta)", ayuda: "equipos grandes o que duran años: no resta del mes, aparece aparte" },
];
// Tipo extra: repartir un gasto en N meses. Se guarda en tipo_gasto como "cuotas:N" (sin columna nueva).
const TIPOS_GASTO_CON_CUOTAS = [...TIPOS_GASTO, { id: "cuotas", label: "Repartir en cuotas mensuales", ayuda: "el gasto se divide en partes iguales entre varios meses (desde el mes que corresponde)" }];
// Opciones para el selector de "Otro": incluye "No sé" para quien no sabe qué tipo elegir
const TIPOS_GASTO_OTRO = [...TIPOS_GASTO_CON_CUOTAS, { id: "revisar", label: "No sé: lo revisa Alejandro", ayuda: "queda como Sin clasificar y Alejandro lo corrige después en el Historial" }];
const cuotasDe = (g) => { const t = g && g.tipo_gasto; if (typeof t === "string" && t.startsWith("cuotas:")) { const n = parseInt(t.slice(7), 10); return n >= 2 ? n : 0; } return 0; };
// Cuota que cae en el mes `mes` (YYYY-MM) para un gasto repartido; null si ese mes no corresponde
const cuotaDelMes = (g, mes) => {
  const n = cuotasDe(g);
  if (!n) return null;
  const inicio = g.mes_corresponde || g.fecha.slice(0, 7);
  const [y1, m1] = inicio.split("-").map(Number);
  const [y2, m2] = mes.split("-").map(Number);
  const k = (y2 - y1) * 12 + (m2 - m1);
  if (k < 0 || k >= n) return null;
  const base = Math.floor(g.monto / n);
  return { cuota: k === n - 1 ? g.monto - base * (n - 1) : base, k, n }; // la última absorbe el redondeo
};
const categoriaGasto = (insumo, conocidos, tipoElegido) => {
  if (typeof tipoElegido === "string" && tipoElegido.startsWith("cuotas:")) return "cuotas";
  if (tipoElegido === "revisar") return "sin_clasificar"; // "No sé": lo revisa Alejandro
  if (tipoElegido && TIPOS_GASTO.some((t) => t.id === tipoElegido)) return tipoElegido;
  if (GASTOS_RETIRO.includes(insumo)) return "retiro";
  if (GASTOS_PAGO_GUSTAVO.includes(insumo)) return "pago_gustavo";
  if (GASTOS_INVERSION.includes(insumo)) return "inversion";
  if (GASTOS_FIJOS.includes(insumo)) return "fijo";
  if (insumo === "Reparaciones") return "equipamiento";
  if (GASTOS_OPERACIONALES.includes(insumo)) return "operacional";
  if (["ciboulette y cilantro"].includes((insumo || "").trim().toLowerCase())) return "costo_ventas";
  if ((INSUMOS_BASE.includes(insumo) && insumo !== "Otro") || resolverInsumo(insumo)) return "costo_ventas";
  if (conocidos && conocidos.some((n) => normNombre(n) === normNombre(insumo))) return "costo_ventas";
  return "sin_clasificar";
};
// Normaliza nombres de insumos (mayúsculas, espacios y acentos) para no mostrar duplicados
const normNombre = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
const nombreCanonico = (insumo) => {
  const n = normNombre(insumo);
  const base = INSUMOS_BASE.find((b) => b !== "Otro" && normNombre(b) === n);
  if (base) return base;
  return resolverInsumo(insumo) || (insumo || "").trim();
};
// Nombres antiguos que no deben ofrecerse más en el desplegable (sus gastos siguen contando)
const EXCLUIR_DEL_DESPLEGABLE = ["ciboulette y cilantro"];

const CATEGORIAS = [
  { id: "completos", label: "Completos", emoji: "🌭" },
  { id: "pollo", label: "Pollo", emoji: "🍗" },
  { id: "churrasco", label: "Churrasco", emoji: "🥩" },
  { id: "papas", label: "Picoteo", emoji: "🍟" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤" },
  { id: "agregados", label: "Agregados", emoji: "➕" },
  { id: "combos", label: "Combos", emoji: "🎁" },
];

const INGREDIENTES_BASE = {
  completos: [{ insumo: "Pan para completo", gramos: 1 },{ insumo: "Salchicha 17 cm", gramos: 1 }],
  pollo: [{ insumo: "Pan para Sandwich Castaño", gramos: 1 },{ insumo: "Chicken Fingers", gramos: 3 }],
  churrasco: [{ insumo: "Pan para Sandwich Castaño", gramos: 1 },{ insumo: "Churrascos", gramos: 3 }],
  papas: [], bebidas: [], agregados: [], combos: [],
};

const RECETA_MAYONESA_CASERA = [
  { insumo: "Mayonesa en Polvo", gramos: 25 },
  { insumo: "Aceite para Mayonesa Casera", gramos: 500 },
  { insumo: "Ciboulette", gramos: 1 },
  { insumo: "Cilantro", gramos: 1 },
  { insumo: "Mostaza", gramos: 10 },
];
const RENDIMIENTO_MAYONESA_CASERA_G = 600; // rinde 600g

const RECETAS_EJEMPLO = [
  { nombre_producto: "Italiano", categoria: "completos", precio_venta: 4100, precio_py: 5535, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Palta", gramos: 40 },{ insumo: "Tomate", gramos: 30 },{ insumo: "Mayonesa casera", gramos: 25 }] },
  { nombre_producto: "Highway to Hell", categoria: "completos", precio_venta: 4600, precio_py: 6210, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Cebolla caramelizada", gramos: 40 },{ insumo: "Pepinillos", gramos: 20 },{ insumo: "Tocino", gramos: 30 }] },
  { nombre_producto: "Torn and Frayed", categoria: "completos", precio_venta: 4600, precio_py: 6210, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Cebolla caramelizada", gramos: 40 },{ insumo: "Papas hilo", gramos: 20 }] },
  { nombre_producto: "Purple Haze", categoria: "completos", precio_venta: 4600, precio_py: 6210, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Chucrut morado", gramos: 30 },{ insumo: "Pepinillos", gramos: 20 },{ insumo: "Tocino", gramos: 30 }] },
  { nombre_producto: "Dinámico", categoria: "completos", precio_venta: 4900, precio_py: 6615, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Palta", gramos: 40 },{ insumo: "Tomate", gramos: 30 },{ insumo: "Chucrut", gramos: 20 },{ insumo: "Salsa americana", gramos: 15 },{ insumo: "Mayonesa casera", gramos: 20 }] },
  { nombre_producto: "Paradise City", categoria: "completos", precio_venta: 4900, precio_py: 6615, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Palta", gramos: 40 },{ insumo: "Tomate", gramos: 30 },{ insumo: "Cebolla caramelizada", gramos: 30 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Ají en Pasta", gramos: 10 }] },
  { nombre_producto: "Sweet Child O' Mine", categoria: "completos", precio_venta: 4900, precio_py: 6615, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Cebolla caramelizada", gramos: 40 },{ insumo: "Queso fundido", gramos: 30 }] },
  { nombre_producto: "Pollo Highway to Hell", categoria: "pollo", precio_venta: 4500, precio_py: 6075, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Fingers de pollo", gramos: 100 },{ insumo: "Mayonesa casera", gramos: 20 },{ insumo: "Pepinillos", gramos: 15 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Welcome to the Jungle", categoria: "pollo", precio_venta: 4500, precio_py: 6075, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Fingers de pollo", gramos: 100 },{ insumo: "Salsa americana", gramos: 20 },{ insumo: "Cebolla caramelizada", gramos: 30 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Rock You Like a Hurricane", categoria: "pollo", precio_venta: 4500, precio_py: 6075, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Fingers de pollo", gramos: 100 },{ insumo: "Chucrut", gramos: 25 },{ insumo: "Mostaza", gramos: 15 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Back in Black", categoria: "pollo", precio_venta: 4900, precio_py: 6615, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Fingers de pollo", gramos: 100 },{ insumo: "BBQ", gramos: 20 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Thunderstruck", categoria: "pollo", precio_venta: 4900, precio_py: 6615, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Fingers de pollo", gramos: 100 },{ insumo: "Mostaza", gramos: 15 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Smoke on the Water", categoria: "pollo", precio_venta: 5200, precio_py: 7020, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Fingers de pollo", gramos: 100 },{ insumo: "BBQ", gramos: 20 },{ insumo: "Cebolla caramelizada", gramos: 30 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Highway to Hell", categoria: "churrasco", precio_venta: 5200, precio_py: 7020, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Churrasco", gramos: 120 },{ insumo: "Mayonesa casera", gramos: 20 },{ insumo: "Pepinillos", gramos: 15 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Welcome to the Jungle", categoria: "churrasco", precio_venta: 5200, precio_py: 7020, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Churrasco", gramos: 120 },{ insumo: "Salsa americana", gramos: 20 },{ insumo: "Cebolla caramelizada", gramos: 30 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Rock You Like a Hurricane", categoria: "churrasco", precio_venta: 5200, precio_py: 7020, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Churrasco", gramos: 120 },{ insumo: "Chucrut", gramos: 25 },{ insumo: "Mostaza", gramos: 15 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Back in Black", categoria: "churrasco", precio_venta: 5700, precio_py: 7695, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Churrasco", gramos: 120 },{ insumo: "BBQ", gramos: 20 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Thunderstruck", categoria: "churrasco", precio_venta: 5700, precio_py: 7695, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Churrasco", gramos: 120 },{ insumo: "Mostaza", gramos: 15 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Smoke on the Water", categoria: "churrasco", precio_venta: 5900, precio_py: 7965, ingredientes: [{ insumo: "Pan brioche", gramos: 90 },{ insumo: "Churrasco", gramos: 120 },{ insumo: "BBQ", gramos: 20 },{ insumo: "Cebolla caramelizada", gramos: 30 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Papas fritas", categoria: "papas", precio_venta: 2900, precio_py: 3915, ingredientes: [{ insumo: "Papas fritas", gramos: 300 }] },
  { nombre_producto: "Salchipapas", categoria: "papas", precio_venta: 3600, precio_py: 4860, ingredientes: [{ insumo: "Papas fritas", gramos: 300 },{ insumo: "Vienesa", gramos: 80 }] },
  { nombre_producto: "Salchipapas con tocino", categoria: "papas", precio_venta: 4500, precio_py: 6075, ingredientes: [{ insumo: "Papas fritas", gramos: 300 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Tocino", gramos: 30 }] },
  { nombre_producto: "Papas tocino y cebolla", categoria: "papas", precio_venta: 4000, precio_py: 5400, ingredientes: [{ insumo: "Papas fritas", gramos: 300 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Cebolla caramelizada", gramos: 40 }] },
  { nombre_producto: "Papas queso fundido y tocino", categoria: "papas", precio_venta: 4000, precio_py: 5400, ingredientes: [{ insumo: "Papas fritas", gramos: 300 },{ insumo: "Queso fundido", gramos: 40 },{ insumo: "Tocino", gramos: 30 }] },
  { nombre_producto: "Papas con nuggets", categoria: "papas", precio_venta: 4500, precio_py: 6075, ingredientes: [{ insumo: "Papas fritas", gramos: 300 },{ insumo: "Nuggets", gramos: 6 }] },
  { nombre_producto: "Papas con nuggets (12 und)", categoria: "papas", precio_venta: 5300, precio_py: 7155, ingredientes: [{ insumo: "Papas fritas", gramos: 300 },{ insumo: "Nuggets", gramos: 12 }] },
  { nombre_producto: "Lata 250ml", categoria: "bebidas", precio_venta: 1500, precio_py: 2025, ingredientes: [] },
  { nombre_producto: "Queso fundido", categoria: "agregados", precio_venta: 1000, precio_py: 1350, ingredientes: [{ insumo: "Queso fundido", gramos: 40 }] },
  { nombre_producto: "Tocino agregado", categoria: "agregados", precio_venta: 1000, precio_py: 1350, ingredientes: [{ insumo: "Tocino", gramos: 30 }] },
];

const INSUMOS_EJEMPLO = [
  { nombre: "Aceite para Freir", precio_por_kg: 2460, unidad: "litro" },
  { nombre: "Aceite para Mayonesa Casera", precio_por_kg: 1.61, unidad: "ml" },
  { nombre: "Aji Verde", precio_por_kg: 5000, unidad: "kg" },
  { nombre: "Ají en Pasta", precio_por_kg: 5000, unidad: "kg" },
  { nombre: "Bebida lata 350 ml", precio_por_kg: 932, unidad: "unidad" },
  { nombre: "Cebolla Caramelizada", precio_por_kg: 2000, unidad: "kg" },
  { nombre: "Chicken Fingers", precio_por_kg: 233, unidad: "unidad" },
  { nombre: "Chucrut", precio_por_kg: 3500, unidad: "kg" },
  { nombre: "Churrascos", precio_por_kg: 306, unidad: "unidad" },
  { nombre: "Ciboulette", precio_por_kg: 900, unidad: "unidad" },
  { nombre: "Cilantro", precio_por_kg: 900, unidad: "unidad" },
  { nombre: "Envase para Papas / Sandwich/ PY", precio_por_kg: 130, unidad: "unidad" },
  { nombre: "Envases para completos", precio_por_kg: 41, unidad: "unidad" },
  { nombre: "Ketchup", precio_por_kg: 2100, unidad: "kg" },
  { nombre: "Mayonesa", precio_por_kg: 1880, unidad: "kg" },
  { nombre: "Mayonesa Casera", precio_por_kg: 5023, unidad: "kg" },
  { nombre: "Mayonesa en Polvo", precio_por_kg: 15780, unidad: "kg" },
  { nombre: "Mostaza", precio_por_kg: 1433, unidad: "kg" },
  { nombre: "Nuggets pollo", precio_por_kg: 80, unidad: "unidad" },
  { nombre: "Palta", precio_por_kg: 6129, unidad: "kg" },
  { nombre: "Pan para completo", precio_por_kg: 300, unidad: "unidad" },
  { nombre: "Pan para Sandwich Castaño", precio_por_kg: 449, unidad: "unidad" },
  { nombre: "Papas fritas", precio_por_kg: 1650, unidad: "kg" },
  { nombre: "Papas Hilo", precio_por_kg: 5000, unidad: "kg" },
  { nombre: "Pepinillo", precio_por_kg: 3650, unidad: "kg" },
  { nombre: "Queso cheddar", precio_por_kg: 129, unidad: "unidad" },
  { nombre: "Queso Normal", precio_por_kg: 10000, unidad: "kg" },
  { nombre: "Salchichas 17 cm", precio_por_kg: 528, unidad: "unidad" },
  { nombre: "Salsa Americana", precio_por_kg: 5500, unidad: "kg" },
  { nombre: "Salsa BBQ", precio_por_kg: 8333, unidad: "kg" },
  { nombre: "Servilletas", precio_por_kg: 6, unidad: "unidad" },
  { nombre: "Tocino", precio_por_kg: 19100, unidad: "kg" },
  { nombre: "Tomate", precio_por_kg: 1290, unidad: "kg" },
];

export default function App() {
  const [view, setView] = useState("home");
  const [persona, setPersona] = useState("");

  // Gastos
  const [gastos, setGastos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gastosView, setGastosView] = useState("nuevo");
  const [form, setForm] = useState({ fecha: today(), insumo: INSUMOS_BASE[0], insumoCustom: "", tipoGasto: "", mesCorresponde: "", cantidad: "", unidad: UNIDAD_DEFAULT_INSUMO[INSUMOS_BASE[0]] || "unidad", fondo: FONDOS[0], proveedor: "", proveedorCustom: "", monto: "", nota: "" });
  const [filtro, setFiltro] = useState({ mes: "", insumo: "", persona: "", revisar: false, sinProv: false });

  // Ventas
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [ventaView, setVentaView] = useState("registrar");
  const [catActiva, setCatActiva] = useState("completos");
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [fechaVenta, setFechaVenta] = useState(today());
  const [savingVenta, setSavingVenta] = useState(false);
  const [filtroVentas, setFiltroVentas] = useState({ mes: "", metodo: "" });
  const [rangoDesde, setRangoDesde] = useState("");
  const [rangoHasta, setRangoHasta] = useState("");
  const [porProdModo, setPorProdModo] = useState("producto"); // "producto" | "categoria"
  const [catAbierta, setCatAbierta] = useState(null);
  const [dashDesde, setDashDesde] = useState("");
  const [dashHasta, setDashHasta] = useState("");
  const [dashVerTodosProd, setDashVerTodosProd] = useState(false);
  const [dashModoGrafico, setDashModoGrafico] = useState("diario"); // "diario" | "acumulado"
  const [insightTab, setInsightTab] = useState("horas"); // "horas" | "dias" | "mapa"
  const [erAbierto, setErAbierto] = useState({}); // líneas del estado de resultados con el desglose abierto
  const [reclasModal, setReclasModal] = useState(null); // gasto que se está reclasificando
  const [reclasTipo, setReclasTipo] = useState("");
  const [motivoAjuste, setMotivoAjuste] = useState(""); // motivo opcional de las diferencias al ajustar inventario
  const [resumenInsMes, setResumenInsMes] = useState("");
  const [resumenInsAbierto, setResumenInsAbierto] = useState(null);
  const [resumenInsVista, setResumenInsVista] = useState("insumos"); // "insumos" | "proveedor" | "consumo"
  // Consumo de botillería (productos que se sacan para uso interno y no se venden)
  const [botilleriaMode, setBotilleriaMode] = useState(false);
  const [botQ, setBotQ] = useState("");
  const [botCargando, setBotCargando] = useState(false);
  const [botError, setBotError] = useState("");
  const [botResultados, setBotResultados] = useState(null); // null = sin buscar
  const [botProducto, setBotProducto] = useState(null);
  const [botRegistro, setBotRegistro] = useState(null);
  const [botCantidad, setBotCantidad] = useState("1");
  const [botTipo, setBotTipo] = useState("");
  const [botTipoRecordado, setBotTipoRecordado] = useState(false); // la categoría viene de un consumo anterior
  const [botTipoSugerido, setBotTipoSugerido] = useState(false); // la categoría se sugirió por el nombre del producto
  const [botCamAbierta, setBotCamAbierta] = useState(false);
  const [botCamError, setBotCamError] = useState("");
  const botVideoRef = useRef(null);
  const botCamRef = useRef({ stream: null, interval: null, reader: null });
  // Destino de los retiros de caja
  const [retiroDestino, setRetiroDestino] = useState("sueldo"); // "sueldo" | "socio"
  const [retiroSocio, setRetiroSocio] = useState("");
  const [retiroModal, setRetiroModal] = useState(null); // retiro del Historial al que se le asigna destino
  const [retiroModalDest, setRetiroModalDest] = useState("sueldo");
  const [retiroModalSocio, setRetiroModalSocio] = useState("");
  const [retiroModalMes, setRetiroModalMes] = useState("");
  const [provModal, setProvModal] = useState(null); // gasto al que se le asigna proveedor
  const [provModalValor, setProvModalValor] = useState("");
  const [provModalNuevo, setProvModalNuevo] = useState("");
  const [inversionModo, setInversionModo] = useState("aparte"); // "aparte" | "mes" | "cuotas": cómo se refleja una compra de equipamiento
  const [cuotasN, setCuotasN] = useState("12"); // meses en que se reparte un gasto
  const [verEstadoResultados, setVerEstadoResultados] = useState(false);
  const [estadoMes, setEstadoMes] = useState("");
  const [insumoDetalle, setInsumoDetalle] = useState(null); // insumo clave seleccionado para ver de qué productos sale su consumo
  const [descuentoModal, setDescuentoModal] = useState(null);
  const [descuentoTipo, setDescuentoTipo] = useState("");
  const [descuentoPct, setDescuentoPct] = useState("");
  const [cortesiaDueno, setCortesiaDueno] = useState("");
  const [dashPeriodo, setDashPeriodo] = useState("mes");
  const [dashMesElegido, setDashMesElegido] = useState("");
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);

  // Recetas
  const [insumosPrecio, setInsumosPrecio] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [recetaView, setRecetaView] = useState("margenes");
  const [recetaCatActiva, setRecetaCatActiva] = useState("completos");
  const [precioVentaEdit, setPrecioVentaEdit] = useState({}); // { recetaId: valor }
  const [precioASEdit, setPrecioASEdit] = useState({}); // { recetaId: valor }
  const [confirmarPrecioModal, setConfirmarPrecioModal] = useState(null);
  const [formInsumo, setFormInsumo] = useState({ nombre: "", precio_por_kg: "", unidad: "kg", alerta_bajo: "", alerta_critico: "" });
  const [editInsumoId, setEditInsumoId] = useState(null);
  const [formReceta, setFormReceta] = useState({ nombre_producto: "", categoria: "completos", precio_venta: "", precio_py: "", descripcion_menu: "", ingredientes: [], productos_combo: [] });
  const [editRecetaId, setEditRecetaId] = useState(null);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({ insumo: "", gramos: "" });
  const [nuevoProductoCombo, setNuevoProductoCombo] = useState("");
  const [editGramos, setEditGramos] = useState({});
  const [porcentajePY, setPorcentajePY] = useState(35);
  const [turnoActivo, setTurnoActivo] = useState(null); // turno abierto actual
  const [historialTurnos, setHistorialTurnos] = useState([]);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalReabrir, setModalReabrir] = useState(false);
  const [saldoApertura, setSaldoApertura] = useState("");
  const [saldoContado, setSaldoContado] = useState("");
  const [claveSupervisor, setClaveSupervisor] = useState("");
  const [errorSupervisor, setErrorSupervisor] = useState(false);
  const [ultimoCierre, setUltimoCierre] = useState(null);

  // Resumen
  const [filtroResumen, setFiltroResumen] = useState("");
  const [inventarioInicial, setInventarioInicial] = useState([]);
  const [historialInventario, setHistorialInventario] = useState([]);
  const [modalAjuste, setModalAjuste] = useState(false);
  const [ajusteClave, setAjusteClave] = useState("");
  const [ajusteError, setAjusteError] = useState(false);
  const [ajusteValues, setAjusteValues] = useState({});
  const [verHistorialAjuste, setVerHistorialAjuste] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [modalActualizarPrecio, setModalActualizarPrecio] = useState(null);

  // Admin
  const ADMIN_CLAVE = "1232026";
  const SUPERVISOR_CLAVE = "72012026";

  // EmailJS
  const EMAILJS_SERVICE = "service_v3p46hv";
  const EMAILJS_TEMPLATE = "template_wii069o";
  const EMAILJS_KEY = "0k2rM-U1xXPh43usT";

  const enviarEmail = async (tipo_turno, mensaje) => {
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE,
          template_id: EMAILJS_TEMPLATE,
          user_id: EMAILJS_KEY,
          template_params: { tipo_turno, message: mensaje, name: "Don Abel", email: "a.monsalves1981@gmail.com" },
        }),
      });
      const txt = await res.text();
      if (!res.ok) {
        console.error("EmailJS error:", res.status, txt);
        alert("❌ Email falló (" + res.status + "): " + txt.slice(0, 200));
      } else {
        console.log("EmailJS OK:", txt);
      }
    } catch (e) {
      console.error("Error email:", e);
      alert("❌ Error de red al enviar email: " + e.message);
    }
  };
  const [adminModal, setAdminModal] = useState(null);
  const [adminClave, setAdminClave] = useState("");
  const [adminError, setAdminError] = useState(false);

  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (view === "home") { cargarGastos(); cargarVentas(); cargarRecetas(); }
    if (view === "gastos") { cargarGastos(); cargarVentas(); cargarInventarioInicial(); if (recetas.length === 0) cargarRecetas(); setForm((f) => ({ ...f, fecha: today() })); }
    if (view === "ventas") { cargarVentas(); cargarGastos(); cargarRecetas(); cargarTurno(); setFechaVenta(today()); if (persona === "Alejandro") cargarHistorialTurnos(); }
    if (view === "resumen") { cargarGastos(); cargarVentas(); cargarRecetas(); cargarInventarioInicial(); }
    if (view === "recetas") { cargarRecetas(); cargarConfig(); }
  }, [view]);

  // Búsqueda en la hoja de la botillería (misma consulta que usa el buscador de precios)
  const botSinEspera = useRef(false); // true cuando la búsqueda viene del escáner: se hace al tiro
  const botCache = useRef({}); // resultados recientes: { texto: { t, grupos } }
  useEffect(() => {
    if (!botilleriaMode) return;
    const q = botQ.trim();
    if (q.length < 2) { setBotResultados(null); setBotError(""); setBotCargando(false); return; }
    const clave = q.toLowerCase();
    const enCache = botCache.current[clave];
    if (enCache && Date.now() - enCache.t < 10 * 60 * 1000) { setBotResultados(enCache.grupos); setBotError(""); setBotCargando(false); return; }
    let vigente = true;
    const controlador = new AbortController();
    const espera = botSinEspera.current ? 0 : 400;
    botSinEspera.current = false;
    if (espera === 0) setBotCargando(true);
    const t = setTimeout(async () => {
      setBotCargando(true); setBotError("");
      const limite = setTimeout(() => controlador.abort(), 15000);
      try {
        const res = await fetch(BOTILLERIA_URL + "?codigo=" + encodeURIComponent(q) + "&proveedor=ALL", { signal: controlador.signal });
        const data = await res.json();
        if (!vigente) return;
        const grupos = {};
        (Array.isArray(data) ? data : []).forEach((r) => { const n = r.nombre || "—"; (grupos[n] = grupos[n] || []).push(r); });
        const lista = Object.entries(grupos).map(([nombre, registros]) => ({ nombre, registros }));
        if (lista.length > 0) botCache.current[clave] = { t: Date.now(), grupos: lista };
        setBotResultados(lista);
      } catch (e) {
        if (!vigente) return;
        setBotError(e && e.name === "AbortError" ? "La botillería tardó demasiado en responder. Intenta de nuevo." : "No se pudo consultar la botillería. Intenta de nuevo.");
        setBotResultados(null);
      }
      clearTimeout(limite);
      if (vigente) setBotCargando(false);
    }, espera);
    return () => { vigente = false; clearTimeout(t); controlador.abort(); };
  }, [botQ, botilleriaMode]);

  // Al abrir el modo botillería se "despierta" el script de Google, para que la primera búsqueda no parta en frío
  useEffect(() => {
    if (botilleriaMode) fetch(BOTILLERIA_URL + "?codigo=__ping__&proveedor=ALL").catch(() => {});
  }, [botilleriaMode]);

  // La cámara se apaga al salir del modo botillería, de la pantalla de gastos o de la app
  useEffect(() => { if (!botilleriaMode || view !== "gastos") { stopCamHardware(); setBotCamAbierta(false); } }, [botilleriaMode, view]);
  useEffect(() => () => stopCamHardware(), []);

  const cargarGastos = async () => {
    setLoading(true);
    let todos = [];
    let desde = 0;
    const tamañoPagina = 1000;
    while (true) {
      const { data, error } = await supabase.from("gastos").select("*").order("created_at", { ascending: false }).range(desde, desde + tamañoPagina - 1);
      if (error || !data || data.length === 0) break;
      todos = todos.concat(data);
      if (data.length < tamañoPagina) break;
      desde += tamañoPagina;
    }
    setGastos(todos);
    setProveedores([...new Set(todos.map((g) => normProv(g.proveedor)).filter(Boolean))].sort());
    setLoading(false);
  };

  const cargarVentas = async () => {
    setLoadingVentas(true);
    let todas = [];
    let desde = 0;
    const tamañoPagina = 1000;
    while (true) {
      const { data, error } = await supabase.from("ventas").select("*").order("created_at", { ascending: false }).range(desde, desde + tamañoPagina - 1);
      if (error || !data || data.length === 0) break;
      todas = todas.concat(data);
      if (data.length < tamañoPagina) break;
      desde += tamañoPagina;
    }
    setVentas(todas);
    setLoadingVentas(false);
  };

  const cargarRecetas = async () => {
    setLoadingRecetas(true);
    const [{ data: ins }, { data: rec }] = await Promise.all([
      supabase.from("insumos_precio").select("*").order("nombre"),
      supabase.from("recetas").select("*").order("nombre_producto"),
    ]);
    if (ins && ins.length === 0) {
      await supabase.from("insumos_precio").insert(INSUMOS_EJEMPLO);
      const { data: ins2 } = await supabase.from("insumos_precio").select("*").order("nombre");
      setInsumosPrecio(ins2 || []);
    } else setInsumosPrecio(ins || []);
    if (rec && rec.length === 0) {
      await supabase.from("recetas").insert(RECETAS_EJEMPLO);
      const { data: rec2 } = await supabase.from("recetas").select("*").order("nombre_producto");
      setRecetas(rec2 || []);
    } else setRecetas(rec || []);
    setLoadingRecetas(false);
  };

  const cargarConfig = async () => {
    const { data } = await supabase.from("config").select("*").eq("id", "general").single();
    if (data) setPorcentajePY(data.porcentaje_py || 35);
  };

  const cargarInventarioInicial = async () => {
    const { data } = await supabase.from("inventario_inicial").select("*").order("created_at", { ascending: false });
    if (data) {
      // Solo el ultimo ajuste por insumo (usado como stock base)
      const ultimoPorInsumo = {};
      data.forEach((d) => { if (!ultimoPorInsumo[d.insumo]) ultimoPorInsumo[d.insumo] = d; });
      setInventarioInicial(Object.values(ultimoPorInsumo));
      // Historial completo (todas las modificaciones), para mostrar registro
      setHistorialInventario(data);
    }
  };

  const guardarAjusteInventario = async () => {
    if (!persona) { showToast("Selecciona quién hace el ajuste"); return; }
    if (ajusteClave !== ADMIN_CLAVE) { setAjusteError(true); return; }
    const rows = Object.entries(ajusteValues)
      .map(([insumo, v]) => [insumo, String(v).trim().replace(",", ".")])
      .filter(([_, v]) => v !== "" && !isNaN(Number(v)))
      .map(([insumo, v]) => {
        const ins = insumosPrecio.find((i) => i.nombre === insumo);
        return { insumo, cantidad: Number(v), unidad: ins?.unidad || "unidad", fecha: today(), persona: persona || "Sin nombre", ...(motivoAjuste ? { motivo: motivoAjuste } : {}) };
      });
      // Nota: siempre se guarda con la fecha de hoy, aunque el valor sea igual al ajuste
      // anterior — es lo que fija el nuevo punto de partida para compras/consumo.
    if (rows.length === 0) { showToast("Ingresa al menos un valor"); return; }
    let { error: errAjuste } = await supabase.from("inventario_inicial").insert(rows);
    if (errAjuste && motivoAjuste) {
      // Probablemente falta la columna "motivo": se guarda igual, sin el motivo
      const sinMotivo = rows.map(({ motivo, ...resto }) => resto);
      const r2 = await supabase.from("inventario_inicial").insert(sinMotivo);
      errAjuste = r2.error;
      if (!errAjuste) showToast("Guardado sin motivo: falta la columna 'motivo' en Supabase");
    }
    if (errAjuste) { console.error("Error al guardar ajuste:", errAjuste); showToast("❌ Error: " + errAjuste.message); return; }
    setMotivoAjuste("");
    setAjusteValues({});
    setAjusteClave("");
    setAjusteError(false);
    setModalAjuste(false);
    await cargarInventarioInicial();
    showToast("✓ Inventario actualizado");
  };

  const cargarTurno = async () => {
    const { data } = await supabase.from("turnos").select("*").order("created_at", { ascending: false }).limit(2);
    if (data && data.length > 0) {
      const ultimo = data[0];
      if (ultimo.tipo === "apertura") setTurnoActivo(ultimo);
      else { setTurnoActivo(null); setUltimoCierre(ultimo); }
      if (data.length > 1 && data[0].tipo === "apertura") setUltimoCierre(data[1]);
    }
  };

  const cargarHistorialTurnos = async () => {
    const { data } = await supabase.from("turnos").select("*").order("created_at", { ascending: false }).limit(200);
    if (data) setHistorialTurnos(data);
  };

  const abrirCaja = async () => {
    if (saldoApertura === "") { showToast("Ingresa el saldo"); return; }
    const saldo = Number(saldoApertura.replace(/[^0-9]/g, ""));
    const diferencia = ultimoCierre ? saldo - ultimoCierre.saldo_final : 0;
    const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const { data } = await supabase.from("turnos").insert([{ tipo: "apertura", persona: persona || "Sin nombre", saldo_inicial: saldo, diferencia, nota: diferencia !== 0 ? `Diferencia con cierre anterior: ${fmt(diferencia)}` : null }]).select().single();
    if (data) {
      setTurnoActivo(data);
      setModalApertura(false);
      setSaldoApertura("");
      const msg = `🟢 APERTURA DE CAJA
Persona: ${persona || "Sin nombre"}
Hora: ${hora}
Saldo inicial: ${fmt(saldo)}${diferencia !== 0 ? `
Diferencia con cierre anterior: ${fmt(diferencia)}` : ""}`;
      await enviarEmail("🟢 Apertura", msg);
      showToast("✓ Caja abierta");
    }
  };

  const calcularResumenTurno = () => {
    if (!turnoActivo) return null;
    const ventasTurno = ventas.filter((v) => {
      if (esComponente(v)) return false;
      return new Date(v.created_at) >= new Date(turnoActivo.created_at);
    });
    const efectivo = ventasTurno.filter((v) => v.metodo_pago === "Efectivo").reduce((s, v) => s + v.total, 0);
    const tarjeta = ventasTurno.filter((v) => v.metodo_pago === "Tarjeta").reduce((s, v) => s + v.total, 0);
    const py = ventasTurno.filter((v) => v.metodo_pago === "Pedidos Ya").reduce((s, v) => s + v.total, 0);
    const cortesiasTurno = ventasTurno.filter((v) => { try { return JSON.parse(v.nota || "{}").tipo === "cortesia"; } catch { return false; } });
    const gastosTurno = gastos.filter((g) => g.fondo === "Efectivo foodtruck" && new Date(g.created_at) >= new Date(turnoActivo.created_at)).reduce((s, g) => s + g.monto, 0);
    const efectivoEsperado = turnoActivo.saldo_inicial + efectivo - gastosTurno;
    return { ventasTurno, efectivo, tarjeta, py, cortesiasTurno, gastosTurno, efectivoEsperado };
  };

  const cerrarCaja = async (saldoFinal) => {
    const resumen = calcularResumenTurno();
    if (!resumen) return;
    const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const diferencia = saldoFinal - resumen.efectivoEsperado;
    await supabase.from("turnos").insert([{ tipo: "cierre", persona: persona || "Sin nombre", saldo_inicial: turnoActivo.saldo_inicial, saldo_final: saldoFinal, diferencia, ventas_efectivo: resumen.efectivo, ventas_tarjeta: resumen.tarjeta, ventas_py: resumen.py, cortesias: resumen.cortesiasTurno.length }]);
    setTurnoActivo(null);
    setModalCierre(false);
    await cargarTurno();
    const msg = `🔴 CIERRE DE CAJA
Persona: ${persona || "Sin nombre"}
Hora: ${hora}
Saldo inicial: ${fmt(turnoActivo.saldo_inicial)}
Ventas efectivo: ${fmt(resumenTurno.efectivo)}
Gastos efectivo: ${fmt(resumenTurno.gastosTurno)}
Efectivo esperado: ${fmt(resumenTurno.efectivoEsperado)}
Saldo final contado: ${fmt(saldoFinal)}
Diferencia: ${fmt(diferencia)}
Tarjeta: ${fmt(resumenTurno.tarjeta)}
Pedidos Ya: ${fmt(resumenTurno.py)}
Cortesías: ${resumen.cortesiasTurno.length}`;
    await enviarEmail("🔴 Cierre", msg);
    showToast("✓ Caja cerrada");
  };

  const INSUMOS_REPORTE_CONSUMO = ["Papas fritas", "Salchichas 17 cm", "Chicken Fingers", "Tocino", "Churrascos", "Palta", "Tomate"];

  const calcularConsumoInsumosPorRango = (ventasEnRango, recetasData) => {
    const consumo = {};
    INSUMOS_REPORTE_CONSUMO.forEach((n) => { consumo[n] = 0; });
    ventasEnRango.forEach((v) => {
      const rec = recetasData.find((r) => r.nombre_producto === v.producto);
      if (!rec || !rec.ingredientes) return;
      const ingredientesUso = ingredientesEfectivos(rec, parseNota(v));
      ingredientesUso.forEach((ing) => {
        if (!INSUMOS_REPORTE_CONSUMO.includes(ing.insumo)) return;
        consumo[ing.insumo] += (ing.gramos || 0) * v.cantidad;
      });
    });
    return consumo;
  };

  const calcularStock = (gastosData, ventasData, recetasData, insumosData) => {
    // 1. Inventario inicial por insumo, con el MOMENTO EXACTO (fecha+hora) de SU PROPIO último ajuste
    const invInicialMap = {};
    inventarioInicial.forEach((inv) => {
      invInicialMap[inv.insumo] = { valor: aGramos(inv.cantidad, inv.unidad), corte: inv.created_at };
    });

    // 2. Sumar compras DESDE el momento exacto del último ajuste DE ESE INSUMO (no de otros)
    const compras = {};
    gastosData.forEach((g) => {
      const insumoRef = resolverInsumo(g.insumo);
      if (!insumoRef) return;
      const corte = invInicialMap[insumoRef]?.corte;
      if (corte && g.created_at < corte) return;
      if (!compras[insumoRef]) compras[insumoRef] = 0;
      compras[insumoRef] += aGramos(g.cantidad, g.unidad);
    });

    // 3. Sumar consumo DESDE el momento exacto del último ajuste DE ESE INSUMO
    const consumo = {};
    ventasData.forEach((v) => {
      const rec = recetasData.find((r) => r.nombre_producto === v.producto);
      if (!rec || !rec.ingredientes) return;
      const ingredientesUso = ingredientesEfectivos(rec, parseNota(v));
      ingredientesUso.forEach((ing) => {
        const ins = insumosData.find((i) => i.nombre === ing.insumo);
        if (!ins) return;
        const corte = invInicialMap[ing.insumo]?.corte;
        if (corte && v.created_at < corte) return;
        if (!consumo[ing.insumo]) consumo[ing.insumo] = 0;
        consumo[ing.insumo] += ing.gramos * v.cantidad;
      });
    });

    // 4. Calcular stock disponible
    const insumosUnicos = [...new Set(Object.values(MAPA_INSUMOS))];
    return insumosUnicos.map((nombre) => {
      const ins = insumosData.find((i) => i.nombre === nombre);
      const inicial = invInicialMap[nombre]?.valor || 0;
      const comprado = compras[nombre] || 0;
      const consumido = (consumo[nombre] || 0) / (1 - (MERMA_INSUMOS[nombre] || 0)); // incluye la merma natural (ej: palta)
      const disponible = inicial + comprado - consumido;
      const unidad = ins?.unidad || "unidad";
      // Convertir disponible a unidad legible
      const esKgLitro = unidad === "kg" || unidad === "litro";
      const disponibleKg = esKgLitro ? disponible / 1000 : disponible;
      // Límites propios del insumo (en kg/litro/unidades) o por defecto
      const aGramosUmbral = (v) => esKgLitro ? Number(v) * 1000 : Number(v);
      const umbralCritico = ins?.alerta_critico != null ? aGramosUmbral(ins.alerta_critico) : (esKgLitro ? 500 : 5);
      const umbralBajo = Math.max(ins?.alerta_bajo != null ? aGramosUmbral(ins.alerta_bajo) : (esKgLitro ? 1000 : 10), umbralCritico);
      const alerta = disponible < umbralCritico ? "rojo" : disponible < umbralBajo ? "naranja" : "verde";
      return { nombre, comprado, consumido, disponible, disponibleKg, unidad, alerta, ins, inicial, umbralBajo, umbralCritico, esKgLitro };
    }).filter((x) => x.comprado > 0 || x.consumido > 0 || x.inicial > 0).sort((a, b) => {
      const ord = { rojo: 0, naranja: 1, verde: 2 };
      return ord[a.alerta] - ord[b.alerta];
    });
  };

  // Admin
  const solicitarEliminacion = (tipo, registro) => { setAdminModal({ tipo, registro }); setAdminClave(""); setAdminError(false); };
  const confirmarEliminacion = async () => {
    if (adminClave !== ADMIN_CLAVE) { setAdminError(true); return; }
    const { tipo, registro } = adminModal;
    const tabla = tipo === "venta" ? "ventas" : tipo === "receta" ? "recetas" : tipo === "insumo" ? "insumos_precio" : "gastos";
    // Un combo se guarda como una fila principal + una fila por cada producto interno (misma hora de registro)
    let idsComponentes = [];
    if (tipo === "venta") {
      try {
        const notaP = (() => { try { return JSON.parse(registro.nota || "{}"); } catch { return {}; } })();
        if (Array.isArray(notaP.productos) && !notaP.es_componente) {
          const { data: mismas } = await supabase.from("ventas").select("*").eq("created_at", registro.created_at);
          const cands = (mismas || []).filter((r) => { try { const n = JSON.parse(r.nota || "{}"); return n.es_componente === true && n.combo === notaP.combo; } catch { return false; } });
          notaP.productos.forEach((nombreProd) => {
            const r = cands.find((x) => x.producto === nombreProd && x.cantidad === registro.cantidad && !idsComponentes.includes(x.id));
            if (r) idsComponentes.push(r.id);
          });
        }
      } catch (e) { console.error("No se pudieron buscar los productos internos del combo:", e); }
    }
    await supabase.from(tabla).delete().eq("id", registro.id);
    if (idsComponentes.length > 0) await supabase.from("ventas").delete().in("id", idsComponentes);
    if (tipo !== "receta" && tipo !== "insumo") {
      await supabase.from("log_eliminaciones").insert([{ tipo, registro_id: registro.id, detalle: idsComponentes.length > 0 ? { ...registro, componentes_eliminados: idsComponentes } : registro, eliminado_por: persona || "desconocido" }]);
    }
    setAdminModal(null); setAdminClave("");
    showToast(idsComponentes.length > 0 ? "Eliminado (y sus productos del combo)" : "Eliminado");
    if (tipo === "venta") cargarVentas();
    else if (tipo === "receta" || tipo === "insumo") { setRecetas([]); setInsumosPrecio([]); cargarRecetas(); }
    else cargarGastos();
  };

  const confirmarProveedor = async () => {
    if (adminClave !== ADMIN_CLAVE) { setAdminError(true); return; }
    const nombre = provModalValor === "__nuevo__" ? normProv(provModalNuevo) : provModalValor;
    if (!nombre) { showToast("Elige el proveedor"); return; }
    const ids = provModal.bulk ? provModal.ids : [provModal.id];
    const { error } = await supabase.from("gastos").update({ proveedor: nombre }).in("id", ids);
    if (error) { console.error("Error al asignar proveedor:", error); showToast("❌ Error: " + error.message); return; }
    setProvModal(null); setAdminClave(""); setAdminError(false);
    showToast(ids.length > 1 ? `✓ Proveedor asignado a ${ids.length} gastos` : "✓ Proveedor asignado");
    cargarGastos();
  };

  const confirmarDestinoRetiro = async () => {
    if (adminClave !== ADMIN_CLAVE) { setAdminError(true); return; }
    const g = retiroModal;
    let cambios;
    if (retiroModalDest === "sueldo") {
      cambios = { insumo: "Pago sueldo Gustavo" };
      if (retiroModalMes && retiroModalMes !== g.fecha.slice(0, 7)) cambios.mes_corresponde = retiroModalMes;
      else if (g.mes_corresponde) cambios.mes_corresponde = null;
    } else {
      if (!retiroModalSocio) { showToast("Elige qué socio"); return; }
      cambios = { nota: `Retiro de ${retiroModalSocio}` + (g.nota ? " · " + g.nota : "") };
    }
    const { error } = await supabase.from("gastos").update(cambios).eq("id", g.id);
    if (error) { console.error("Error al asignar destino:", error); showToast("❌ Error: " + error.message); return; }
    setRetiroModal(null); setAdminClave(""); setAdminError(false);
    showToast(retiroModalDest === "sueldo" ? "✓ Registrado como sueldo de Gustavo" : "✓ Retiro de socio anotado");
    cargarGastos();
  };

  const confirmarReclasificacion = async () => {
    if (adminClave !== ADMIN_CLAVE) { setAdminError(true); return; }
    if (!reclasTipo) { showToast("Elige el tipo"); return; }
    const nRec = parseInt(cuotasN, 10);
    if (reclasTipo === "cuotas" && !(nRec >= 2 && nRec <= 60)) { showToast("Indica entre 2 y 60 meses"); return; }
    const idsRec = reclasModal.bulk ? reclasModal.ids : [reclasModal.id];
    const nuevoTipo = reclasTipo === "__auto__" ? null : (reclasTipo === "cuotas" ? `cuotas:${nRec}` : reclasTipo);
    const { error } = await supabase.from("gastos").update({ tipo_gasto: nuevoTipo }).in("id", idsRec);
    if (error) { console.error("Error al reclasificar:", error); showToast("❌ Error: " + error.message); return; }
    setReclasModal(null); setReclasTipo(""); setAdminClave(""); setAdminError(false);
    showToast(idsRec.length > 1 ? `✓ ${idsRec.length} gastos reclasificados` : "✓ Gasto reclasificado");
    cargarGastos();
  };

  // Precio normal con clave
  const solicitarCambioPrecio = (rec, valor) => { setConfirmarPrecioModal({ rec, valor, tipo: "normal" }); setAdminClave(""); setAdminError(false); };
  const solicitarCambioPrecioAS = (rec, valor) => { setConfirmarPrecioModal({ rec, valor, tipo: "as" }); setAdminClave(""); setAdminError(false); };
  const confirmarCambioPrecio = async () => {
    if (adminClave !== ADMIN_CLAVE) { setAdminError(true); return; }
    const { rec, valor, tipo } = confirmarPrecioModal;
    if (tipo === "as") {
      await supabase.from("recetas").update({ variante_as: { ...rec.variante_as, precio_venta: Number(valor) } }).eq("id", rec.id);
      setPrecioASEdit((p) => { const n = { ...p }; delete n[rec.id]; return n; });
    } else {
      await supabase.from("recetas").update({ precio_venta: Number(valor) }).eq("id", rec.id);
      setPrecioVentaEdit((p) => { const n = { ...p }; delete n[rec.id]; return n; });
    }
    setConfirmarPrecioModal(null); setAdminClave("");
    showToast("✓ Precio actualizado"); cargarRecetas();
  };

  // Precio PY directo sin clave
  const guardarPrecioPY = async (recId, valor) => {
    await supabase.from("recetas").update({ precio_py: Number(valor) }).eq("id", recId);
    showToast("✓ PY actualizado"); cargarRecetas();
  };

  // Gastos
  const agregarGasto = async () => {
    if (!persona) { showToast("Selecciona quién registra"); return; }
    // Todo lo necesario debe estar completo antes de guardar (se avisa qué falta)
    {
      const faltan = [];
      const err = {};
      if (!form.fecha) { faltan.push("fecha"); err._errorFecha = true; }
      if (!form.monto || !(Number(form.monto) > 0)) { faltan.push("monto"); err._errorMonto = true; }
      if (form.insumo === "Otro" && !(form.insumoCustom || "").trim()) { faltan.push("nombre del insumo"); err._errorOtro = true; }
      if (form.insumo === "Otro" && !form.tipoGasto) { faltan.push("tipo de gasto"); err._errorTipo = true; }
      if (!INSUMOS_SIN_CANTIDAD.includes(form.insumo) && !(Number(form.cantidad) > 0)) { faltan.push("cantidad"); err._errorCantidad = true; }
      const provOk = PROVEEDOR_OPCIONAL.includes(form.insumo) || (form.proveedor === "__nuevo__" ? !!normProv(form.proveedorCustom) : !!form.proveedor);
      if (!provOk) { faltan.push("proveedor"); err._errorProveedor = true; }
      if (form.insumo === "Retiro de Caja" && retiroDestino === "socio" && !retiroSocio) faltan.push("socio");
      if (faltan.length > 0) { setForm({ ...form, ...err }); showToast("Falta: " + faltan.join(", ")); return; }
    }
    const esRetiro = form.insumo === "Retiro de Caja";
    if (esRetiro && retiroDestino === "socio" && !retiroSocio) { showToast("Elige qué socio retira"); return; }
    // Un retiro para el sueldo de Gustavo se guarda como "Pago sueldo Gustavo" (no se cuenta dos veces como costo)
    const insumofinal = esRetiro && retiroDestino === "sueldo" ? "Pago sueldo Gustavo" : (form.insumo === "Otro" ? (form.insumoCustom || "Otro") : form.insumo);
    const provFinal = form.proveedor === "__nuevo__" ? normProv(form.proveedorCustom) : form.proveedor;
    if (!PROVEEDOR_OPCIONAL.includes(form.insumo) && !provFinal) { setForm({ ...form, _errorProveedor: true }); showToast("Elige el proveedor"); return; }
    if (!form.monto || isNaN(Number(form.monto))) { setForm({ ...form, _errorMonto: true }); showToast("Completa el monto"); return; }
    const quiereCuotas = (form.insumo === "Inversión / equipamiento" && inversionModo === "cuotas") || (form.insumo === "Otro" && form.tipoGasto === "cuotas");
    const nCuotas = parseInt(cuotasN, 10);
    if (quiereCuotas && !(nCuotas >= 2 && nCuotas <= 60)) { showToast("Indica entre 2 y 60 meses"); return; }
    const cantidadFinal = INSUMOS_SIN_CANTIDAD.includes(form.insumo) && !form.cantidad ? "1" : form.cantidad;
    if (!cantidadFinal || isNaN(Number(cantidadFinal)) || Number(cantidadFinal) <= 0) { setForm({ ...form, _errorCantidad: true }); showToast("Completa la cantidad"); return; }
    if (form.insumo === "Otro" && !form.tipoGasto) { showToast("Elige el tipo de gasto"); return; }
    setSaving(true);
    const unidadFinal = unidadFijaDe(form.insumo) || form.unidad;
    const filaGasto = { fecha: form.fecha, insumo: insumofinal, cantidad: cantidadFinal || null, unidad: unidadFinal, fondo: form.fondo, proveedor: provFinal || null, monto: Number(form.monto), persona, nota: (esRetiro && retiroDestino === "socio" ? `Retiro de ${retiroSocio}` + (form.nota ? " · " + form.nota : "") : form.nota) || null };
    if (form.mesCorresponde && form.mesCorresponde !== form.fecha.slice(0, 7)) filaGasto.mes_corresponde = form.mesCorresponde;
    if (form.insumo === "Otro" && form.tipoGasto) filaGasto.tipo_gasto = form.tipoGasto === "cuotas" ? `cuotas:${nCuotas}` : form.tipoGasto;
    if (form.insumo === "Inversión / equipamiento" && inversionModo === "mes") filaGasto.tipo_gasto = "equipamiento";
    if (form.insumo === "Inversión / equipamiento" && inversionModo === "cuotas") filaGasto.tipo_gasto = `cuotas:${nCuotas}`;
    const { error: errGasto } = await supabase.from("gastos").insert([filaGasto]);
    if (errGasto) { console.error("Error al guardar gasto:", errGasto); showToast("❌ Error: " + errGasto.message); setSaving(false); return; }
    showToast("✓ Gasto guardado");
    setForm({ ...form, cantidad: "", proveedor: "", proveedorCustom: "", monto: "", montoDisplay: "", nota: "", insumoCustom: "", tipoGasto: "", mesCorresponde: "", _errorMonto: false, _errorCantidad: false, _errorProveedor: false, _errorOtro: false, _errorTipo: false, _errorFecha: false });
    setRetiroSocio(""); setInversionModo("aparte"); setCuotasN("12");
    cargarGastos(); setSaving(false);
    // Verificar si hay diferencia de precio con insumos
    const insumoRef = resolverInsumo(insumofinal);
    const cantidad = Number(form.cantidad);
    const monto = Number(form.monto);
    if (insumoRef && cantidad > 0 && monto > 0) {
      const ins = insumosPrecio.find((i) => i.nombre === insumoRef);
      // El precio de Recetas es por kg / litro (o por unidad): la cantidad se lleva a esa misma base
      const compatible = ins && (ins.unidad === "unidad" ? unidadFinal === "unidad" : unidadFinal !== "unidad");
      if (ins && compatible) {
        const cantBase = ins.unidad === "unidad" ? cantidad : aGramos(cantidad, unidadFinal) / 1000;
        const merma = MERMA_INSUMOS[insumoRef] || 0;
        const cantidadAprovechable = merma > 0 ? cantBase * (1 - merma) : cantBase;
        const precioNuevo = Math.round(monto / cantidadAprovechable);
        if (Math.abs(precioNuevo - ins.precio_por_kg) > 5) {
          setModalActualizarPrecio({ insumoRef, ins, precioActual: ins.precio_por_kg, precioNuevo, cantidad: cantBase, cantidadAprovechable, merma });
        }
      }
    }
  };

  const elegirProductoBot = (g) => {
    const ts = (r) => { const t = new Date(r.fecha).getTime(); return isNaN(t) ? 0 : t; };
    const masReciente = [...g.registros].sort((a, b) => ts(b) - ts(a))[0];
    setBotProducto(g); setBotRegistro(masReciente); setBotCantidad("1");
    // Si este producto ya se consumió antes, se reutiliza su categoría (el más reciente primero)
    const previo = gastos.find((x) => x.fondo === "Botillería" && normNombre(x.insumo) === normNombre(g.nombre) && TIPOS_GASTO.some((t) => t.id === x.tipo_gasto));
    const sugerido = previo ? "" : sugerirTipoBot(g.nombre);
    setBotTipo(previo ? previo.tipo_gasto : sugerido);
    setBotTipoRecordado(!!previo);
    setBotTipoSugerido(!!sugerido);
  };
  // Sugerencia por nombre para lo que se suele sacar de la botillería (se puede cambiar siempre)
  const sugerirTipoBot = (nombre) => {
    const n = normNombre(nombre);
    if (/servilleta/.test(n)) return "costo_ventas";
    if (/nova|toalla|guante|detergente|cloro|lavaloza|lava loza|jabon|esponja|escoba|trapero|basura|desinfect|limpia|limpi|pano|alcohol|virutilla/.test(n)) return "operacional";
    if (/tocino|mayonesa|ketchup|mostaza|aceite|queso|salchicha|palta|tomate|papas|pollo|churrasco|salsa|aji|pepinillo|cebolla|chucrut|pan /.test(n)) return "costo_ventas";
    return "";
  };

  // ---- Lector de código de barras (cámara del celular)
  const stopCamHardware = () => {
    const c = botCamRef.current;
    if (c.interval) { clearInterval(c.interval); c.interval = null; }
    if (c.reader) { try { c.reader.reset(); } catch (e) {} c.reader = null; }
    if (c.stream) { c.stream.getTracks().forEach((t) => t.stop()); c.stream = null; }
  };
  const detenerCamBot = () => { stopCamHardware(); setBotCamAbierta(false); };
  // iPhone/Safari no trae lector nativo: se carga uno (ZXing) solo cuando hace falta
  const cargarZXing = () => new Promise((resolve, reject) => {
    if (window.ZXing) return resolve(window.ZXing);
    const sc = document.createElement("script");
    sc.src = "https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js";
    sc.onload = () => (window.ZXing ? resolve(window.ZXing) : reject(new Error("lector no disponible")));
    sc.onerror = () => reject(new Error("no se pudo cargar el lector de códigos (¿sin internet?)"));
    document.head.appendChild(sc);
  });
  const abrirCamBot = async () => {
    setBotCamError(""); setBotCamAbierta(true);
    await new Promise((r) => setTimeout(r, 60)); // espera a que exista el <video>
    const video = botVideoRef.current;
    if (!video) return;
    const alEncontrar = (valor) => { detenerCamBot(); botSinEspera.current = true; setBotQ(String(valor)); };
    try {
      if ("BarcodeDetector" in window) {
        let stream;
        try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } }); }
        catch (e) { stream = await navigator.mediaDevices.getUserMedia({ video: true }); }
        botCamRef.current.stream = stream;
        video.srcObject = stream;
        await video.play();
        const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"] });
        botCamRef.current.interval = setInterval(async () => {
          if (video.readyState < 2) return;
          try { const codigos = await detector.detect(video); if (codigos.length > 0) alEncontrar(codigos[0].rawValue); } catch (e) {}
        }, 300);
      } else {
        const ZX = await cargarZXing();
        const hints = new Map();
        hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [ZX.BarcodeFormat.EAN_13, ZX.BarcodeFormat.EAN_8, ZX.BarcodeFormat.CODE_128, ZX.BarcodeFormat.UPC_A, ZX.BarcodeFormat.UPC_E]);
        const reader = new ZX.BrowserMultiFormatReader(hints);
        botCamRef.current.reader = reader;
        await reader.decodeFromConstraints({ video: { facingMode: "environment" } }, video, (resultado) => { if (resultado) alEncontrar(resultado.getText()); });
      }
    } catch (e) {
      stopCamHardware(); setBotCamAbierta(false);
      setBotCamError(e && e.name === "NotAllowedError" ? "Permiso de cámara denegado. Actívalo en los ajustes del navegador." : "No se pudo abrir la cámara: " + ((e && (e.message || e.name)) || "error"));
    }
  };
  const fechaBot = (iso) => { try { return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "2-digit" }); } catch { return "—"; } };

  const guardarConsumoBotilleria = async () => {
    if (!persona) { showToast("Selecciona quién registra"); return; }
    if (!botProducto || !botRegistro) { showToast("Busca y elige un producto"); return; }
    if (!botTipo) { showToast("Elige el tipo de gasto"); return; }
    if (!form.fecha) { showToast("Falta la fecha"); return; }
    const cant = Number(String(botCantidad).replace(",", "."));
    if (!cant || cant <= 0) { showToast("Completa la cantidad"); return; }
    const costo = Number(botRegistro.costoReal) || 0;
    if (costo <= 0) { showToast("Ese producto no tiene costo registrado"); return; }
    setSaving(true);
    const monto = Math.round(costo * cant);
    const fila = {
      fecha: form.fecha, insumo: botProducto.nombre, cantidad: String(cant), unidad: "unidad", fondo: "Botillería", proveedor: "Botillería", monto, persona,
      nota: `Consumo de botillería · costo real ${fmt(costo)} c/u (${botRegistro.proveedor || "s/prov"}, ${fechaBot(botRegistro.fecha)})${form.nota ? " · " + form.nota : ""}`,
      tipo_gasto: botTipo,
    };
    if (form.mesCorresponde && form.mesCorresponde !== form.fecha.slice(0, 7)) fila.mes_corresponde = form.mesCorresponde;
    const { error } = await supabase.from("gastos").insert([fila]);
    if (error) { console.error("Error al guardar consumo de botillería:", error); showToast("❌ Error: " + error.message); setSaving(false); return; }
    showToast(`✓ Consumo guardado — ${fmt(monto)}`);
    setBotProducto(null); setBotRegistro(null); setBotQ(""); setBotResultados(null); setBotCantidad("1"); setBotTipo(""); setBotTipoRecordado(false); setBotTipoSugerido(false);
    setForm({ ...form, nota: "", mesCorresponde: "" });
    cargarGastos(); setSaving(false);
  };

  const costoPorKgMayonesaCasera = (insumosLista) => {
    const costoTotal = RECETA_MAYONESA_CASERA.reduce((total, ing) => {
      const ins = insumosLista.find((i) => i.nombre === ing.insumo);
      if (!ins) return total;
      if (ins.unidad === "unidad") return total + ins.precio_por_kg * ing.gramos;
      return total + (ins.precio_por_kg / 1000) * ing.gramos;
    }, 0);
    return (costoTotal / RENDIMIENTO_MAYONESA_CASERA_G) * 1000; // costo por kg
  };

  const calcularCosto = (ingredientes, insumosLista) => {
    if (!ingredientes || !insumosLista) return 0;
    return ingredientes.reduce((total, ing) => {
      if (ing.insumo === "Mayonesa Casera") {
        const precioKg = costoPorKgMayonesaCasera(insumosLista);
        return total + (precioKg / 1000) * ing.gramos;
      }
      const ins = insumosLista.find((i) => i.nombre === ing.insumo);
      if (!ins) return total;
      if (ins.unidad === "unidad") return total + ins.precio_por_kg * (ing.gramos || 0);
      return total + (ins.precio_por_kg / 1000) * ing.gramos;
    }, 0);
  };

  const costoProducto = (nombreProducto) => {
    const rec = recetas.find((r) => r.nombre_producto === nombreProducto);
    if (!rec) return 0;
    return calcularCosto(rec.ingredientes, insumosPrecio);
  };

  const precioProducto = (rec) => metodoPago === "Pedidos Ya"
    ? (rec.precio_py || Math.round(rec.precio_venta * (1 + porcentajePY / 100)))
    : rec.precio_venta;

  const agregarAlCarrito = (rec, optsExtra) => {
    const nombre = optsExtra?.nombre || rec.nombre_producto;
    const precio = optsExtra?.precio !== undefined ? optsExtra.precio : precioProducto(rec);
    const comboNombre = optsExtra?.combo || null;
    const variante = optsExtra?.variante || null;
    const idx = carrito.findIndex((c) => c.nombre === nombre && c.metodo_pago === metodoPago && !c.descuento && c.combo === comboNombre && c.variante === variante);
    if (idx >= 0) {
      setCarrito(carrito.map((c, i) => i === idx ? { ...c, cantidad: c.cantidad + 1, total: (c.cantidad + 1) * c.precio_unitario } : c));
    } else {
      setCarrito([...carrito, { nombre, cantidad: 1, precio_unitario: precio, precio_original: precio, metodo_pago: metodoPago, total: precio, descuento: null, receta_nombre: rec.nombre_producto, combo: comboNombre, variante }]);
    }
  };

  const agregarCombo = (comboRec) => {
    const productos = comboRec.productos_combo || [];
    if (productos.length === 0) { showToast("Este combo no tiene productos definidos"); return; }
    const precioCombo = precioProducto(comboRec);
    // Verificar que existen los productos
    const productosEncontrados = productos.filter((p) => recetas.find((r) => r.nombre_producto === p));
    if (productosEncontrados.length === 0) { showToast("No se encontraron productos del combo"); return; }
    const faltantes = productos.filter((p) => !recetas.find((r) => r.nombre_producto === p));
    if (faltantes.length > 0) { showToast("⚠️ Falta en Recetas: " + faltantes.join(", ") + " (no descontará stock)"); }
    // Agregar como una sola línea — los productos internos van en nota
    const item = {
      nombre: comboRec.nombre_producto,
      cantidad: 1,
      precio_unitario: precioCombo,
      precio_original: precioCombo,
      metodo_pago: metodoPago,
      total: precioCombo,
      descuento: null,
      receta_nombre: comboRec.nombre_producto,
      combo: comboRec.nombre_producto,
      productos_combo: productos,
    };
    setCarrito((prev) => [...prev, item]);
    showToast(`✓ ${comboRec.nombre_producto} agregado`);
  };

  const cambiarCantidad = (idx, delta) => {
    setCarrito(carrito.map((c, i) => {
      if (i !== idx) return c;
      const nueva = c.cantidad + delta;
      if (nueva <= 0) return null;
      return { ...c, cantidad: nueva, total: nueva * c.precio_unitario };
    }).filter(Boolean));
  };

  const aplicarDescuento = () => {
    if (!descuentoTipo) return;
    const idx = carrito.findIndex((c) => c.nombre === descuentoModal.nombre && c.metodo_pago === descuentoModal.metodo_pago);
    if (idx < 0) return;
    let nuevoPrecio = 0; let descInfo = null;
    if (descuentoTipo === "cortesia") {
      if (!cortesiaDueno) { showToast("Selecciona quién autoriza"); return; }
      nuevoPrecio = 0;
      descInfo = { tipo: "cortesia", autorizado_por: cortesiaDueno };
    } else {
      const pct = Number(descuentoPct);
      if (!pct || pct <= 0 || pct >= 100) { showToast("Porcentaje inválido"); return; }
      const costo = costoProducto(descuentoModal.receta_nombre || descuentoModal.nombre);
      const precioMinimo = costo > 0 ? Math.ceil(costo / 0.70) : 0;
      const precioConDesc = Math.round(descuentoModal.precio_original * (1 - pct / 100));
      if (costo > 0 && precioConDesc < precioMinimo) { showToast(`Precio mínimo: ${fmt(precioMinimo)}`); return; }
      nuevoPrecio = precioConDesc;
      descInfo = { tipo: "personal", porcentaje: pct, precio_final: precioConDesc };
    }
    setCarrito(carrito.map((c, i) => i === idx ? { ...c, precio_unitario: nuevoPrecio, total: nuevoPrecio * c.cantidad, descuento: descInfo } : c));
    setDescuentoModal(null); setDescuentoTipo(""); setDescuentoPct(""); setCortesiaDueno("");
    showToast("✓ Descuento aplicado");
  };

  const quitarDescuento = (idx) => {
    setCarrito(carrito.map((c, i) => i === idx ? { ...c, precio_unitario: c.precio_original, total: c.precio_original * c.cantidad, descuento: null } : c));
  };

  const totalCarrito = carrito.reduce((s, c) => s + c.total, 0);

  const registrarVenta = async () => {
    if (carrito.length === 0) { showToast("Agrega productos"); return; }
    if (!turnoActivo) { showToast("⚠️ Debes abrir la caja antes de registrar ventas"); return; }
    if (!persona) { showToast("Selecciona quién registra la venta"); return; }
    if (!fechaVenta) { showToast("Falta la fecha de la venta"); return; }
    setSavingVenta(true);
    const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const rows = [];
    carrito.forEach((c) => {
      if (c.productos_combo && c.productos_combo.length > 0) {
        // Combo: registrar el combo como una línea + cada producto interno
        rows.push({ fecha: fechaVenta, hora, producto: c.nombre, cantidad: c.cantidad, precio_unitario: c.precio_unitario, total: c.total, metodo_pago: c.metodo_pago, persona: persona || null, nota: JSON.stringify({ combo: c.combo, productos: c.productos_combo }) });
        // Registrar cada producto del combo con precio 0 para stock
        const sumaNormal = c.productos_combo.reduce((s, p) => { const r = recetas.find((r) => r.nombre_producto === p); return s + (r ? r.precio_venta : 0); }, 0);
        c.productos_combo.forEach((nombreProd) => {
          const r = recetas.find((r) => r.nombre_producto === nombreProd);
          if (!r) return;
          const precioProp = sumaNormal > 0 ? Math.round((r.precio_venta / sumaNormal) * c.precio_unitario) : 0;
          rows.push({ fecha: fechaVenta, hora, producto: nombreProd, cantidad: c.cantidad, precio_unitario: precioProp, total: precioProp * c.cantidad, metodo_pago: c.metodo_pago, persona: persona || null, nota: JSON.stringify({ combo: c.combo, es_componente: true }) });
        });
      } else {
        rows.push({ fecha: fechaVenta, hora, producto: c.nombre, cantidad: c.cantidad, precio_unitario: c.precio_unitario, total: c.total, metodo_pago: c.metodo_pago, persona: persona || null, nota: JSON.stringify({ ...(c.descuento || {}), ...(c.combo ? { combo: c.combo } : {}), ...(c.variante ? { variante: c.variante } : {}) }) || null });
      }
    });
    const { error } = await supabase.from("ventas").insert(rows);
    if (error) showToast("Error al guardar");
    else { showToast(`✓ Venta — ${fmt(totalCarrito)}`); setCarrito([]); cargarVentas(); }
    setSavingVenta(false);
  };

  const guardarInsumo = async () => {
    if (!formInsumo.nombre || !formInsumo.precio_por_kg) { showToast("Completa nombre y precio"); return; }
    const data = { nombre: formInsumo.nombre.trim(), precio_por_kg: Number(formInsumo.precio_por_kg), unidad: formInsumo.unidad };
    const original = editInsumoId ? insumosPrecio.find((i) => i.id === editInsumoId) : null;
    for (const k of ["alerta_bajo", "alerta_critico"]) {
      const raw = String(formInsumo[k] ?? "").trim().replace(",", ".");
      if (raw !== "" && !isNaN(Number(raw))) data[k] = Number(raw);
      else if (original && original[k] != null) data[k] = null; // lo vació: volver a los límites por defecto
    }
    if (editInsumoId) {
      const { error } = await supabase.from("insumos_precio").update(data).eq("id", editInsumoId);
      if (error) { console.error("Error al actualizar insumo:", error); showToast("❌ Error: " + error.message); return; }
      showToast("✓ Actualizado"); setEditInsumoId(null);
    } else {
      const { error } = await supabase.from("insumos_precio").insert([data]);
      if (error) { console.error("Error al agregar insumo:", error); showToast("❌ Error: " + error.message); return; }
      showToast("✓ Agregado");
    }
    setFormInsumo({ nombre: "", precio_por_kg: "", unidad: "kg", alerta_bajo: "", alerta_critico: "" }); cargarRecetas();
  };

  const guardarReceta = async () => {
    if (!formReceta.nombre_producto || !formReceta.precio_venta) { showToast("Completa nombre y precio"); return; }
    const esCombo = formReceta.categoria === "combos";
    const data = {
      nombre_producto: formReceta.nombre_producto.trim(), categoria: formReceta.categoria,
      precio_venta: Number(formReceta.precio_venta),
      precio_py: Number(formReceta.precio_py) || Math.round(Number(formReceta.precio_venta) * (1 + porcentajePY / 100)),
      descripcion_menu: formReceta.descripcion_menu || "",
      ingredientes: esCombo ? [] : formReceta.ingredientes,
      productos_combo: esCombo ? formReceta.productos_combo : [],
    };
    if (editRecetaId) { await supabase.from("recetas").update(data).eq("id", editRecetaId); showToast("✓ Actualizada"); setEditRecetaId(null); }
    else { await supabase.from("recetas").insert([data]); showToast("✓ Guardada"); }
    setFormReceta({ nombre_producto: "", categoria: "completos", precio_venta: "", precio_py: "", descripcion_menu: "", ingredientes: [], productos_combo: [] });
    cargarRecetas();
  };

  const actualizarGramosIngrediente = async (rec, idx, nuevosGramos) => {
    const nuevosIngredientes = rec.ingredientes.map((ing, i) => i === idx ? { ...ing, gramos: Number(nuevosGramos) } : ing);
    await supabase.from("recetas").update({ ingredientes: nuevosIngredientes }).eq("id", rec.id);
    cargarRecetas();
  };

  const esComponente = (v) => { try { return JSON.parse(v.nota || "{}").es_componente === true; } catch { return false; } };
  const margenColor = (pct) => pct >= 60 ? C.green : pct >= 40 ? C.mustard : C.red;
  const cmpOrden = (a, b) => {
    const oa = a.orden, ob = b.orden;
    if (oa != null && ob != null) return oa - ob;
    if (oa != null) return -1;
    if (ob != null) return 1;
    return a.precio_venta - b.precio_venta;
  };
  const guardarOrden = async (recId, valor) => {
    await supabase.from("recetas").update({ orden: valor === "" ? null : Number(valor) }).eq("id", recId);
    cargarRecetas();
  };

  // Variante AS: sustituye un insumo por otro (ej: Salchichas 17 cm -> Churrascos) sin duplicar el producto
  const toggleVarianteAS = async (rec, sustituir, por, cantidadInicial = 3) => {
    if (rec.variante_as) {
      // Mantiene cantidad y precios guardados; solo cambia si está activa o no
      await supabase.from("recetas").update({ variante_as: { ...rec.variante_as, activo: !rec.variante_as.activo } }).eq("id", rec.id);
    } else {
      await supabase.from("recetas").update({ variante_as: { sustituir, por, cantidad: cantidadInicial, precio_venta: rec.precio_venta, activo: true } }).eq("id", rec.id);
    }
    cargarRecetas();
  };
  const actualizarCantidadVarianteAS = async (rec, valor) => {
    const cantidad = Number(valor);
    if (isNaN(cantidad) || cantidad <= 0) return;
    await supabase.from("recetas").update({ variante_as: { ...rec.variante_as, cantidad } }).eq("id", rec.id);
    cargarRecetas();
  };
  const actualizarPrecioPYVarianteAS = async (rec, valor) => {
    const precio = Number(valor);
    if (isNaN(precio) || precio <= 0) return;
    await supabase.from("recetas").update({ variante_as: { ...rec.variante_as, precio_py: precio } }).eq("id", rec.id);
    cargarRecetas();
  };

  // Devuelve la lista de ingredientes real a descontar, según si la venta fue variante AS
  const ingredientesEfectivos = (rec, notaObj) => {
    if (!rec?.ingredientes) return [];
    if (notaObj?.variante === "as" && rec.variante_as) {
      const { sustituir, por, cantidad } = rec.variante_as;
      return rec.ingredientes.map((ing) => ing.insumo === sustituir ? { insumo: por, gramos: cantidad ?? ing.gramos } : ing);
    }
    return rec.ingredientes;
  };
  const parseNota = (v) => { try { return JSON.parse(v.nota || "{}"); } catch { return {}; } };
  // Unidad fija de un insumo en el formulario de gastos: primero la lista del código, luego la unidad
  // registrada en Recetas → Insumos. Si no se encuentra, devuelve null (el formulario deja elegir).
  const unidadFijaDe = (nombre) => {
    if (UNIDAD_DEFAULT_INSUMO[nombre]) return UNIDAD_DEFAULT_INSUMO[nombre];
    const ref = resolverInsumo(nombre) || nombre;
    return insumosPrecio.find((i) => i.nombre === ref)?.unidad || UNIDAD_RESPALDO[nombreCanonico(nombre)] || null;
  };
  // Costo en insumos de una venta (según receta y variante AS) y su valor a precio de lista
  const costoVenta = (v) => {
    const rec = recetas.find((r) => r.nombre_producto === v.producto);
    if (!rec) return 0;
    if (rec.categoria === "combos") return (rec.productos_combo || []).reduce((acc, pn) => acc + costoProducto(pn), 0) * v.cantidad;
    return calcularCosto(ingredientesEfectivos(rec, parseNota(v)), insumosPrecio) * v.cantidad;
  };
  const valorListaVenta = (v) => {
    const rec = recetas.find((r) => r.nombre_producto === v.producto);
    if (!rec) return 0;
    const unit = parseNota(v).variante === "as" && rec.variante_as?.precio_venta ? rec.variante_as.precio_venta : rec.precio_venta;
    return (unit || 0) * v.cantidad;
  };

  const mesActual = today().slice(0, 7);
  const meses = [...new Set(gastos.map((g) => g.fecha.slice(0, 7)))].sort().reverse();
  const ventasMeses = [...new Set(ventas.map((v) => v.fecha.slice(0, 7)))].sort().reverse();
  const insumosUsadosHistoricamente = (() => {
    const vistos = new Set(INSUMOS_BASE.map(normNombre));
    const out = [];
    gastos.forEach((g) => {
      const i = (g.insumo || "").trim();
      if (!i || g.fondo === "Botillería") return;
      const n = normNombre(i);
      if (vistos.has(n) || resolverInsumo(i) || EXCLUIR_DEL_DESPLEGABLE.includes(n)) return;
      vistos.add(n);
      out.push(i);
    });
    return out;
  })();
  const insumos = [...INSUMOS_BASE.filter((i) => i !== "Otro"), ...insumosUsadosHistoricamente]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a.localeCompare(b, "es"));
  insumos.push("Otro");
  const nombresInsumosTodos = insumosPrecio.map((i) => i.nombre);
  const gastosSinProveedor = gastos.filter((g) => !g.proveedor && !PROVEEDOR_OPCIONAL.includes(g.insumo)).length;
  const gastosPorRevisar = gastos.filter((g) => categoriaGasto(g.insumo, nombresInsumosTodos, g.tipo_gasto) === "sin_clasificar").length;
  const gastosResumen = filtroResumen ? gastos.filter((g) => g.fecha.startsWith(filtroResumen)) : gastos;
  const totalGeneral = gastos.reduce((s, g) => s + g.monto, 0);
  const totalMes = gastos.filter((g) => g.fecha.startsWith(mesActual)).reduce((s, g) => s + g.monto, 0);
  const totalVentasMes = ventas.filter((v) => v.fecha.startsWith(mesActual) && !esComponente(v)).reduce((s, v) => s + v.total, 0);
  const totalGastosResumen = gastosResumen.reduce((s, g) => s + g.monto, 0);
  const totalVentasResumen = ventas.filter((v) => !esComponente(v) && (filtroResumen ? v.fecha.startsWith(filtroResumen) : true)).reduce((s, v) => s + v.total, 0);
  const utilidadResumen = totalVentasResumen - totalGastosResumen;
  const totalVentasDia = ventas.filter((v) => v.fecha === today() && !esComponente(v)).reduce((s, v) => s + v.total, 0);
  const utilidadMes = totalVentasMes - totalMes;

  const gastosFiltrados = gastos.filter((g) => {
    if (filtro.mes && !g.fecha.startsWith(filtro.mes)) return false;
    if (filtro.insumo && nombreCanonico(g.insumo) !== filtro.insumo) return false;
    if (filtro.persona && g.persona !== filtro.persona) return false;
    if (filtro.revisar && categoriaGasto(g.insumo, nombresInsumosTodos, g.tipo_gasto) !== "sin_clasificar") return false;
    if (filtro.sinProv && (g.proveedor || PROVEEDOR_OPCIONAL.includes(g.insumo))) return false;
    return true;
  });
  const ventasFiltradas = ventas.filter((v) => {
    if (filtroVentas.mes && !v.fecha.startsWith(filtroVentas.mes)) return false;
    if (filtroVentas.metodo && v.metodo_pago !== filtroVentas.metodo) return false;
    // Ocultar componentes internos de combos
    try { const nota = JSON.parse(v.nota || "{}"); if (nota.es_componente) return false; } catch {}
    return true;
  });

  const porPersonaGastos = PERSONAS.map((p) => ({ p, t: gastosResumen.filter((g) => g.persona === p).reduce((s, g) => s + g.monto, 0), c: gastosResumen.filter((g) => g.persona === p).length })).filter((x) => x.t > 0);
  const porInsumo = Object.entries(gastosResumen.reduce((acc, g) => { const k = nombreCanonico(g.insumo); acc[k] = (acc[k] || 0) + g.monto; return acc; }, {})).map(([n, t]) => ({ n, t })).sort((a, b) => b.t - a.t).slice(0, 10);

  const ventasMesActual = ventas.filter((v) => v.fecha.startsWith(mesActual) && !esComponente(v));
  const ventasPorProducto = Object.entries(
    ventasMesActual.reduce((acc, v) => {
      if (!acc[v.producto]) acc[v.producto] = { total: 0, cantidad: 0, combos: {} };
      acc[v.producto].total += v.total; acc[v.producto].cantidad += v.cantidad;
      try { const nota = JSON.parse(v.nota || "{}"); if (nota.combo) acc[v.producto].combos[nota.combo] = (acc[v.producto].combos[nota.combo] || 0) + v.cantidad; } catch {}
      return acc;
    }, {})
  ).map(([n, d]) => ({ n, ...d })).sort((a, b) => b.total - a.total);

  const ventasPorMetodo = ["Efectivo", "Tarjeta", "Pedidos Ya"].map((m) => ({
    m, t: ventasMesActual.filter((v) => v.metodo_pago === m).reduce((s, v) => s + v.total, 0),
    c: ventasMesActual.filter((v) => v.metodo_pago === m).length,
  })).filter((x) => x.t > 0);

  const cortesiasMes = ventasMesActual.filter((v) => { try { return JSON.parse(v.nota || "{}").tipo === "cortesia"; } catch { return false; } });
  const descuentosMes = ventasMesActual.filter((v) => { try { return JSON.parse(v.nota || "{}").tipo === "personal"; } catch { return false; } });
  const totalCortesias = cortesiasMes.reduce((s, v) => { const rec = recetas.find((r) => r.nombre_producto === v.producto); return s + (rec ? calcularCosto(rec.ingredientes, insumosPrecio) : 0); }, 0);

  const S = {
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px" },
    inp: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: "8px 10px", width: "100%", fontSize: 13, boxSizing: "border-box", outline: "none" },
  };

  const resumenTurno = turnoActivo ? calcularResumenTurno() : null;
  const sistemaPorInsumo = modalAjuste ? Object.fromEntries(calcularStock(gastos, ventas, recetas, insumosPrecio).map((x) => [x.nombre, x])) : {};

  const exportCSV = () => {
    const header = "Fecha,Insumo,Cantidad,Unidad,Fondo,Proveedor,Monto,Persona,Nota\n";
    const rows = gastos.map((g) => [g.fecha, g.insumo, g.cantidad || "", g.unidad || "", g.fondo, g.proveedor || "", g.monto, g.persona, g.nota || ""].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gastos.csv"; a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>

      {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: C.mustard, color: C.bg, padding: "8px 20px", borderRadius: 30, fontWeight: 700, fontSize: 13, zIndex: 999, whiteSpace: "nowrap" }}>{toast}</div>}

      {adminModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 320, width: "90%" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔐 Clave de administrador</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Esta acción quedará registrada en el log.</div>
            <input type="password" placeholder="Clave" value={adminClave} onChange={(e) => { setAdminClave(e.target.value); setAdminError(false); }} onKeyDown={(e) => e.key === "Enter" && confirmarEliminacion()} style={{ ...S.inp, fontSize: 18, letterSpacing: 6, marginBottom: 8 }} autoFocus />
            {adminError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Clave incorrecta</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setAdminModal(null); setAdminClave(""); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "10px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarEliminacion} style={{ flex: 1, background: C.red, border: "none", color: "#fff", borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuste de inventario */}
      {modalAjuste && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, overflowY: "auto" }}>
          <div style={{ background: C.card, border: `1px solid ${C.blue}`, borderRadius: 16, padding: 24, maxWidth: 420, width: "90%", margin: "20px auto" }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>📦 Ajuste de inventario</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Edita cuánto tienes físicamente de cada insumo ahora. El valor que ingreses reemplaza el stock actual (no se suma). Puedes usar coma o punto para decimales, ej: 0,5</div>
            {!persona && <div style={{ color: C.orange, fontSize: 12, marginBottom: 12, fontWeight: 700 }}>⚠️ Selecciona tu nombre arriba antes de guardar, para identificar quién hizo el ajuste.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "45vh", overflowY: "auto" }}>
              {[...new Set(Object.values(MAPA_INSUMOS))].sort().map((nombre) => {
                const ins = insumosPrecio.find((i) => i.nombre === nombre);
                const invActual = inventarioInicial.find((i) => i.insumo === nombre);
                const valorInput = ajusteValues[nombre] !== undefined ? ajusteValues[nombre] : (invActual ? String(invActual.cantidad) : "");
                return (
                  <div key={nombre} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>{nombre}</div>
                      {sistemaPorInsumo[nombre] && <div style={{ fontSize: 10, color: C.muted }}>Sistema: {sistemaPorInsumo[nombre].esKgLitro ? `${(sistemaPorInsumo[nombre].disponible / 1000).toFixed(2)} ${sistemaPorInsumo[nombre].unidad}` : `${Math.round(sistemaPorInsumo[nombre].disponible)} und`}</div>}
                    </div>
                    <input type="text" inputMode="decimal" placeholder="0"
                      value={valorInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.,]/g, "");
                        setAjusteValues({ ...ajusteValues, [nombre]: raw });
                      }}
                      style={{ ...S.inp, width: 80, textAlign: "center" }} />
                    <div style={{ color: C.muted, fontSize: 11, minWidth: 30 }}>{ins?.unidad || "und"}</div>
                  </div>
                );
              })}
            </div>
            {persona === "Alejandro" && (
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setVerHistorialAjuste(!verHistorialAjuste)} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 12, padding: 0 }}>
                  {verHistorialAjuste ? "▲ Ocultar historial de ajustes" : "▼ Ver historial de ajustes (solo tú)"}
                </button>
                {verHistorialAjuste && (
                  <div style={{ marginTop: 8, maxHeight: 160, overflowY: "auto", background: C.bg, borderRadius: 8, padding: 8 }}>
                    {historialInventario.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>Sin ajustes registrados aún</div>}
                    {historialInventario.map((h) => (
                      <div key={h.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.text }}>{h.insumo}</span>
                        <span style={{ color: C.mustard, fontWeight: 700 }}>{h.cantidad} {h.unidad}</span>
                        <span style={{ color: C.muted }}>{h.fecha} · {h.persona}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>Motivo de las diferencias (opcional)</div>
              <select value={motivoAjuste} onChange={(e) => setMotivoAjuste(e.target.value)} style={S.inp}>
                <option value="">Sin motivo</option>
                {["Descarte / botado", "Porciones más grandes", "Vencimiento", "Consumo del equipo", "Error de conteo", "Otro"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>Al guardar, la app compara lo que contaste con lo que debía haber y registra la diferencia como merma.</div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>🔐 Clave para confirmar el ajuste</div>
              <input type="password" placeholder="Clave" value={ajusteClave}
                onChange={(e) => { setAjusteClave(e.target.value); setAjusteError(false); }}
                onKeyDown={(e) => e.key === "Enter" && guardarAjusteInventario()}
                style={{ ...S.inp, fontSize: 16, letterSpacing: 4 }} />
              {ajusteError && <div style={{ color: C.red, fontSize: 12, marginTop: 4 }}>Clave incorrecta</div>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => { setModalAjuste(false); setAjusteClave(""); setAjusteError(false); setAjusteValues({}); setVerHistorialAjuste(false); setMotivoAjuste(""); }} style={{ flex: 1, background: C.tag, border: "none", color: C.muted, borderRadius: 9, padding: "12px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardarAjusteInventario} style={{ flex: 2, background: C.blue, border: "none", color: "#fff", borderRadius: 9, padding: "12px 0", cursor: "pointer", fontWeight: 800 }}>Guardar ajuste</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apertura de Caja */}
      {modalApertura && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}>
          <div style={{ background: C.card, border: `1px solid ${C.green}`, borderRadius: 14, padding: 28, maxWidth: 360, width: "90%" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>🟢</div>
            <div style={{ fontWeight: 800, fontSize: 18, textAlign: "center", marginBottom: 4 }}>Apertura de Caja</div>
            {ultimoCierre && <div style={{ color: C.muted, fontSize: 12, textAlign: "center", marginBottom: 16 }}>Último cierre: {fmt(ultimoCierre.saldo_final)}</div>}
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>¿Con cuánto efectivo abre la caja?</div>
            <input type="text" inputMode="numeric" placeholder={ultimoCierre ? fmt(ultimoCierre.saldo_final) : "ej: 50.000"}
              value={saldoApertura}
              onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); const display = raw ? Number(raw).toLocaleString("es-CL") : ""; setSaldoApertura(display); }}
              style={{ ...S.inp, fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 16 }} autoFocus />
            {ultimoCierre && saldoApertura && Number(saldoApertura.replace(/[^0-9]/g, "")) !== ultimoCierre.saldo_final && (
              <div style={{ color: Number(saldoApertura.replace(/[^0-9]/g, "")) < ultimoCierre.saldo_final ? C.red : C.green, fontSize: 13, textAlign: "center", marginBottom: 12, fontWeight: 700 }}>
                Diferencia con cierre anterior: {fmt(Number(saldoApertura.replace(/[^0-9]/g, "")) - ultimoCierre.saldo_final)}
              </div>
            )}
            <button onClick={abrirCaja} style={{ width: "100%", background: C.green, border: "none", color: "#fff", borderRadius: 10, padding: "14px 0", cursor: "pointer", fontWeight: 800, fontSize: 16 }}>Abrir Caja</button>
          </div>
        </div>
      )}

      {/* Modal Cierre de Caja */}
      {modalCierre && turnoActivo && resumenTurno && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, overflowY: "auto" }}>
            <div style={{ background: C.card, border: `1px solid ${C.red}`, borderRadius: 14, padding: 24, maxWidth: 400, width: "90%", margin: "20px auto" }}>
              <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>🔴</div>
              <div style={{ fontWeight: 800, fontSize: 18, textAlign: "center", marginBottom: 16 }}>Cierre de Caja</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>Saldo inicial:</span><span style={{ fontWeight: 700 }}>{fmt(turnoActivo.saldo_inicial)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>+ Ventas efectivo:</span><span style={{ fontWeight: 700, color: C.green }}>{fmt(resumenTurno.efectivo)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>- Gastos efectivo:</span><span style={{ fontWeight: 700, color: C.red }}>{fmt(resumenTurno.gastosTurno)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}><span style={{ fontWeight: 700 }}>Efectivo esperado:</span><span style={{ fontWeight: 800, fontSize: 16, color: C.mustard }}>{fmt(resumenTurno.efectivoEsperado)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4 }}><span style={{ color: C.muted }}>Tarjeta:</span><span style={{ fontWeight: 700, color: C.blue }}>{fmt(resumenTurno.tarjeta)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>Pedidos Ya:</span><span style={{ fontWeight: 700, color: C.orange }}>{fmt(resumenTurno.py)}</span></div>
                {resumenTurno.cortesiasTurno.length > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>Cortesías:</span><span style={{ fontWeight: 700 }}>{resumenTurno.cortesiasTurno.length}</span></div>}
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>¿Cuánto efectivo hay en caja?</div>
              <input type="text" inputMode="numeric" placeholder="ej: 45.000"
                value={saldoContado}
                onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); const display = raw ? Number(raw).toLocaleString("es-CL") : ""; setSaldoContado(display); }}
                style={{ ...S.inp, fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 8 }} />
              {saldoContado && (
                <div style={{ color: Number(saldoContado.replace(/[^0-9]/g, "")) < resumenTurno.efectivoEsperado ? C.red : C.green, fontSize: 13, textAlign: "center", marginBottom: 12, fontWeight: 700 }}>
                  Diferencia: {fmt(Number(saldoContado.replace(/[^0-9]/g, "")) - resumenTurno.efectivoEsperado)}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setModalCierre(false)} style={{ flex: 1, background: C.tag, border: "none", color: C.muted, borderRadius: 9, padding: "12px 0", cursor: "pointer" }}>Volver</button>
                <button onClick={() => cerrarCaja(Number(saldoContado.replace(/[^0-9]/g, "")))} disabled={!saldoContado} style={{ flex: 2, background: C.red, border: "none", color: "#fff", borderRadius: 9, padding: "12px 0", cursor: "pointer", fontWeight: 800 }}>Confirmar Cierre</button>
              </div>
            </div>
          </div>
      )}
      {confirmarPrecioModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 320, width: "90%" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔐 Confirmar cambio de precio{confirmarPrecioModal.tipo === "as" ? " AS" : ""}</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>{confirmarPrecioModal.rec.nombre_producto}{confirmarPrecioModal.tipo === "as" ? " (churrasco)" : ""}</div>
            <div style={{ color: C.mustard, fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Nuevo precio: {fmt(confirmarPrecioModal.valor)}</div>
            <input type="password" placeholder="Clave" value={adminClave} onChange={(e) => { setAdminClave(e.target.value); setAdminError(false); }} onKeyDown={(e) => e.key === "Enter" && confirmarCambioPrecio()} style={{ ...S.inp, fontSize: 18, letterSpacing: 6, marginBottom: 8 }} autoFocus />
            {adminError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Clave incorrecta</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { const { rec, tipo } = confirmarPrecioModal; setConfirmarPrecioModal(null); setAdminClave(""); if (tipo === "as") setPrecioASEdit((p) => { const n={...p}; delete n[rec.id]; return n; }); else setPrecioVentaEdit((p) => { const n={...p}; delete n[rec.id]; return n; }); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "10px 0", cursor: "pointer" }}>Descartar</button>
              <button onClick={confirmarCambioPrecio} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {provModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 340, width: "90%" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🏷️ Asignar proveedor</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>{provModal.bulk ? `${provModal.ids.length} gastos · ${fmt(provModal.total)} · ${provModal.insumos.slice(0, 4).join(", ")}${provModal.insumos.length > 4 ? "…" : ""}` : `${provModal.insumo} · ${fmt(provModal.monto)} · ${provModal.fecha} · ${provModal.persona}`}</div>
            {provModal.bulk && <div style={{ color: C.orange, fontSize: 11, marginBottom: 8 }}>Se asignará el mismo proveedor a todos los gastos de la lista. Filtra antes por insumo o por persona si no todos son del mismo proveedor.</div>}
            <select value={provModalValor} onChange={(e) => setProvModalValor(e.target.value)} style={{ ...S.inp, marginBottom: 8 }}>
              <option value="">Elige el proveedor…</option>
              {proveedores.map((pv) => <option key={pv} value={pv}>{pv}</option>)}
              <option value="__nuevo__">+ Nuevo…</option>
            </select>
            {provModalValor === "__nuevo__" && <input placeholder="Nombre del proveedor" value={provModalNuevo} onChange={(e) => setProvModalNuevo(e.target.value)} style={{ ...S.inp, marginBottom: 8 }} />}
            <input type="password" placeholder="Clave" value={adminClave} onChange={(e) => { setAdminClave(e.target.value); setAdminError(false); }} onKeyDown={(e) => e.key === "Enter" && confirmarProveedor()} style={{ ...S.inp, fontSize: 18, letterSpacing: 6, marginBottom: 8 }} />
            {adminError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Clave incorrecta</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setProvModal(null); setAdminClave(""); setAdminError(false); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "10px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarProveedor} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {retiroModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 340, width: "90%" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>↪ Destino del retiro</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>{fmt(retiroModal.monto)} · {retiroModal.fecha}{retiroModal.nota ? ` · ${retiroModal.nota}` : ""}</div>
            <select value={retiroModalDest} onChange={(e) => setRetiroModalDest(e.target.value)} style={{ ...S.inp, marginBottom: 8 }}>
              <option value="sueldo">Sueldo de Gustavo</option>
              <option value="socio">Retiro de socio</option>
            </select>
            {retiroModalDest === "sueldo" && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Sueldo del mes de:</div>
                <select value={retiroModalMes} onChange={(e) => setRetiroModalMes(e.target.value)} style={S.inp}>
                  {(() => { const o = mesesRecientes(12); const mf = retiroModal.fecha.slice(0, 7); if (!o.includes(mf)) o.push(mf); return o.map((m) => <option key={m} value={m}>{nombreMes(m)}</option>); })()}
                </select>
                <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>Pasa a contar como pagado a Gustavo en ese mes y deja de contarse como retiro.</div>
              </div>
            )}
            {retiroModalDest === "socio" && (
              <div style={{ marginBottom: 8 }}>
                <select value={retiroModalSocio} onChange={(e) => setRetiroModalSocio(e.target.value)} style={S.inp}>
                  <option value="">¿Qué socio?</option>
                  {["Raul", "Pepe", "Alejandro"].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}
            <input type="password" placeholder="Clave" value={adminClave} onChange={(e) => { setAdminClave(e.target.value); setAdminError(false); }} onKeyDown={(e) => e.key === "Enter" && confirmarDestinoRetiro()} style={{ ...S.inp, fontSize: 18, letterSpacing: 6, marginBottom: 8 }} />
            {adminError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Clave incorrecta</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setRetiroModal(null); setAdminClave(""); setAdminError(false); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "10px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarDestinoRetiro} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {reclasModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 340, width: "90%" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🏷️ Reclasificar gasto</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>{reclasModal.bulk ? `${reclasModal.ids.length} gastos · ${fmt(reclasModal.total)} · ${reclasModal.insumos.slice(0, 4).join(", ")}${reclasModal.insumos.length > 4 ? "…" : ""}` : `${reclasModal.insumo} · ${fmt(reclasModal.monto)} · ${reclasModal.fecha}`}</div>
            {reclasModal.bulk && <div style={{ color: C.orange, fontSize: 11, marginBottom: 8 }}>Se aplicará el mismo tipo a todos los gastos de la lista (los retiros de caja y pagos a Gustavo no se tocan).</div>}
            <select value={reclasTipo} onChange={(e) => setReclasTipo(e.target.value)} style={{ ...S.inp, marginBottom: 6 }}>
              <option value="">Elige el tipo…</option>
              {TIPOS_GASTO_CON_CUOTAS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              <option value="__auto__">Automático (según el nombre del insumo)</option>
            </select>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 12 }}>{reclasTipo === "__auto__" ? "Quita la clasificación manual: vuelve a la que corresponde por el nombre (por ejemplo, Pan para completo = costo de ventas)." : reclasTipo ? TIPOS_GASTO_CON_CUOTAS.find((t) => t.id === reclasTipo)?.ayuda : "Define en qué parte del estado de resultados entra."}</div>
            {reclasTipo === "cuotas" && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>¿En cuántos meses?</div>
                <input type="text" inputMode="numeric" value={cuotasN} onChange={(e) => setCuotasN(e.target.value.replace(/[^0-9]/g, ""))} style={S.inp} />
                {reclasModal.monto > 0 && parseInt(cuotasN, 10) >= 2 && <div style={{ color: C.mustard, fontSize: 11, marginTop: 4 }}>Cuota mensual: {fmt(Math.round(reclasModal.monto / parseInt(cuotasN, 10)))}</div>}
              </div>
            )}
            <input type="password" placeholder="Clave" value={adminClave} onChange={(e) => { setAdminClave(e.target.value); setAdminError(false); }} onKeyDown={(e) => e.key === "Enter" && confirmarReclasificacion()} style={{ ...S.inp, fontSize: 18, letterSpacing: 6, marginBottom: 8 }} />
            {adminError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Clave incorrecta</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setReclasModal(null); setReclasTipo(""); setAdminClave(""); setAdminError(false); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "10px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarReclasificacion} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {descuentoModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 340, width: "90%" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Descuento — {descuentoModal.nombre}</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Precio normal: {fmt(descuentoModal.precio_original)}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={() => setDescuentoTipo("cortesia")} style={{ flex: 1, background: descuentoTipo === "cortesia" ? C.mustard : C.tag, color: descuentoTipo === "cortesia" ? C.bg : C.muted, border: "none", borderRadius: 7, padding: "9px 0", cursor: "pointer", fontWeight: 700 }}>🎁 Cortesía</button>
              <button onClick={() => setDescuentoTipo("personal")} style={{ flex: 1, background: descuentoTipo === "personal" ? C.blue : C.tag, color: descuentoTipo === "personal" ? "#fff" : C.muted, border: "none", borderRadius: 7, padding: "9px 0", cursor: "pointer", fontWeight: 700 }}>% Personal</button>
            </div>
            {descuentoTipo === "cortesia" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>¿Quién autoriza?</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Raul", "Pepe", "Alejandro"].map((d) => (
                    <button key={d} onClick={() => setCortesiaDueno(d)} style={{ flex: 1, background: cortesiaDueno === d ? personColor(d) : C.tag, color: cortesiaDueno === d ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "8px 0", cursor: "pointer", fontWeight: cortesiaDueno === d ? 700 : 400, fontSize: 12 }}>{d}</button>
                  ))}
                </div>
              </div>
            )}
            {descuentoTipo === "personal" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>Ingresa el % de descuento</div>
                <input type="number" placeholder="ej: 15" value={descuentoPct} onChange={(e) => setDescuentoPct(e.target.value)} style={S.inp} />
                {descuentoPct && (() => {
                  const costo = costoProducto(descuentoModal.receta_nombre || descuentoModal.nombre);
                  const precioMinimo = costo > 0 ? Math.ceil(costo / 0.70) : 0;
                  const precioConDesc = Math.round(descuentoModal.precio_original * (1 - Number(descuentoPct) / 100));
                  const ok = precioConDesc >= precioMinimo;
                  return (
                    <div style={{ marginTop: 8, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Descuento</span><span style={{ fontWeight: 700, color: C.blue }}>{Number(descuentoPct)}%</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span style={{ color: C.muted }}>Precio final</span><span style={{ fontWeight: 800, fontSize: 16, color: ok ? C.green : C.red }}>{fmt(precioConDesc)}</span></div>
                      {!ok && <div style={{ color: C.red, fontSize: 12, marginTop: 4 }}>⚠️ Mínimo: {fmt(precioMinimo)}</div>}
                    </div>
                  );
                })()}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setDescuentoModal(null); setDescuentoTipo(""); setDescuentoPct(""); setCortesiaDueno(""); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "9px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={aplicarDescuento} style={{ flex: 1, background: C.green, border: "none", color: "#fff", borderRadius: 7, padding: "9px 0", cursor: "pointer", fontWeight: 700 }}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {modalActualizarPrecio && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 340, width: "90%" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>💰 Precio de compra</div>
            <div style={{ fontWeight: 600, color: C.mustard, marginBottom: 12 }}>{modalActualizarPrecio.insumoRef}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, fontSize: 13 }}>
              {modalActualizarPrecio.merma > 0 && (
                <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", marginBottom: 4 }}>
                  <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>🥑 Factor merma {Math.round(modalActualizarPrecio.merma * 100)}%</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: C.muted }}>Comprado:</span><span>{modalActualizarPrecio.cantidad} kg</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: C.muted }}>Aprovechable:</span><span style={{ color: C.green, fontWeight: 700 }}>{modalActualizarPrecio.cantidadAprovechable.toFixed(2)} kg</span></div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Precio actual en recetas:</span><span style={{ fontWeight: 700 }}>{fmt(modalActualizarPrecio.precioActual)}/{modalActualizarPrecio.ins.unidad}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Precio según esta compra:</span><span style={{ fontWeight: 700, color: C.green }}>{fmt(modalActualizarPrecio.precioNuevo)}/{modalActualizarPrecio.ins.unidad}</span></div>
            </div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>¿Actualizar el costo en recetas con el nuevo precio?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setModalActualizarPrecio(null)} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "10px 0", cursor: "pointer" }}>No</button>
              <button onClick={async () => { await supabase.from("insumos_precio").update({ precio_por_kg: modalActualizarPrecio.precioNuevo }).eq("id", modalActualizarPrecio.ins.id); setModalActualizarPrecio(null); cargarRecetas(); showToast("✓ Precio actualizado en recetas"); }} style={{ flex: 1, background: C.green, border: "none", color: "#fff", borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700 }}>Sí, actualizar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {view !== "home" && <button onClick={() => setView("home")} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 16 }}>←</button>}
              <span style={{ fontSize: 18 }}>🌭</span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Don Abel</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {PERSONAS.map((p) => (
                <button key={p} onClick={() => setPersona(p)} style={{ background: persona === p ? personColor(p) : C.tag, color: persona === p ? C.bg : C.muted, border: "none", borderRadius: 20, padding: "4px 9px", fontSize: 11, fontWeight: persona === p ? 700 : 400, cursor: "pointer" }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 60px" }}>

        {view === "home" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              {[
                { id: "ventas", emoji: "💰", label: "Ventas", sub: `Hoy ${fmt(totalVentasDia)}`, color: C.green },
                { id: "gastos", emoji: "🧾", label: "Gastos", sub: `Mes ${fmt(totalMes)}`, color: C.mustard },
                { id: "recetas", emoji: "🍽️", label: "Recetas", sub: "Costos y márgenes", color: C.purple },
                { id: "resumen", emoji: "📊", label: "Resumen", sub: `Ventas mes ${fmt(totalVentasMes)}`, color: C.green },
              ].map((item) => (
                <button key={item.id} onClick={() => setView(item.id)} style={{ background: C.card, border: `2px solid ${C.border}`, borderRadius: 14, padding: "20px 16px", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = item.color}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>{item.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: item.color }}>{item.label}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{item.sub}</div>
                </button>
              ))}
            </div>
            {persona === "Alejandro" && gastosPorRevisar > 0 && (
              <button onClick={() => { setFiltro({ mes: "", insumo: "", persona: "", revisar: true }); setGastosView("historial"); setView("gastos"); }} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", border: `1px solid ${C.orange}`, background: C.orange + "15", width: "100%", textAlign: "left", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.orange }}>⚠️ {gastosPorRevisar} {gastosPorRevisar === 1 ? "gasto por revisar" : "gastos por revisar"}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>Toca para clasificarlos</div>
                </div>
                <span style={{ color: C.orange, fontSize: 18 }}>→</span>
              </button>
            )}
            <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
              <div><div style={{ color: C.muted, fontSize: 10 }}>Ventas hoy</div><div style={{ fontWeight: 800, fontSize: 17, color: C.green }}>{fmt(totalVentasDia)}</div></div>
              <div><div style={{ color: C.muted, fontSize: 10 }}>Gastos mes</div><div style={{ fontWeight: 800, fontSize: 17, color: C.mustard }}>{fmt(totalMes)}</div></div>
              <div><div style={{ color: C.muted, fontSize: 10 }}>Ventas mes</div><div style={{ fontWeight: 800, fontSize: 17, color: C.green }}>{fmt(totalVentasMes)}</div></div>
            </div>
          </div>
        )}

        {view === "gastos" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {[{ id: "nuevo", label: "+ Nuevo" }, { id: "historial", label: "Historial" }, { id: "stock", label: "📦 Stock" }, { id: "resumen", label: "📊 Resumen" }].map((t) => (
                <button key={t.id} onClick={() => setGastosView(t.id)} style={{ background: gastosView === t.id ? C.mustard : C.tag, color: gastosView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontWeight: gastosView === t.id ? 700 : 400, fontSize: 13 }}>{t.label}</button>
              ))}
            </div>
            {gastosView === "nuevo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Registrar gasto</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {[{ id: false, label: "Gasto normal" }, { id: true, label: "🛒 Consumo de botillería" }].map((m) => (
                      <button key={String(m.id)} onClick={() => setBotilleriaMode(m.id)} style={{ flex: 1, background: botilleriaMode === m.id ? C.mustard : C.tag, color: botilleriaMode === m.id ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "7px 0", cursor: "pointer", fontWeight: botilleriaMode === m.id ? 700 : 400, fontSize: 12 }}>{m.label}</button>
                    ))}
                  </div>
                  {botilleriaMode ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ color: C.muted, fontSize: 11 }}>Para lo que se saca de la botillería y no se vende (toalla nova, guantes, etc.). El costo viene de la hoja de la botillería.</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Fld label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value, mesCorresponde: "" })} style={S.inp} /></Fld>
                        <Fld label="Corresponde al mes">
                          {(() => {
                            const mesFecha = (form.fecha || today()).slice(0, 7);
                            const opciones = mesesRecientes(12);
                            if (!opciones.includes(mesFecha)) opciones.push(mesFecha);
                            return (
                              <select value={form.mesCorresponde || mesFecha} onChange={(e) => setForm({ ...form, mesCorresponde: e.target.value === mesFecha ? "" : e.target.value })} style={S.inp}>
                                {opciones.map((m) => <option key={m} value={m}>{nombreMes(m)}{m === today().slice(0, 7) ? " (en curso)" : ""}</option>)}
                              </select>
                            );
                          })()}
                        </Fld>
                      </div>
                      {!botProducto ? (
                        <div>
                          <Fld label="Buscar producto (nombre o código de barras)">
                            <div style={{ display: "flex", gap: 8 }}>
                              <input value={botQ} onChange={(e) => setBotQ(e.target.value)} placeholder="ej: toalla, o escanea el código" style={S.inp} />
                              <button onClick={botCamAbierta ? detenerCamBot : abrirCamBot} style={{ background: botCamAbierta ? C.red : C.tag, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "0 14px", fontSize: 20, cursor: "pointer" }}>{botCamAbierta ? "✕" : "📷"}</button>
                            </div>
                          </Fld>
                          {botCamError && <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>{botCamError}</div>}
                          {botCamAbierta && (
                            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000", marginTop: 8 }}>
                              <video ref={botVideoRef} playsInline muted autoPlay style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
                              <div style={{ position: "absolute", left: "10%", width: "80%", top: "50%", height: 2, background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
                              <div style={{ position: "absolute", bottom: 6, width: "100%", textAlign: "center", fontSize: 11, color: "#fff" }}>Apunta al código de barras</div>
                            </div>
                          )}
                          {botCargando && <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Buscando…</div>}
                          {botError && <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>{botError}</div>}
                          {botResultados && botResultados.length === 0 && !botCargando && <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Sin resultados</div>}
                          {botResultados && botResultados.length > 0 && <div style={{ color: C.muted, fontSize: 10, margin: "8px 0 4px" }}>{botResultados.length} {botResultados.length === 1 ? "producto" : "productos"} — toca uno</div>}
                          {botResultados && botResultados.map((g) => {
                            const costos = g.registros.map((r) => Number(r.costoReal) || 0).filter((c) => c > 0);
                            const min = costos.length ? Math.min(...costos) : 0;
                            return (
                              <div key={g.nombre} onClick={() => elegirProductoBot(g)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer" }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{g.nombre}</div>
                                  <div style={{ color: C.muted, fontSize: 10 }}>{g.registros.length} {g.registros.length === 1 ? "proveedor" : "proveedores"}</div>
                                </div>
                                <div style={{ fontWeight: 800, color: C.mustard }}>{min > 0 ? fmt(min) : "—"}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{botProducto.nombre}</div>
                            <button onClick={() => { setBotProducto(null); setBotRegistro(null); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 14, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}>cambiar</button>
                          </div>
                          <div>
                            <div style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Costo real por proveedor (toca el que corresponde)</div>
                            {(() => {
                              const costos = botProducto.registros.map((r) => Number(r.costoReal) || 0).filter((c) => c > 0);
                              const min = costos.length ? Math.min(...costos) : 0;
                              const ts = (r) => { const t = new Date(r.fecha).getTime(); return isNaN(t) ? 0 : t; };
                              const masRec = Math.max(...botProducto.registros.map(ts));
                              return botProducto.registros.map((r, i) => {
                                const sel = botRegistro === r;
                                const c = Number(r.costoReal) || 0;
                                return (
                                  <div key={i} onClick={() => setBotRegistro(r)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: sel ? C.mustard + "22" : C.bg, border: `1px solid ${sel ? C.mustard : C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 5, cursor: "pointer" }}>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.proveedor || "—"}</div>
                                      <div style={{ color: C.muted, fontSize: 10 }}>{fechaBot(r.fecha)}{ts(r) === masRec && botProducto.registros.length > 1 ? " · más reciente" : ""}{c > 0 && c === min && botProducto.registros.length > 1 ? " · mejor precio" : ""}</div>
                                    </div>
                                    <div style={{ fontWeight: 800, color: sel ? C.mustard : C.text }}>{c > 0 ? fmt(c) : "—"}</div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <Fld label="Cantidad"><input type="text" inputMode="decimal" value={botCantidad} onChange={(e) => setBotCantidad(e.target.value.replace(/[^0-9.,]/g, ""))} style={S.inp} /></Fld>
                            <Fld label="Tipo de gasto *">
                              <select value={botTipo} onChange={(e) => { setBotTipo(e.target.value); setBotTipoRecordado(false); setBotTipoSugerido(false); }} style={S.inp}>
                                <option value="">Elige el tipo…</option>
                                {TIPOS_GASTO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                                <option value="revisar">No sé: lo revisa Alejandro</option>
                              </select>
                            </Fld>
                          </div>
                          <div style={{ color: botTipoRecordado ? C.green : botTipoSugerido ? C.orange : C.muted, fontSize: 10 }}>{botTipoRecordado ? "✓ Categoría recordada de un consumo anterior de este producto. Puedes cambiarla." : botTipoSugerido ? "Sugerida por el nombre del producto. Confírmala o cámbiala: la próxima vez queda recordada." : (TIPOS_GASTO.find((t) => t.id === botTipo)?.ayuda || "Producto nuevo: elige una vez el tipo y la próxima vez queda guardado.")}</div>
                          {botTipo === "costo_ventas" && <div style={{ color: C.muted, fontSize: 10 }}>Si es un ingrediente de tus recetas (tocino, mayonesa…), conviene registrarlo como gasto normal con fondo "Botillería": así también suma a tu stock.</div>}
                          {botRegistro && Number(botRegistro.costoReal) > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
                              <span style={{ color: C.muted, fontSize: 12 }}>{fmt(Number(botRegistro.costoReal))} × {botCantidad || 0}</span>
                              <span style={{ fontWeight: 800, fontSize: 18, color: C.mustard }}>{fmt(Math.round(Number(botRegistro.costoReal) * (Number(String(botCantidad).replace(",", ".")) || 0)))}</span>
                            </div>
                          )}
                          <Fld label="Nota"><input placeholder="opcional" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} style={S.inp} /></Fld>
                          <button onClick={guardarConsumoBotilleria} disabled={saving} style={{ background: persona ? C.mustard : C.border, color: persona ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 700, cursor: persona ? "pointer" : "default", width: "100%" }}>
                            {saving ? "Guardando..." : persona ? `Guardar consumo — ${persona}` : "Selecciona quién registra arriba"}
                          </button>
                          <div style={{ color: C.muted, fontSize: 10 }}>Se guarda como gasto con fondo "Botillería": no toca la caja y suma a lo que se le debe a la botillería.</div>
                        </div>
                      )}
                    </div>
                  ) : (<>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Fld label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value, mesCorresponde: "" })} style={S.inp} /></Fld>
                    <Fld label="Corresponde al mes">
                      {(() => {
                        const mesFecha = (form.fecha || today()).slice(0, 7);
                        const opciones = mesesRecientes(12);
                        if (!opciones.includes(mesFecha)) opciones.push(mesFecha);
                        return (
                          <select value={form.mesCorresponde || mesFecha} onChange={(e) => setForm({ ...form, mesCorresponde: e.target.value === mesFecha ? "" : e.target.value })} style={S.inp}>
                            {opciones.map((m) => <option key={m} value={m}>{nombreMes(m)}{m === today().slice(0, 7) ? " (en curso)" : ""}</option>)}
                          </select>
                        );
                      })()}
                    </Fld>
                    <Fld label="Total que pagaste por este insumo ($) *" full>
                      <input type="text" inputMode="numeric" placeholder="ej: 12.790" value={form.montoDisplay || ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                          const display = raw ? Number(raw).toLocaleString("es-CL") : "";
                          setForm({ ...form, monto: raw, montoDisplay: display });
                        }}
                        style={{ ...S.inp, borderColor: form._errorMonto ? C.red : C.border }} />
                      {form._errorMonto && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>Ingresa el monto</div>}
                    </Fld>
                    <Fld label="Insumo" full><select value={form.insumo} onChange={(e) => { const unidadAuto = unidadFijaDe(e.target.value); setForm({ ...form, insumo: e.target.value, unidad: unidadAuto || form.unidad }); }} style={S.inp}>{insumos.map((i) => <option key={i}>{i}</option>)}</select></Fld>
                    {form.insumo === "Otro" && <Fld label="¿Cuál? *" full><input value={form.insumoCustom} onChange={(e) => setForm({ ...form, insumoCustom: e.target.value, _errorOtro: false })} style={{ ...S.inp, borderColor: form._errorOtro ? C.red : C.border }} /></Fld>}
                    {form.insumo === "Otro" && (
                      <Fld label="Tipo de gasto *" full>
                        <select value={form.tipoGasto} onChange={(e) => setForm({ ...form, tipoGasto: e.target.value, _errorTipo: false })} style={{ ...S.inp, borderColor: form._errorTipo ? C.red : C.border }}>
                          <option value="">Elige el tipo…</option>
                          {TIPOS_GASTO_OTRO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                        <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{form.tipoGasto ? TIPOS_GASTO_OTRO.find((t) => t.id === form.tipoGasto)?.ayuda : "Define en qué parte del estado de resultados entra este gasto."}</div>
                      </Fld>
                    )}
                    {form.insumo === "Retiro de Caja" && (
                      <>
                        <Fld label="Destino del retiro *" full>
                          <select value={retiroDestino} onChange={(e) => setRetiroDestino(e.target.value)} style={S.inp}>
                            <option value="sueldo">Sueldo de Gustavo</option>
                            <option value="socio">Retiro de socio</option>
                          </select>
                          <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{retiroDestino === "sueldo" ? "Se guarda como pago de sueldo a Gustavo: resta de la caja y suma a lo que ya se le pagó, sin contarse dos veces como costo." : "Resta de la caja y no es un costo del negocio."}</div>
                        </Fld>
                        {retiroDestino === "socio" && (
                          <Fld label="¿Qué socio? *" full>
                            <select value={retiroSocio} onChange={(e) => setRetiroSocio(e.target.value)} style={S.inp}>
                              <option value="">Elige…</option>
                              {["Raul", "Pepe", "Alejandro"].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </Fld>
                        )}
                      </>
                    )}
                    {form.insumo === "Inversión / equipamiento" && (
                      <Fld label="¿Cómo se refleja? *" full>
                        <select value={inversionModo} onChange={(e) => setInversionModo(e.target.value)} style={S.inp}>
                          <option value="aparte">Aparte: no resta del resultado del mes</option>
                          <option value="mes">Restar en el mes (canasto, plancha, reparación)</option>
                          <option value="cuotas">Repartir en cuotas mensuales</option>
                        </select>
                        <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{inversionModo === "mes" ? "Se descuenta completo del resultado del mes en que lo registras." : inversionModo === "cuotas" ? "Se divide en partes iguales entre varios meses, desde el mes que indica 'Corresponde al mes'." : "Para equipos grandes: aparece debajo del resultado, sin restarlo del mes."}</div>
                      </Fld>
                    )}
                    {((form.insumo === "Inversión / equipamiento" && inversionModo === "cuotas") || (form.insumo === "Otro" && form.tipoGasto === "cuotas")) && (
                      <Fld label="¿En cuántos meses? *" full>
                        <input type="text" inputMode="numeric" value={cuotasN} onChange={(e) => setCuotasN(e.target.value.replace(/[^0-9]/g, ""))} style={S.inp} />
                        {Number(form.monto) > 0 && parseInt(cuotasN, 10) >= 2 && <div style={{ color: C.mustard, fontSize: 11, marginTop: 4 }}>Cuota mensual: {fmt(Math.round(Number(form.monto) / parseInt(cuotasN, 10)))} por {parseInt(cuotasN, 10)} meses</div>}
                      </Fld>
                    )}
                    <Fld label={INSUMOS_SIN_CANTIDAD.includes(form.insumo) ? "Cantidad (opcional)" : "Cantidad *"}>
                      <input type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value, _errorCantidad: false })} style={{ ...S.inp, borderColor: form._errorCantidad ? C.red : C.border }} />
                      {form._errorCantidad && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>Ingresa la cantidad</div>}
                    </Fld>
                    <Fld label="Unidad">{ unidadFijaDe(form.insumo) ? (<div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, color: C.mustard, padding: "8px 10px", fontSize: 13, fontWeight: 700 }}>{unidadFijaDe(form.insumo)} <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>(fija según el insumo)</span></div>) : (<select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} style={S.inp}>{["unidad","kg","g","litro","ml","paquete","caja","bolsa"].map((u) => <option key={u}>{u}</option>)}</select>) }</Fld>
                    <Fld label="Fondo"><select value={form.fondo} onChange={(e) => setForm({ ...form, fondo: e.target.value })} style={S.inp}>{FONDOS.map((f) => <option key={f}>{f}</option>)}</select></Fld>
                    <Fld label={PROVEEDOR_OPCIONAL.includes(form.insumo) ? "Proveedor (opcional)" : "Proveedor *"}><select value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value, proveedorCustom: "", _errorProveedor: false })} style={{ ...S.inp, borderColor: form._errorProveedor ? C.red : C.border }}><option value="">{PROVEEDOR_OPCIONAL.includes(form.insumo) ? "Sin proveedor" : "Elige el proveedor…"}</option>{proveedores.map((p) => <option key={p}>{p}</option>)}<option value="__nuevo__">+ Nuevo…</option></select></Fld>
                    {form.proveedor === "__nuevo__" && <Fld label="Nombre" full><input value={form.proveedorCustom} onChange={(e) => setForm({ ...form, proveedorCustom: e.target.value })} style={S.inp} /></Fld>}
                    <Fld label="Nota" full><input placeholder="opcional" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} style={S.inp} /></Fld>
                  </div>
                  <button onClick={agregarGasto} disabled={saving} style={{ marginTop: 14, background: persona ? C.mustard : C.border, color: persona ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 700, cursor: persona ? "pointer" : "default", width: "100%" }}>
                    {saving ? "Guardando..." : persona ? `Guardar — ${persona}` : "Selecciona quién registra arriba"}
                  </button>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>💡 Si el insumo no está en la lista, elige "Otro" y escribe el nombre — quedará guardado y disponible para la próxima vez.</div>
                  </>)}
                </div>
              </div>
            )}
            {gastosView === "historial" && (
              <div>
                <div style={{ ...S.card, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(gastosPorRevisar > 0 || filtro.revisar) && (
                    <button onClick={() => setFiltro({ ...filtro, revisar: !filtro.revisar })} style={{ flexBasis: "100%", background: filtro.revisar ? C.orange : C.orange + "22", color: filtro.revisar ? "#fff" : C.orange, border: `1px solid ${C.orange}`, borderRadius: 8, padding: "7px 0", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                      ⚠️ Por revisar ({gastosPorRevisar}){filtro.revisar ? " · mostrando solo estos" : ""}
                    </button>
                  )}
                  {(gastosSinProveedor > 0 || filtro.sinProv) && (
                    <button onClick={() => setFiltro({ ...filtro, sinProv: !filtro.sinProv })} style={{ flexBasis: "100%", background: filtro.sinProv ? C.blue : C.blue + "22", color: filtro.sinProv ? "#fff" : C.blue, border: `1px solid ${C.blue}`, borderRadius: 8, padding: "7px 0", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                      🏷️ Sin proveedor ({gastosSinProveedor}){filtro.sinProv ? " · mostrando solo estos" : ""}
                    </button>
                  )}
                  {filtro.sinProv && gastosFiltrados.length > 0 && (
                    <button onClick={() => { setProvModal({ bulk: true, ids: gastosFiltrados.map((g) => g.id), total: gastosFiltrados.reduce((a, g) => a + g.monto, 0), insumos: [...new Set(gastosFiltrados.map((g) => nombreCanonico(g.insumo)))] }); setProvModalValor(""); setProvModalNuevo(""); setAdminClave(""); setAdminError(false); }} style={{ flexBasis: "100%", background: C.orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                      Asignar proveedor a estos {gastosFiltrados.length}
                    </button>
                  )}
                  {(filtro.insumo || filtro.sinProv || filtro.revisar || filtro.persona) && (() => {
                    const editables = gastosFiltrados.filter((g) => !["retiro", "pago_gustavo"].includes(categoriaGasto(g.insumo, nombresInsumosTodos, g.tipo_gasto)));
                    if (editables.length === 0) return null;
                    return (
                      <button onClick={() => { setReclasModal({ bulk: true, ids: editables.map((g) => g.id), total: editables.reduce((a, g) => a + g.monto, 0), insumos: [...new Set(editables.map((g) => nombreCanonico(g.insumo)))] }); setReclasTipo(""); setAdminClave(""); setAdminError(false); }} style={{ flexBasis: "100%", background: C.purple, color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                        Reclasificar estos {editables.length}
                      </button>
                    );
                  })()}
                  <select value={filtro.mes} onChange={(e) => setFiltro({ ...filtro, mes: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 110 }}><option value="">Todos los meses</option>{meses.map((m) => <option key={m}>{m}</option>)}</select>
                  <select value={filtro.insumo} onChange={(e) => setFiltro({ ...filtro, insumo: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 120 }}><option value="">Todos los insumos</option>{[...new Set(gastos.map((g) => nombreCanonico(g.insumo)))].sort((a, b) => a.localeCompare(b, "es")).map((i) => <option key={i}>{i}</option>)}</select>
                  <select value={filtro.persona} onChange={(e) => setFiltro({ ...filtro, persona: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 100 }}><option value="">Todos</option>{PERSONAS.map((p) => <option key={p}>{p}</option>)}</select>
                  {!filtro.mes && !filtro.insumo && !filtro.persona && !filtro.revisar && !filtro.sinProv && <div style={{ flexBasis: "100%", color: C.muted, fontSize: 11 }}>💡 Elige un insumo (o una persona) para reclasificar o asignar proveedor a varios gastos a la vez.</div>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: C.muted, fontSize: 12 }}>
                  <span>{gastosFiltrados.length} registros</span>
                  <span style={{ color: C.mustard, fontWeight: 700 }}>{fmt(gastosFiltrados.reduce((s, g) => s + g.monto, 0))}</span>
                </div>
                {gastosFiltrados.map((g) => (
                  <div key={g.id} style={{ ...S.card, marginBottom: 8, display: "flex", gap: 10 }}>
                    <div style={{ width: 3, borderRadius: 3, background: personColor(g.persona), flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{g.insumo}</div>
                      {g.cantidad && <div style={{ color: C.muted, fontSize: 11 }}>{g.cantidad} {g.unidad}</div>}
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span>{g.fecha}</span>
                        <Tag color={personColor(g.persona) + "33"} text={g.persona} textColor={personColor(g.persona)} />
                        <Tag text={g.fondo} />
                        {g.proveedor && <Tag text={normProv(g.proveedor)} color="#2A3530" textColor={C.green} />}
                        {g.mes_corresponde && g.mes_corresponde !== g.fecha.slice(0, 7) && <Tag text={`↪ ${nombreMes(g.mes_corresponde)}`} color={C.blue + "33"} textColor={C.blue} />}
                        {(() => { const cat = categoriaGasto(g.insumo, nombresInsumosTodos, g.tipo_gasto); const etiquetas = { cuotas: "En cuotas", operacional: "Operacional", fijo: "Costo fijo", equipamiento: "Equipo / reparación", inversion: "Inversión", sin_clasificar: "Sin clasificar", retiro: "Retiro de caja", pago_gustavo: "Sueldo Gustavo" }; return etiquetas[cat] ? <Tag text={cat === "cuotas" ? `En ${cuotasDe(g)} cuotas` : etiquetas[cat]} color={(cat === "sin_clasificar" ? C.orange : C.purple) + "33"} textColor={cat === "sin_clasificar" ? C.orange : C.purple} /> : null; })()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: C.mustard }}>{fmt(g.monto)}</div>
                      {!g.proveedor && !PROVEEDOR_OPCIONAL.includes(g.insumo) && (
                        <button onClick={() => { setProvModal(g); setProvModalValor(""); setProvModalNuevo(""); setAdminClave(""); setAdminError(false); }} style={{ background: "none", border: "none", color: C.orange, cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4, display: "block", marginLeft: "auto" }}>asignar proveedor</button>
                      )}
                      {categoriaGasto(g.insumo, nombresInsumosTodos, g.tipo_gasto) === "retiro" ? (
                        <button onClick={() => { setRetiroModal(g); setRetiroModalDest("sueldo"); setRetiroModalSocio(""); setRetiroModalMes(g.fecha.slice(0, 7)); setAdminClave(""); setAdminError(false); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4, display: "block", marginLeft: "auto" }}>destino</button>
                      ) : (
                        <button onClick={() => { setReclasModal(g); setReclasTipo(cuotasDe(g) ? "cuotas" : (g.tipo_gasto || "")); if (cuotasDe(g)) setCuotasN(String(cuotasDe(g))); setAdminClave(""); setAdminError(false); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4, display: "block", marginLeft: "auto" }}>reclasificar</button>
                      )}
                      <button onClick={() => solicitarEliminacion("gasto", g)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4, display: "block", marginLeft: "auto" }}>eliminar</button>
                    </div>
                  </div>
                ))}
                <button onClick={exportCSV} style={{ marginTop: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "9px 0", cursor: "pointer", fontSize: 13, width: "100%" }}>Exportar CSV</button>
              </div>
            )}
            {gastosView === "resumen" && (() => {
              const claveMes = (g) => g.mes_corresponde || g.fecha.slice(0, 7);
              const mesesDisp = [...new Set([...gastos.map(claveMes), mesActual])].sort().reverse();
              const mesSel = resumenInsMes && mesesDisp.includes(resumenInsMes) ? resumenInsMes : mesActual;
              const [yy, mm] = mesSel.split("-").map(Number);
              const dPrev = new Date(yy, mm - 2, 1);
              const mesPrev = `${dPrev.getFullYear()}-${String(dPrev.getMonth() + 1).padStart(2, "0")}`;
              const gSel = gastos.filter((g) => claveMes(g) === mesSel);
              const gPrev = gastos.filter((g) => claveMes(g) === mesPrev);
              const catDe = (g) => categoriaGasto(g.insumo, nombresInsumosTodos, g.tipo_gasto);
              const grupos = [
                { id: "costo_ventas", titulo: "Costo de ventas", color: C.green, nota: "Ingredientes y envases" },
                { id: "operacional", titulo: "Operacionales", color: C.blue, nota: "Gas, limpieza, consumibles" },
                { id: "fijo", titulo: "Costos fijos", color: C.purple, nota: "Patente, contador, arriendo…" },
                { id: "equipamiento", titulo: "Equipamiento y reparaciones", color: C.blue, nota: "Restan en el mes" },
                { id: "cuotas", titulo: "Compras en cuotas", color: C.blue, nota: "Se reparten en varios meses en el estado de resultados" },
                { id: "sin_clasificar", titulo: "Sin clasificar", color: C.orange, nota: "Reclasifícalos en el Historial" },
                { id: "inversion", titulo: "Inversiones", color: C.muted, nota: "No restan del resultado" },
                { id: "pago_gustavo", titulo: "Pagos a Gustavo", color: C.muted, nota: "No restan: su sueldo sale de la fórmula" },
                { id: "retiro", titulo: "Retiros de caja", color: C.muted, nota: "No restan del resultado" },
              ];
              const sumar = (arr) => arr.reduce((a, g) => a + g.monto, 0);
              const totalSel = sumar(gSel);
              const totalPrev = sumar(gPrev);
              const fmtPrecio = (pr) => (pr < 100 ? "$" + pr.toFixed(2).replace(".", ",") : fmt(Math.round(pr)));
              const deltaTxt = (a, b) => { if (!b) return a ? "nuevo" : ""; const d = a - b; const pct = Math.round((d / b) * 100); return `${d >= 0 ? "▲" : "▼"} ${fmt(Math.abs(d))} (${pct > 0 ? "+" : ""}${pct}%)`; };
              const deltaColor = (a, b) => (!b ? C.muted : a > b ? C.red : a < b ? C.green : C.muted);
              const dmy3 = (f) => f.split("-").reverse().join("-");
              const UMBRAL_PRECIO = 0.10; // alerta si el precio cambia más de 10%
              const insDe = (nombre) => { const ref = resolverInsumo(nombre) || nombre; return insumosPrecio.find((i) => i.nombre === ref) || insumosPrecio.find((i) => normNombre(i.nombre) === normNombre(nombre)) || null; };

              // ---- filas por insumo (con datos del mes anterior)
              const filasDe = (cat) => {
                const m = {};
                gSel.filter((g) => catDe(g) === cat).forEach((g) => {
                  const k = nombreCanonico(g.insumo);
                  if (!m[k]) m[k] = { nombre: k, monto: 0, qty: 0, compras: 0, unidades: new Set(), items: [] };
                  const r = m[k];
                  r.monto += g.monto; r.compras += 1; r.items.push(g);
                  if (g.cantidad && !isNaN(Number(g.cantidad))) { r.qty += Number(g.cantidad); r.unidades.add(g.unidad || "unidad"); }
                });
                const prev = {};
                gPrev.filter((g) => catDe(g) === cat).forEach((g) => {
                  const k = nombreCanonico(g.insumo);
                  if (!prev[k]) prev[k] = { monto: 0, qty: 0, unidades: new Set() };
                  prev[k].monto += g.monto;
                  if (g.cantidad && !isNaN(Number(g.cantidad))) { prev[k].qty += Number(g.cantidad); prev[k].unidades.add(g.unidad || "unidad"); }
                });
                return Object.values(m).map((r) => ({ ...r, prev: prev[r.nombre]?.monto || 0, prevData: prev[r.nombre] || null })).sort((a, b) => b.monto - a.monto);
              };

              // ---- 1) alertas de precio (solo ingredientes)
              const alertas = [];
              filasDe("costo_ventas").forEach((r) => {
                const unid = r.unidades.size === 1 ? [...r.unidades][0] : null;
                if (!unid || r.qty <= 0) return;
                const precioHoy = r.monto / r.qty;
                const textos = [];
                const pd = r.prevData;
                if (pd && pd.unidades.size === 1 && [...pd.unidades][0] === unid && pd.qty > 0) {
                  const precioPrev = pd.monto / pd.qty;
                  const cambio = precioHoy / precioPrev - 1;
                  if (Math.abs(cambio) > UMBRAL_PRECIO) textos.push(`${cambio > 0 ? "subió" : "bajó"} ${Math.abs(Math.round(cambio * 100))}% vs ${nombreMes(mesPrev)} (${fmtPrecio(precioPrev)} → ${fmtPrecio(precioHoy)}/${unid})`);
                }
                const reg = insDe(r.nombre);
                if (reg && reg.nombre !== "Mayonesa Casera" && reg.unidad === unid && reg.precio_por_kg > 0) {
                  const factor = MERMA_INSUMOS[reg.nombre] || 0;
                  const escala = unid === "ml" || unid === "g" ? 1000 : 1; // el precio de Recetas es por litro / kg
                  const etiqUnid = unid === "ml" ? "litro" : unid === "g" ? "kg" : unid;
                  const precioComparable = (precioHoy * escala) / (1 - factor);
                  const dif = precioComparable / reg.precio_por_kg - 1;
                  if (Math.abs(dif) > UMBRAL_PRECIO) textos.push(`compraste a ${fmtPrecio(precioComparable)}/${etiqUnid} y en Recetas tienes ${fmtPrecio(reg.precio_por_kg)}/${etiqUnid} (${dif > 0 ? "+" : ""}${Math.round(dif * 100)}%)`);
                }
                if (textos.length > 0) alertas.push({ nombre: r.nombre, textos });
              });

              // ---- 2) compras vs consumo (según ventas y recetas del mes)
              const consumoMes = {};
              ventas.filter((v) => v.fecha.startsWith(mesSel)).forEach((v) => {
                const rec = recetas.find((r) => r.nombre_producto === v.producto);
                if (!rec || !rec.ingredientes) return;
                ingredientesEfectivos(rec, parseNota(v)).forEach((ing) => { consumoMes[ing.insumo] = (consumoMes[ing.insumo] || 0) + (ing.gramos || 0) * v.cantidad; });
              });
              const comprasMes = {};
              gSel.filter((g) => catDe(g) === "costo_ventas").forEach((g) => { const k = nombreCanonico(g.insumo); comprasMes[k] = (comprasMes[k] || 0) + aGramos(g.cantidad, g.unidad); });
              const filasConsumo = Object.keys(comprasMes).map((nombre) => {
                const reg = insDe(nombre);
                if (!reg || !(consumoMes[reg.nombre] > 0)) return null;
                const factor = MERMA_INSUMOS[reg.nombre] || 0;
                const consumido = consumoMes[reg.nombre] / (1 - factor);
                const comprado = comprasMes[nombre];
                const kgL = reg.unidad === "kg" || reg.unidad === "litro";
                return { nombre: reg.nombre, comprado, consumido, dif: comprado - consumido, kgL, unidad: reg.unidad };
              }).filter(Boolean).sort((a, b) => Math.abs(b.dif) - Math.abs(a.dif));
              const fmtQ = (x, kgL, unidad) => (kgL ? `${(x / 1000).toFixed(2)} ${unidad}` : `${Math.round(x)} und`);

              // ---- 3) por proveedor (solo compras: sin retiros ni pagos a Gustavo)
              const esCompra = (g) => !["retiro", "pago_gustavo"].includes(catDe(g));
              const proveedoresDe = (arr) => { const m = {}; arr.filter(esCompra).forEach((g) => { const k = g.proveedor ? normProv(g.proveedor) : "Sin proveedor"; if (!m[k]) m[k] = { nombre: k, monto: 0, compras: 0, items: [] }; m[k].monto += g.monto; m[k].compras += 1; m[k].items.push(g); }); return m; };
              const provSel = proveedoresDe(gSel);
              const provPrev = proveedoresDe(gPrev);
              const filasProv = Object.values(provSel).map((p) => ({ ...p, prev: provPrev[p.nombre]?.monto || 0 })).sort((a, b) => b.monto - a.monto);
              const totalProv = filasProv.reduce((a, p) => a + p.monto, 0);

              // ---- 5) bebidas de la botillería (costo imputado por venta)
              const insBebida = insumosPrecio.find((i) => normNombre(i.nombre).startsWith("bebida"));
              const filasBebida = ventas.filter((v) => v.fecha.startsWith(mesSel) && recetas.find((r) => r.nombre_producto === v.producto)?.categoria === "bebidas");
              const undBebida = filasBebida.reduce((a, v) => a + v.cantidad, 0);
              const consumosBot = sumar(gSel.filter((g) => g.fondo === "Botillería"));
              const costoBebida = Math.round(filasBebida.reduce((a, v) => {
                const rec = recetas.find((r) => r.nombre_producto === v.producto);
                const porIng = calcularCosto(rec?.ingredientes, insumosPrecio);
                return a + v.cantidad * (porIng > 0 ? porIng : (insBebida?.precio_por_kg || 0));
              }, 0));

              // ---- 4) exportar CSV del mes
              const exportarMes = () => {
                const esc = (v) => { const t = String(v ?? ""); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
                const nombresCat = { costo_ventas: "Costo de ventas", operacional: "Operacional", fijo: "Costo fijo", sin_clasificar: "Sin clasificar", inversion: "Inversión", equipamiento: "Equipamiento / reparación", cuotas: "En cuotas", pago_gustavo: "Pago Gustavo", retiro: "Retiro de caja" };
                const header = ["Mes", "Fecha de pago", "Categoría", "Insumo", "Cantidad", "Unidad", "Monto", "Proveedor", "Persona", "Fondo", "Nota"];
                const rows = [...gSel].sort((a, b) => (a.fecha < b.fecha ? -1 : 1)).map((g) => [mesSel, g.fecha, nombresCat[catDe(g)], nombreCanonico(g.insumo), g.cantidad || "", g.unidad || "", g.monto, g.proveedor ? normProv(g.proveedor) : "", g.persona, g.fondo, g.nota || ""].map(esc).join(","));
                const csv = "\uFEFF" + [header.map(esc).join(","), ...rows].join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
                a.download = `gastos_${mesSel}.csv`;
                a.click();
              };

              const vistaBtn = (id, label) => (
                <button key={id} onClick={() => { setResumenInsVista(id); setResumenInsAbierto(null); }} style={{ flex: 1, background: resumenInsVista === id ? C.mustard : C.tag, color: resumenInsVista === id ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "7px 0", cursor: "pointer", fontWeight: resumenInsVista === id ? 700 : 400, fontSize: 12 }}>{label}</button>
              );
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>Mes:</div>
                      <select value={mesSel} onChange={(e) => { setResumenInsMes(e.target.value); setResumenInsAbierto(null); }} style={S.inp}>
                        {mesesDisp.map((m) => <option key={m} value={m}>{nombreMes(m)}{m === mesActual ? " (en curso)" : ""}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ color: C.muted, fontSize: 12 }}>Total ingresado en Gastos</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: C.mustard }}>{fmt(totalSel)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 3 }}>
                      <span style={{ color: C.muted }}>vs {nombreMes(mesPrev)}: {fmt(totalPrev)}</span>
                      <span style={{ color: deltaColor(totalSel, totalPrev), fontWeight: 700 }}>{deltaTxt(totalSel, totalPrev)}</span>
                    </div>
                    <div style={{ color: C.muted, fontSize: 10, marginTop: 8 }}>Incluye todo lo ingresado con ese mes (también retiros, pagos e inversiones). Los grupos suman este total.</div>
                    <button onClick={exportarMes} disabled={gSel.length === 0} style={{ marginTop: 10, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "8px 0", cursor: gSel.length ? "pointer" : "default", fontSize: 12, width: "100%" }}>⬇️ Exportar el mes a CSV</button>
                  </div>

                  {alertas.length > 0 && (
                    <div style={{ ...S.card, borderLeft: `4px solid ${C.orange}` }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>⚠️ Alertas de precio ({alertas.length})</div>
                      {alertas.map((a) => (
                        <div key={a.nombre} style={{ padding: "5px 0", borderTop: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.nombre}</div>
                          {a.textos.map((t, i) => <div key={i} style={{ fontSize: 11, color: C.orange }}>• {t}</div>)}
                        </div>
                      ))}
                      <div style={{ color: C.muted, fontSize: 10, marginTop: 6 }}>Cambios de más de {Math.round(UMBRAL_PRECIO * 100)}%. Si el precio nuevo es el real, actualízalo en Recetas → Insumos para que los costos de las recetas queden al día.</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6 }}>
                    {vistaBtn("insumos", "Por insumo")}{vistaBtn("proveedor", "Por proveedor")}{vistaBtn("consumo", "Compras vs uso")}
                  </div>

                  {gSel.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 30 }}>Sin gastos en este mes</div>}

                  {resumenInsVista === "insumos" && (
                    <>
                      {grupos.map((gr) => {
                        const filas = filasDe(gr.id);
                        if (filas.length === 0) return null;
                        const totGr = filas.reduce((a, r) => a + r.monto, 0);
                        const totGrPrev = sumar(gPrev.filter((g) => catDe(g) === gr.id));
                        return (
                          <div key={gr.id} style={{ ...S.card, borderLeft: `4px solid ${gr.color}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{gr.titulo}</div>
                              <div style={{ fontWeight: 800, fontSize: 16, color: gr.color === C.muted ? C.text : gr.color }}>{fmt(totGr)}</div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 6 }}>
                              <span>{gr.nota}</span>
                              <span style={{ color: deltaColor(totGr, totGrPrev) }}>{deltaTxt(totGr, totGrPrev)}</span>
                            </div>
                            {filas.map((r) => {
                              const clave = gr.id + "|" + r.nombre;
                              const abierto = resumenInsAbierto === clave;
                              const unid = r.unidades.size === 1 ? [...r.unidades][0] : null;
                              const pct = totGr > 0 ? Math.round((r.monto / totGr) * 100) : 0;
                              const conAlerta = alertas.some((a) => a.nombre === r.nombre);
                              return (
                                <div key={clave}>
                                  <div onClick={() => setResumenInsAbierto(abierto ? null : clave)} style={{ cursor: "pointer", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                                      <span style={{ fontSize: 13 }}><span style={{ color: C.muted, fontSize: 10 }}>{abierto ? "▼" : "▶"}</span> {r.nombre}{conAlerta ? " ⚠️" : ""}</span>
                                      <span style={{ fontWeight: 700, color: C.mustard, whiteSpace: "nowrap" }}>{fmt(r.monto)} <span style={{ color: C.muted, fontWeight: 400, fontSize: 10 }}>({pct}%)</span></span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 2, gap: 8 }}>
                                      <span>{unid ? `${Number(r.qty.toFixed(2))} ${unid} · ` : ""}{r.compras} {r.compras === 1 ? "compra" : "compras"}{unid && r.qty > 0 ? ` · ${fmtPrecio(r.monto / r.qty)}/${unid}` : ""}</span>
                                      <span style={{ color: deltaColor(r.monto, r.prev), whiteSpace: "nowrap" }}>{deltaTxt(r.monto, r.prev)}</span>
                                    </div>
                                  </div>
                                  {abierto && (
                                    <div style={{ background: C.bg, borderRadius: 8, padding: "6px 10px", margin: "2px 0 8px" }}>
                                      {[...r.items].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).map((g) => (
                                        <div key={g.id} style={{ padding: "4px 0", borderBottom: `1px solid ${C.border}33` }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 8 }}>
                                            <span>{dmy3(g.fecha)}{g.cantidad ? ` · ${g.cantidad} ${g.unidad || ""}` : ""}</span>
                                            <span style={{ fontWeight: 700, color: C.mustard }}>{fmt(g.monto)}</span>
                                          </div>
                                          <div style={{ color: C.muted, fontSize: 10 }}>{g.proveedor ? normProv(g.proveedor) : "sin proveedor"} · {g.persona} · {g.fondo}{g.mes_corresponde && g.mes_corresponde !== g.fecha.slice(0, 7) ? ` · pagado el ${dmy3(g.fecha)}` : ""}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      {(undBebida > 0 || consumosBot > 0) && (
                        <div style={{ ...S.card, borderLeft: `4px solid ${C.orange}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>🥤 Botillería</div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: C.orange }}>{fmt(costoBebida + consumosBot)}</div>
                          </div>
                          <div style={{ color: C.orange, fontSize: 11, marginTop: 2 }}>Por pagar a botillería este mes</div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8 }}>
                            <span>Bebidas vendidas <span style={{ color: C.muted, fontSize: 10 }}>({undBebida} und{insBebida ? ` × ${fmt(insBebida.precio_por_kg)}` : ""})</span></span>
                            <span style={{ fontWeight: 700 }}>{fmt(costoBebida)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                            <span>Consumos internos <span style={{ color: C.muted, fontSize: 10 }}>(toalla, guantes, etc.)</span></span>
                            <span style={{ fontWeight: 700 }}>{fmt(consumosBot)}</span>
                          </div>
                          <div style={{ color: C.muted, fontSize: 10, marginTop: 8 }}>Las bebidas se calculan por cada venta y no están en el total de arriba. Los consumos internos sí: son gastos con fondo "Botillería", ya incluidos en sus grupos.</div>
                        </div>
                      )}
                    </>
                  )}

                  {resumenInsVista === "proveedor" && (
                    <div style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Compras por proveedor</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: C.mustard }}>{fmt(totalProv)}</div>
                      </div>
                      <div style={{ color: C.muted, fontSize: 10, marginBottom: 6 }}>Sin retiros de caja ni pagos a Gustavo, que no son compras.</div>
                      {filasProv.length === 0 && <Empty />}
                      {filasProv.map((p) => {
                        const clave = "prov|" + p.nombre;
                        const abierto = resumenInsAbierto === clave;
                        const porInsumo = {};
                        p.items.forEach((g) => { const k = nombreCanonico(g.insumo); porInsumo[k] = (porInsumo[k] || 0) + g.monto; });
                        return (
                          <div key={clave}>
                            <div onClick={() => setResumenInsAbierto(abierto ? null : clave)} style={{ cursor: "pointer", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                                <span style={{ fontSize: 13 }}><span style={{ color: C.muted, fontSize: 10 }}>{abierto ? "▼" : "▶"}</span> {p.nombre}</span>
                                <span style={{ fontWeight: 700, color: C.mustard, whiteSpace: "nowrap" }}>{fmt(p.monto)} <span style={{ color: C.muted, fontWeight: 400, fontSize: 10 }}>({totalProv > 0 ? Math.round((p.monto / totalProv) * 100) : 0}%)</span></span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 2 }}>
                                <span>{p.compras} {p.compras === 1 ? "compra" : "compras"}</span>
                                <span style={{ color: deltaColor(p.monto, p.prev) }}>{deltaTxt(p.monto, p.prev)}</span>
                              </div>
                            </div>
                            {abierto && (
                              <div style={{ background: C.bg, borderRadius: 8, padding: "6px 10px", margin: "2px 0 8px" }}>
                                {Object.entries(porInsumo).sort((a, b) => b[1] - a[1]).map(([n, mo]) => (
                                  <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}><span>{n}</span><span style={{ fontWeight: 700, color: C.mustard }}>{fmt(mo)}</span></div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {resumenInsVista === "consumo" && (
                    <div style={S.card}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Compras vs uso del mes</div>
                      <div style={{ color: C.muted, fontSize: 10, marginBottom: 8 }}>Lo comprado en el mes frente a lo que se usó según las ventas y las recetas. No es la merma: la merma real se mide al ajustar el inventario.</div>
                      {filasConsumo.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>No hay insumos con compras y consumo en este mes.</div>}
                      {filasConsumo.map((f) => {
                        const exceso = f.dif >= 0;
                        return (
                          <div key={f.nombre} style={{ padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                              <span style={{ fontSize: 13 }}>{f.nombre}</span>
                              <span style={{ fontWeight: 700, color: exceso ? C.orange : C.blue, whiteSpace: "nowrap" }}>{exceso ? "+" : "−"}{fmtQ(Math.abs(f.dif), f.kgL, f.unidad)}</span>
                            </div>
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Compraste {fmtQ(f.comprado, f.kgL, f.unidad)} · se usó {fmtQ(f.consumido, f.kgL, f.unidad)} · {exceso ? "quedó de más en stock (o es merma)" : "usaste stock de antes"}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            {gastosView === "stock" && (() => {
              const stock = calcularStock(gastos, ventas, recetas, insumosPrecio);
              const alertColor = { verde: C.green, naranja: C.orange, rojo: C.red };
              const alertEmoji = { verde: "🟢", naranja: "🟡", rojo: "🔴" };
              return (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ color: C.muted, fontSize: 12 }}>
                      {inventarioInicial.length > 0
                        ? `Desde ajuste del ${inventarioInicial[0]?.fecha}`
                        : "Basado en todas las compras vs ventas"}
                    </div>
                    {(
                      <button onClick={() => { setAjusteValues({}); setModalAjuste(true); }} style={{ background: C.blue, border: "none", color: "#fff", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>📦 Ajuste inventario</button>
                    )}
                  </div>
                  {stock.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>Sin datos suficientes. Registra compras con cantidad y unidad.</div>}
                  {stock.map((s) => {
                    const unidadDisplay = s.unidad === "kg" || s.unidad === "litro" ? s.unidad : "und";
                    const esKgLitro = s.unidad === "kg" || s.unidad === "litro";
                    const dispStr = esKgLitro
                      ? s.disponibleKg >= 1 ? `${s.disponibleKg.toFixed(2)} ${s.unidad}` : `${Math.round(s.disponible)} g`
                      : `${Math.round(s.disponible)} und`;
                    const compradoStr = esKgLitro ? `${(s.comprado/1000).toFixed(2)} ${s.unidad}` : `${Math.round(s.comprado)} und`;
                    const consumidoStr = esKgLitro ? `${(s.consumido/1000).toFixed(2)} ${s.unidad}` : `${Math.round(s.consumido)} und`;
                    return (
                      <div key={s.nombre} style={{ ...S.card, marginBottom: 10, borderLeft: `4px solid ${alertColor[s.alerta]}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontWeight: 700 }}>{alertEmoji[s.alerta]} {s.nombre}</div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: alertColor[s.alerta] }}>{dispStr}</div>
                        </div>
                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted }}>
                          <span>Comprado: <span style={{ color: C.text }}>{compradoStr}</span></span>
                          <span>Consumido: <span style={{ color: C.text }}>{consumidoStr}</span></span>
                        </div>
                        <div style={{ marginTop: 8, background: C.border, borderRadius: 4, height: 6 }}>
                          <div style={{ background: alertColor[s.alerta], width: `${Math.min(100, s.comprado > 0 ? Math.round((Math.max(0, s.disponible) / s.comprado) * 100) : 0)}%`, height: "100%", borderRadius: 4 }} />
                        </div>
                        {s.alerta === "rojo" && <div style={{ color: C.red, fontSize: 11, marginTop: 6, fontWeight: 700 }}>⚠️ Stock crítico — comprar urgente</div>}
                        {s.alerta === "naranja" && <div style={{ color: C.orange, fontSize: 11, marginTop: 6 }}>⚡ Stock bajo — considerar compra</div>}
                        {(s.ins?.alerta_bajo != null || s.ins?.alerta_critico != null) && (
                          <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
                            Límites: 🟡 {s.esKgLitro ? `${s.umbralBajo / 1000} ${s.unidad}` : `${s.umbralBajo} und`} · 🔴 {s.esKgLitro ? `${s.umbralCritico / 1000} ${s.unidad}` : `${s.umbralCritico} und`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {view === "ventas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[{ id: "registrar", label: "🧾 Registrar" }, { id: "dashboard", label: "📊 Dashboard" }, { id: "historial", label: "📋 Historial" }, { id: "porproducto", label: "🔍 Por Producto" }, ...(persona === "Alejandro" ? [{ id: "caja", label: "🔐 Caja" }] : [])].map((t) => (
                <button key={t.id} onClick={() => { setVentaView(t.id); if (t.id === "caja") cargarHistorialTurnos(); }} style={{ background: ventaView === t.id ? C.mustard : C.tag, color: ventaView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: ventaView === t.id ? 700 : 400, fontSize: 12 }}>{t.label}</button>
              ))}
            </div>

            {ventaView === "registrar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Banner caja */}
              {!turnoActivo ? (
                <div style={{ background: C.red + "22", border: `1px solid ${C.red}`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 700, color: C.red }}>🔴 Caja cerrada</div><div style={{ color: C.muted, fontSize: 12 }}>Abre la caja antes de registrar ventas</div></div>
                  <button onClick={() => { if (!persona) { showToast("Selecciona quién abre"); return; } setModalApertura(true); }} style={{ background: C.green, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>Abrir caja</button>
                </div>
              ) : (
                <div style={{ background: C.green + "22", border: `1px solid ${C.green}`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 700, color: C.green }}>🟢 Caja abierta</div><div style={{ color: C.muted, fontSize: 12 }}>Saldo inicial: {fmt(turnoActivo.saldo_inicial)} · {turnoActivo.persona}</div></div>
                  <button onClick={() => { if (!persona) { showToast("Selecciona quién cierra"); return; } setModalCierre(true); }} style={{ background: C.red, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>Cerrar turno</button>
                </div>
              )}
                <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Fld label="Fecha"><input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} style={S.inp} /></Fld>
                  <Fld label="Método de pago">
                    <div style={{ display: "flex", gap: 4 }}>
                      {["Efectivo", "Tarjeta", "Pedidos Ya"].map((m) => (
                        <button key={m} onClick={() => setMetodoPago(m)} style={{ flex: 1, background: metodoPago === m ? metodoPagoColors[m] : C.tag, color: metodoPago === m ? "#fff" : C.muted, border: "none", borderRadius: 6, padding: "7px 2px", cursor: "pointer", fontWeight: metodoPago === m ? 700 : 400, fontSize: 10 }}>{m}</button>
                      ))}
                    </div>
                  </Fld>
                </div>
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                  {CATEGORIAS.map((cat) => (
                    <button key={cat.id} onClick={() => setCatActiva(cat.id)} style={{ background: catActiva === cat.id ? C.mustard : C.tag, color: catActiva === cat.id ? C.bg : C.muted, border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontWeight: catActiva === cat.id ? 700 : 400, fontSize: 12, whiteSpace: "nowrap" }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
                <div style={S.card}>
                  {metodoPago === "Pedidos Ya" && <div style={{ color: C.orange, fontSize: 11, marginBottom: 8 }}>Precios Pedidos Ya (+{porcentajePY}%)</div>}
                  {loadingRecetas && <div style={{ color: C.muted, fontSize: 12 }}>Cargando...</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {recetas.filter((r) => r.categoria === catActiva).sort(cmpOrden).map((rec) => (
                      rec.variante_as?.activo ? (
                        <div key={rec.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px" }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>{rec.nombre_producto}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => agregarAlCarrito(rec)} style={{ flex: 1, background: C.tag, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 4px", cursor: "pointer", textAlign: "center" }}>
                              <div style={{ fontSize: 9, color: C.muted }}>Normal</div>
                              <div style={{ fontWeight: 800, fontSize: 13, color: metodoPago === "Pedidos Ya" ? C.orange : C.mustard }}>{fmt(precioProducto(rec))}</div>
                            </button>
                            {(() => {
                              const precioAS = metodoPago === "Pedidos Ya"
                                ? (rec.variante_as.precio_py || Math.round(rec.variante_as.precio_venta * (1 + porcentajePY / 100)))
                                : rec.variante_as.precio_venta;
                              return (
                                <button onClick={() => agregarAlCarrito(rec, { variante: "as", precio: precioAS, nombre: rec.nombre_producto })} style={{ flex: 1, background: C.tag, border: `1px solid ${C.blue}`, borderRadius: 7, padding: "7px 4px", cursor: "pointer", textAlign: "center" }}>
                                  <div style={{ fontSize: 9, color: C.blue }}>AS (churrasco)</div>
                                  <div style={{ fontWeight: 800, fontSize: 13, color: C.blue }}>{fmt(precioAS)}</div>
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                      <button key={rec.id} onClick={() => catActiva === "combos" ? agregarCombo(rec) : agregarAlCarrito(rec)}
                        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = catActiva === "combos" ? C.purple : C.mustard}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: C.text, marginBottom: 3, lineHeight: 1.3 }}>{rec.nombre_producto}</div>
                        {catActiva === "combos" && rec.productos_combo && rec.productos_combo.length > 0 && (
                          <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{rec.productos_combo.join(" + ")}</div>
                        )}
                        <div style={{ fontWeight: 800, fontSize: 15, color: metodoPago === "Pedidos Ya" ? C.orange : catActiva === "combos" ? C.purple : C.mustard }}>{fmt(precioProducto(rec))}</div>
                      </button>
                      )
                    ))}
                  </div>
                </div>
                {carrito.length > 0 && (
                  <div style={S.card}>
                    <STitle>Pedido actual</STitle>
                    {carrito.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nombre}</div>
                          <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
                            <Tag text={c.metodo_pago} color={(metodoPagoColors[c.metodo_pago] || C.muted) + "33"} textColor={metodoPagoColors[c.metodo_pago] || C.muted} />
                            {c.combo && <Tag text={`🎁 ${c.combo}`} color={C.purple + "33"} textColor={C.purple} />}
                            {c.variante === "as" && <Tag text="AS (churrasco)" color={C.blue + "33"} textColor={C.blue} />}
                            {c.descuento && <Tag text={c.descuento.tipo === "cortesia" ? `🎁 ${c.descuento.autorizado_por}` : `${c.descuento.porcentaje}% off`} color={C.green + "33"} textColor={C.green} />}
                            {!c.combo && (c.descuento
                              ? <button onClick={() => quitarDescuento(i)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 10, padding: 0 }}>quitar desc.</button>
                              : <button onClick={() => setDescuentoModal(c)} style={{ background: "none", border: "none", color: C.mustard, cursor: "pointer", fontSize: 10, padding: 0 }}>+ descuento</button>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <button onClick={() => cambiarCantidad(i, -1)} style={{ background: C.tag, border: "none", color: C.text, borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontWeight: 700 }}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{c.cantidad}</span>
                          <button onClick={() => cambiarCantidad(i, 1)} style={{ background: C.tag, border: "none", color: C.text, borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontWeight: 700 }}>+</button>
                          <span style={{ fontWeight: 700, color: c.descuento ? (c.descuento.tipo === "cortesia" ? C.orange : C.green) : c.combo ? C.purple : C.mustard, minWidth: 56, textAlign: "right" }}>{fmt(c.total)}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700 }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 22, color: C.green }}>{fmt(totalCarrito)}</span>
                    </div>
                    <button onClick={registrarVenta} disabled={savingVenta} style={{ marginTop: 10, background: C.green, border: "none", color: "#fff", borderRadius: 8, padding: "12px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%" }}>
                      {savingVenta ? "Guardando..." : "✓ Confirmar venta"}
                    </button>
                    <button onClick={() => setCarrito([])} style={{ marginTop: 8, background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "8px 0", cursor: "pointer", fontSize: 12, width: "100%" }}>Cancelar pedido</button>
                  </div>
                )}
              </div>
            )}

            {ventaView === "dashboard" && (() => {
              const ahora = today();
              const hace7 = new Date(); hace7.setDate(hace7.getDate() - 6);
              const hace7str = `${hace7.getFullYear()}-${String(hace7.getMonth()+1).padStart(2,"0")}-${String(hace7.getDate()).padStart(2,"0")}`;
              const mesParaCalculo = dashPeriodo === "mes" && dashMesElegido ? dashMesElegido : (ventasMeses[0] || mesActual);
              const ventasDelMesElegido = ventas.filter((v) => v.fecha.startsWith(mesParaCalculo) && !esComponente(v));
              const gastosDelMesElegido = gastos.filter((g) => g.fecha.startsWith(mesParaCalculo)).reduce((s, g) => s + g.monto, 0);
              const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
              const diasEntre = (d1, d2) => { const out = []; const a = new Date(d1 + "T00:00:00"); const b = new Date(d2 + "T00:00:00"); for (let d = new Date(a); d <= b && out.length < 93; d.setDate(d.getDate() + 1)) out.push(ymd(d)); return out; };
              const rDesde = dashDesde || `${mesActual}-01`;
              const rHasta = dashHasta || ahora;
              const [fDesde, fHasta] = dashPeriodo === "hoy" ? [ahora, ahora]
                : dashPeriodo === "7dias" ? [hace7str, ahora]
                : dashPeriodo === "rango" ? [rDesde, rHasta]
                : [`${mesParaCalculo}-01`, `${mesParaCalculo}-31`];
              const diasGrafico = dashPeriodo === "hoy" ? [ahora]
                : dashPeriodo === "7dias" ? diasEntre(hace7str, ahora)
                : dashPeriodo === "rango" ? diasEntre(rDesde, rHasta)
                : (() => { const [yy, mm] = mesParaCalculo.split("-").map(Number); return Array.from({ length: new Date(yy, mm, 0).getDate() }, (_, i) => ymd(new Date(yy, mm - 1, i + 1))).filter((d) => mesParaCalculo !== mesActual || d <= ahora); })();
              // Si se tocó un día en el gráfico, todo el panel pasa a mostrar solo ese día
              const fechaSel = puntoSeleccionado !== null && dashPeriodo !== "hoy" ? (diasGrafico[puntoSeleccionado] || null) : null;
              const enPeriodo = (f) => fechaSel ? f === fechaSel : (f >= fDesde && f <= fHasta);
              const ventasPeriodo = ventas.filter((v) => enPeriodo(v.fecha) && !esComponente(v));
              const totalPeriodo = ventasPeriodo.reduce((s, v) => s + v.total, 0);
              const cantidadPeriodo = ventasPeriodo.length;
              const ticketPromedio = cantidadPeriodo > 0 ? Math.round(totalPeriodo / cantidadPeriodo) : 0;
              const gastosPeriodo = gastos.filter((g) => enPeriodo(g.fecha)).reduce((s, g) => s + g.monto, 0);
              const dmy = (f) => f.split("-").reverse().join("-");
              const etiquetaPeriodo = fechaSel ? `Día ${dmy(fechaSel)}`
                : dashPeriodo === "hoy" ? `Hoy ${dmy(ahora)}`
                : dashPeriodo === "7dias" ? `Últimos 7 días (${dmy(hace7str)} → ${dmy(ahora)})`
                : dashPeriodo === "rango" ? `${dmy(rDesde)} → ${dmy(rHasta)}`
                : `Mes ${mesParaCalculo}`;
              const utilidadPeriodo = totalPeriodo - gastosPeriodo;
              const margenOperacional = totalPeriodo > 0 && gastosPeriodo > 0 ? Math.round((utilidadPeriodo / totalPeriodo) * 100) : null;
              const ventasDia = diasGrafico.map((d) => ({ dia: d.slice(8), fecha: d, total: ventas.filter((v) => v.fecha === d && !esComponente(v)).reduce((s, v) => s + v.total, 0) }));
              const maxDia = Math.max(...ventasDia.map((d) => d.total), 1);
              const metodosPeriodo = ["Efectivo", "Tarjeta", "Pedidos Ya"].map((m) => ({ m, t: ventasPeriodo.filter((v) => v.metodo_pago === m).reduce((s, v) => s + v.total, 0) })).filter((x) => x.t > 0);
              const productosTodos = Object.entries(ventasPeriodo.reduce((acc, v) => { acc[v.producto] = acc[v.producto] || { total: 0, cantidad: 0, as: 0 }; acc[v.producto].total += v.total; acc[v.producto].cantidad += v.cantidad; if (parseNota(v).variante === "as") acc[v.producto].as += v.cantidad; return acc; }, {})).map(([n, d]) => ({ n, ...d })).sort((a, b) => b.total - a.total);
              const productosPeriodo = dashVerTodosProd ? productosTodos : productosTodos.slice(0, 8);
              const cortesiasPeriodo = ventasPeriodo.filter((v) => { try { return JSON.parse(v.nota || "{}").tipo === "cortesia"; } catch { return false; } });
              const descuentosPeriodo = ventasPeriodo.filter((v) => { try { return JSON.parse(v.nota || "{}").tipo === "personal"; } catch { return false; } });
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[{ id: "hoy", label: "Hoy" }, { id: "7dias", label: "7 días" }, { id: "mes", label: "Mes" }, { id: "rango", label: "Rango" }].map((p) => (
                      <button key={p.id} onClick={() => { setDashPeriodo(p.id); setPuntoSeleccionado(null); }} style={{ flex: 1, background: dashPeriodo === p.id ? C.green : C.tag, color: dashPeriodo === p.id ? "#fff" : C.muted, border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontWeight: dashPeriodo === p.id ? 700 : 400, fontSize: 13 }}>{p.label}</button>
                    ))}
                  </div>
                  {dashPeriodo === "mes" && (
                    <select value={dashMesElegido || ventasMeses[0] || mesActual} onChange={(e) => { setDashMesElegido(e.target.value); setPuntoSeleccionado(null); }} style={S.inp}>
                      {ventasMeses.map((m) => <option key={m} value={m}>{m === mesActual ? `${m} (actual)` : m}</option>)}
                    </select>
                  )}
                  {dashPeriodo === "rango" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="date" value={rDesde} max={rHasta} onChange={(e) => { setDashDesde(e.target.value); setPuntoSeleccionado(null); }} style={S.inp} />
                      <input type="date" value={rHasta} min={rDesde} onChange={(e) => { setDashHasta(e.target.value); setPuntoSeleccionado(null); }} style={S.inp} />
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span style={{ color: fechaSel ? C.blue : C.muted, fontWeight: fechaSel ? 700 : 400 }}>Mostrando: {etiquetaPeriodo}</span>
                    {fechaSel && <button onClick={() => setPuntoSeleccionado(null)} style={{ background: C.tag, border: "none", color: C.blue, borderRadius: 14, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Ver período completo</button>}
                  </div>
                  <div style={S.card}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                      <div style={{ textAlign: "center" }}><div style={{ color: C.muted, fontSize: 11 }}>Ventas</div><div style={{ fontWeight: 800, fontSize: 20, color: C.green }}>{fmt(totalPeriodo)}</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ color: C.muted, fontSize: 11 }}>Ticket prom.</div><div style={{ fontWeight: 800, fontSize: 20, color: C.mustard }}>{fmt(ticketPromedio)}</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ color: C.muted, fontSize: 11 }}>Transacciones</div><div style={{ fontWeight: 800, fontSize: 20, color: C.blue }}>{cantidadPeriodo}</div></div>
                    </div>
                  </div>
                  {dashPeriodo !== "hoy" && (() => {
                    const n = ventasDia.length;
                    const totalPorFecha = {};
                    ventas.forEach((v) => { if (!esComponente(v)) totalPorFecha[v.fecha] = (totalPorFecha[v.fecha] || 0) + v.total; });
                    const prevFecha = (f) => {
                      if (dashPeriodo === "mes") {
                        const [yy, mm, dd] = f.split("-").map(Number);
                        const pm = new Date(yy, mm - 2, 1);
                        const ultimo = new Date(pm.getFullYear(), pm.getMonth() + 1, 0).getDate();
                        return dd > ultimo ? null : ymd(new Date(pm.getFullYear(), pm.getMonth(), dd));
                      }
                      const dt = new Date(f + "T00:00:00"); dt.setDate(dt.getDate() - n); return ymd(dt);
                    };
                    const prevFechas = ventasDia.map((d) => prevFecha(d.fecha));
                    const prevVals = prevFechas.map((f) => f ? (totalPorFecha[f] || 0) : null);
                    const hayPrev = prevVals.some((v) => v);
                    const etiquetaPrev = dashPeriodo === "mes" ? "mes anterior" : "período anterior";
                    const acumulado = dashModoGrafico === "acumulado";
                    const cumCur = []; const cumPrev = [];
                    let accC = 0, accP = 0;
                    ventasDia.forEach((d, i) => { accC += d.total; cumCur[i] = accC; accP += (prevVals[i] || 0); cumPrev[i] = accP; });
                    const serieMax = acumulado ? Math.max(...cumCur, ...cumPrev, 1) : Math.max(...ventasDia.map((d) => d.total), ...prevVals.map((v) => v || 0), 1);
                    const w = 300, h = 120, padX = 4, padTop = 12, padBottom = 2;
                    const colW = (w - padX * 2) / Math.max(n, 1);
                    const barW = colW * 0.64;
                    const cx = (i) => padX + i * colW + colW / 2;
                    const yv = (v) => padTop + (1 - v / serieMax) * (h - padTop - padBottom);
                    const pathDe = (arr) => { let d = ""; let lapiz = false; arr.forEach((v, i) => { if (v === null || v === undefined) { lapiz = false; return; } d += `${lapiz ? "L" : "M"} ${cx(i).toFixed(1)} ${yv(v).toFixed(1)} `; lapiz = true; }); return d; };
                    const sel = puntoSeleccionado;
                    const mostrarCadaN = n > 15 ? Math.ceil(n / 10) : 1;
                    const irA = (dir) => { if (n === 0) return; if (sel === null) setPuntoSeleccionado(dir < 0 ? n - 1 : 0); else setPuntoSeleccionado(Math.min(n - 1, Math.max(0, sel + dir))); };
                    let comp = null;
                    if (hayPrev) {
                      if (sel !== null) { const b = prevVals[sel]; if (b !== null) comp = { titulo: `Ese día vs ${dmy(prevFechas[sel])}`, a: ventasDia[sel].total, b }; }
                      else comp = { titulo: `Acumulado vs ${etiquetaPrev}, a la misma fecha`, a: cumCur[n - 1] || 0, b: cumPrev[n - 1] || 0 };
                    }
                    const cd = comp ? { d: comp.a - comp.b, pct: comp.b > 0 ? Math.round(((comp.a - comp.b) / comp.b) * 100) : null } : null;
                    const botonFlecha = { background: C.tag, border: "none", color: C.text, borderRadius: 8, width: 38, height: 34, cursor: "pointer", fontSize: 14 };
                    return (
                      <div style={S.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Ventas por día</div>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[{ id: "diario", label: "Diario" }, { id: "acumulado", label: "Acumulado" }].map((m) => (
                              <button key={m.id} onClick={() => setDashModoGrafico(m.id)} style={{ background: dashModoGrafico === m.id ? C.green : C.tag, color: dashModoGrafico === m.id ? "#fff" : C.muted, border: "none", borderRadius: 14, padding: "3px 11px", fontSize: 11, fontWeight: dashModoGrafico === m.id ? 700 : 400, cursor: "pointer" }}>{m.label}</button>
                            ))}
                          </div>
                        </div>
                        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 140, display: "block" }} preserveAspectRatio="none">
                          {!acumulado && ventasDia.map((d, i) => {
                            const y = yv(d.total); const esSel = sel === i;
                            return <rect key={d.fecha} x={cx(i) - barW / 2} y={y} width={barW} height={Math.max(h - padBottom - y, d.total > 0 ? 1 : 0)} rx="1.5" fill={esSel || d.fecha === ahora ? C.mustard : C.green} opacity={sel !== null && !esSel ? 0.4 : 1} />;
                          })}
                          {acumulado && n > 0 && <path d={`${pathDe(cumCur)} L ${cx(n - 1).toFixed(1)} ${h - padBottom} L ${cx(0).toFixed(1)} ${h - padBottom} Z`} fill={C.green + "33"} />}
                          {acumulado && <path d={pathDe(cumCur)} fill="none" stroke={C.green} strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                          {hayPrev && <path d={pathDe(acumulado ? cumPrev : prevVals)} fill="none" stroke={C.muted} strokeWidth="1.6" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
                          {acumulado && sel !== null && <line x1={cx(sel)} x2={cx(sel)} y1={0} y2={h} stroke={C.mustard} strokeWidth="1" vectorEffect="non-scaling-stroke" />}
                          {ventasDia.map((d, i) => <rect key={"hit" + d.fecha} x={padX + i * colW} y={0} width={colW} height={h} fill="transparent" onClick={() => setPuntoSeleccionado(sel === i ? null : i)} style={{ cursor: "pointer" }} />)}
                        </svg>
                        <div style={{ display: "flex", padding: `0 ${(padX / w) * 100}%`, marginTop: 4 }}>
                          {ventasDia.map((d, i) => (
                            <div key={d.fecha} style={{ flex: 1, textAlign: "center", fontSize: 9, color: sel === i || d.fecha === ahora ? C.mustard : C.muted, fontWeight: sel === i ? 700 : 400, visibility: (i % mostrarCadaN === 0 || i === n - 1 || sel === i) ? "visible" : "hidden" }}>{d.dia}</div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.muted, margin: "8px 0", flexWrap: "wrap" }}>
                          <span><span style={{ color: C.green, fontWeight: 700 }}>■</span> Este período</span>
                          {hayPrev ? <span><span style={{ fontWeight: 700 }}>┄</span> {etiquetaPrev}</span> : <span>Sin datos del {etiquetaPrev} para comparar</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button onClick={() => irA(-1)} style={botonFlecha}>◀</button>
                          <div style={{ flex: 1, textAlign: "center", background: C.bg, borderRadius: 8, padding: "7px 8px", fontSize: 12 }}>
                            {sel !== null
                              ? <><span style={{ color: C.muted }}>Día {dmy(ventasDia[sel].fecha)}: </span><span style={{ color: C.green, fontWeight: 700 }}>{fmt(ventasDia[sel].total)}</span></>
                              : <span style={{ color: C.muted }}>Toca una barra o usa las flechas</span>}
                          </div>
                          <button onClick={() => irA(1)} style={botonFlecha}>▶</button>
                        </div>
                        {comp && cd && (
                          <div style={{ marginTop: 10, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ color: C.muted }}>{comp.titulo}</span>
                            <span>
                              <span style={{ fontWeight: 700 }}>{fmt(comp.a)}</span> <span style={{ color: C.muted }}>vs {fmt(comp.b)}</span>{" "}
                              <span style={{ fontWeight: 800, color: cd.d >= 0 ? C.green : C.red }}>{cd.d >= 0 ? "▲" : "▼"} {fmt(Math.abs(cd.d))}{cd.pct !== null ? ` (${cd.pct > 0 ? "+" : ""}${cd.pct}%)` : ""}</span>
                            </span>
                          </div>
                        )}
                        {sel !== null && <div style={{ color: C.muted, fontSize: 10, marginTop: 8, textAlign: "center" }}>Todo lo de abajo muestra solo este día</div>}
                      </div>
                    );
                  })()}
                  <div style={S.card}>
                    <STitle>Por método de pago · {etiquetaPeriodo}</STitle>
                    {metodosPeriodo.length === 0 && <Empty />}
                    {metodosPeriodo.map((x) => (
                      <div key={x.m} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: metodoPagoColors[x.m], display: "inline-block" }} />{x.m}</span>
                          <span style={{ fontWeight: 700, color: metodoPagoColors[x.m] }}>{fmt(x.t)}</span>
                        </div>
                        <Bar value={x.t} max={Math.max(...metodosPeriodo.map((v) => v.t)) || 1} color={metodoPagoColors[x.m]} />
                      </div>
                    ))}
                  </div>
                  <div style={S.card}>
                    <STitle>Por producto · {etiquetaPeriodo}</STitle>
                    {productosPeriodo.length === 0 && <Empty />}
                    {productosPeriodo.map((x) => (
                      <div key={x.n} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span>{x.n} <span style={{ color: C.muted, fontSize: 11 }}>({x.cantidad})</span>{x.as > 0 && <span style={{ color: C.blue, fontSize: 10, marginLeft: 4 }}>({x.as} AS)</span>}</span>
                          <span style={{ fontWeight: 700, color: C.green }}>{fmt(x.total)}</span>
                        </div>
                        <Bar value={x.total} max={productosPeriodo[0]?.total || 1} color={C.green} />
                      </div>
                    ))}
                    {productosTodos.length > 8 && (
                      <button onClick={() => setDashVerTodosProd(!dashVerTodosProd)} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 8, padding: "6px 0", width: "100%", fontSize: 12, cursor: "pointer" }}>{dashVerTodosProd ? "Ver solo los 8 principales" : `Ver los ${productosTodos.length} productos`}</button>
                    )}
                  </div>
                  {(cortesiasPeriodo.length > 0 || descuentosPeriodo.length > 0) && (
                    <div style={S.card}>
                      <STitle>Cortesías y descuentos</STitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 11 }}>🎁 Cortesías</div><div style={{ fontWeight: 700, fontSize: 18, color: C.orange }}>{cortesiasPeriodo.length}</div></div>
                        <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 11 }}>% Descuentos</div><div style={{ fontWeight: 700, fontSize: 18, color: C.blue }}>{descuentosPeriodo.length}</div></div>
                      </div>
                      {cortesiasPeriodo.length > 0 && (() => {
                        const costoCort = cortesiasPeriodo.reduce((acc, v) => acc + costoVenta(v), 0);
                        const valorCort = cortesiasPeriodo.reduce((acc, v) => acc + valorListaVenta(v), 0);
                        return (
                          <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>Costo en insumos</span><span style={{ fontWeight: 800, color: C.red }}>{fmt(Math.round(costoCort))}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}><span style={{ color: C.muted }}>Valor a precio de lista</span><span style={{ fontWeight: 700, color: C.orange }}>{fmt(Math.round(valorCort))}</span></div>
                            <div style={{ color: C.muted, fontSize: 10, marginTop: 6 }}>Informativo: ese costo ya está incluido en las compras, no se resta otra vez.</div>
                          </div>
                        );
                      })()}
                      {cortesiasPeriodo.map((v) => { const d = JSON.parse(v.nota || "{}"); return (<div key={v.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${C.border}22` }}><span>{v.producto}{v.cantidad > 1 ? ` ×${v.cantidad}` : ""} <span style={{ color: personColor(d.autorizado_por) }}>({d.autorizado_por})</span></span><span style={{ color: C.muted }}>{v.fecha} · <span style={{ color: C.red }}>{fmt(Math.round(costoVenta(v)))}</span></span></div>); })}
                      {descuentosPeriodo.map((v) => { const d = JSON.parse(v.nota || "{}"); return (<div key={v.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${C.border}22` }}><span>{v.producto} <span style={{ color: C.blue }}>{d.porcentaje}% off</span></span><span style={{ color: C.muted }}>{v.fecha}</span></div>); })}
                    </div>
                  )}
                </div>
              );
            })()}

            {ventaView === "historial" && (
              <div>
                <div style={{ ...S.card, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select value={filtroVentas.mes} onChange={(e) => setFiltroVentas({ ...filtroVentas, mes: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 110 }}><option value="">Todos los meses</option>{ventasMeses.map((m) => <option key={m}>{m}</option>)}</select>
                  <select value={filtroVentas.metodo} onChange={(e) => setFiltroVentas({ ...filtroVentas, metodo: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 120 }}><option value="">Todos los métodos</option>{["Efectivo","Tarjeta","Pedidos Ya"].map((m) => <option key={m}>{m}</option>)}</select>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: C.muted, fontSize: 12 }}>
                  <span>{ventasFiltradas.length} registros</span>
                  <span style={{ color: C.green, fontWeight: 700 }}>{fmt(ventasFiltradas.reduce((s, v) => s + v.total, 0))}</span>
                </div>
                {ventasFiltradas.map((v) => (
                  <div key={v.id} style={{ ...S.card, marginBottom: 8, display: "flex", gap: 10 }}>
                    <div style={{ width: 3, borderRadius: 3, background: metodoPagoColors[v.metodo_pago] || C.muted, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{v.producto}</div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span>{v.fecha}{v.hora ? ` · ${v.hora}` : ""}</span>
                        <span>{v.cantidad} und</span>
                        <Tag text={v.metodo_pago} color={(metodoPagoColors[v.metodo_pago] || C.muted) + "33"} textColor={metodoPagoColors[v.metodo_pago] || C.muted} />
                        {v.nota && (() => { try { const d = JSON.parse(v.nota); if (d.tipo === "cortesia") return <Tag text={`🎁 ${d.autorizado_por}`} color={C.green + "33"} textColor={C.green} />; if (d.tipo === "personal") return <Tag text={`${d.porcentaje}% off`} color={C.blue + "33"} textColor={C.blue} />; if (d.combo) return <Tag text={`🎁 ${d.combo}`} color={C.purple + "33"} textColor={C.purple} />; if (d.variante === "as") return <Tag text="AS (churrasco)" color={C.blue + "33"} textColor={C.blue} />; return null; } catch { return null; } })()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: C.green }}>{fmt(v.total)}</div>
                      <button onClick={() => solicitarEliminacion("venta", v)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4 }}>eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {ventaView === "porproducto" && (() => {
              const desde = rangoDesde || "2000-01-01";
              const hasta = rangoHasta || "2999-12-31";
              const ventasEnRango = ventas.filter((v) => v.fecha >= desde && v.fecha <= hasta);
              const agrupado = {};
              ventasEnRango.forEach((v) => {
                if (!agrupado[v.producto]) agrupado[v.producto] = { unidadesSueltas: 0, unidadesCombo: 0, pesosSueltos: 0, pesosCombo: 0 };
                const g = agrupado[v.producto];
                if (esComponente(v)) { g.unidadesCombo += v.cantidad; g.pesosCombo += v.total; }
                else { g.unidadesSueltas += v.cantidad; g.pesosSueltos += v.total; }
              });
              const filas = Object.entries(agrupado).map(([nombre, d]) => ({
                nombre,
                totalUnidades: d.unidadesSueltas + d.unidadesCombo,
                totalPesos: d.pesosSueltos + d.pesosCombo,
                ...d,
              })).sort((a, b) => b.totalUnidades - a.totalUnidades);
              // ---- Vista por categoría ----
              // Los pesos de las filas "en combo" no se suman (ya están en el total del combo), solo sus unidades.
              const catsInfo = [...CATEGORIAS, { id: "sin_categoria", label: "Sin categoría", emoji: "❓" }];
              const porCat = {};
              catsInfo.forEach((c) => { porCat[c.id] = { und: 0, undCombo: 0, pesos: 0, productos: {} }; });
              ventasEnRango.forEach((v) => {
                const cid = recetas.find((r) => r.nombre_producto === v.producto)?.categoria || "sin_categoria";
                const c = porCat[cid] || porCat["sin_categoria"];
                if (!c.productos[v.producto]) c.productos[v.producto] = { sueltas: 0, combo: 0, pesos: 0, as: 0 };
                const pr = c.productos[v.producto];
                if (esComponente(v)) { pr.combo += v.cantidad; c.undCombo += v.cantidad; }
                else { pr.sueltas += v.cantidad; pr.pesos += v.total; c.pesos += v.total; if (parseNota(v).variante === "as") pr.as += v.cantidad; }
                c.und += v.cantidad;
              });
              const catsOrdenadas = catsInfo.filter((c) => porCat[c.id].und > 0).sort((a, b) => porCat[b.id].pesos - porCat[a.id].pesos);
              const totalPesosCats = catsOrdenadas.reduce((acc, c) => acc + porCat[c.id].pesos, 0);
              const maxPesosCat = Math.max(...catsOrdenadas.map((c) => porCat[c.id].pesos), 1);
              return (
                <div>
                  <div style={{ ...S.card, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <Fld label="Desde"><input type="date" value={rangoDesde} onChange={(e) => setRangoDesde(e.target.value)} style={S.inp} /></Fld>
                    <Fld label="Hasta"><input type="date" value={rangoHasta} onChange={(e) => setRangoHasta(e.target.value)} style={S.inp} /></Fld>
                    {(rangoDesde || rangoHasta) && <button onClick={() => { setRangoDesde(""); setRangoHasta(""); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "9px 14px", cursor: "pointer", fontSize: 12 }}>Limpiar</button>}
                  </div>
                  <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
                    {rangoDesde || rangoHasta ? `Del ${rangoDesde || "inicio"} al ${rangoHasta || "hoy"}` : "Todo el historial"} — incluye ventas sueltas y las que vinieron dentro de combos.
                  </div>
                  {(() => {
                    const consumoInsumos = calcularConsumoInsumosPorRango(ventasEnRango, recetas);
                    const unidadInsumo = { "Papas fritas": "kg", "Salchichas 17 cm": "und", "Chicken Fingers": "und", "Tocino": "kg", "Churrascos": "und", "Palta": "kg", "Tomate": "kg" };
                    const fmtCant = (gramos, nombre) => unidadInsumo[nombre] === "kg" ? (gramos / 1000).toFixed(2) + " kg" : Math.round(gramos) + " und";
                    // Detalle: de qué productos sale el consumo del insumo seleccionado
                    let detalleFilas = [];
                    if (insumoDetalle) {
                      const det = {};
                      ventasEnRango.forEach((v) => {
                        const rec = recetas.find((r) => r.nombre_producto === v.producto);
                        if (!rec || !rec.ingredientes) return;
                        const nota = parseNota(v);
                        ingredientesEfectivos(rec, nota).forEach((ing) => {
                          if (ing.insumo !== insumoDetalle) return;
                          const nombre = v.producto + (nota.variante === "as" ? " (AS)" : "");
                          if (!det[nombre]) det[nombre] = { sueltas: 0, combo: 0, porUnidad: ing.gramos || 0, total: 0 };
                          if (esComponente(v)) det[nombre].combo += v.cantidad; else det[nombre].sueltas += v.cantidad;
                          det[nombre].total += (ing.gramos || 0) * v.cantidad;
                        });
                      });
                      detalleFilas = Object.entries(det).map(([nombre, d]) => ({ nombre, ...d })).sort((a, b) => b.total - a.total);
                    }
                    const totalDetalle = detalleFilas.reduce((acc, f) => acc + f.total, 0);
                    return (
                      <div style={{ ...S.card, marginBottom: 12 }}>
                        <STitle>Consumo de insumos clave</STitle>
                        <div style={{ color: C.muted, fontSize: 10, marginBottom: 8 }}>Toca un insumo para ver de qué productos sale.</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {INSUMOS_REPORTE_CONSUMO.map((nombre) => {
                            const gramos = consumoInsumos[nombre] || 0;
                            const activo = insumoDetalle === nombre;
                            return (
                              <button key={nombre} onClick={() => setInsumoDetalle(activo ? null : nombre)} style={{ background: C.bg, border: `1px solid ${activo ? C.blue : "transparent"}`, borderRadius: 8, padding: "8px 10px", textAlign: "left", cursor: "pointer" }}>
                                <div style={{ color: activo ? C.blue : C.muted, fontSize: 11 }}>{nombre}</div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: C.mustard }}>{fmtCant(gramos, nombre)}</div>
                              </button>
                            );
                          })}
                        </div>
                        {insumoDetalle && (
                          <div style={{ marginTop: 12, background: C.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${C.blue}55` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: C.blue }}>Detalle: {insumoDetalle}</span>
                              <span style={{ fontWeight: 800, fontSize: 14, color: C.mustard }}>{fmtCant(totalDetalle, insumoDetalle)}</span>
                            </div>
                            {detalleFilas.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>Sin consumo de este insumo en el rango.</div>}
                            {detalleFilas.map((f) => {
                              const esKg = unidadInsumo[insumoDetalle] === "kg";
                              const pct = totalDetalle > 0 ? Math.round((f.total / totalDetalle) * 100) : 0;
                              return (
                                <div key={f.nombre} style={{ padding: "6px 0", borderTop: `1px solid ${C.border}` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{f.nombre}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.mustard, whiteSpace: "nowrap" }}>{fmtCant(f.total, insumoDetalle)} <span style={{ color: C.muted, fontWeight: 400, fontSize: 10 }}>({pct}%)</span></span>
                                  </div>
                                  <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                                    {f.sueltas + f.combo} und{f.combo > 0 ? ` (${f.sueltas} sueltas + ${f.combo} en combo)` : ""} × {f.porUnidad}{esKg ? " g" : " und"} c/u
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[{ id: "producto", label: "🔍 Por producto" }, { id: "categoria", label: "🗂️ Por categoría" }].map((t) => (
                      <button key={t.id} onClick={() => setPorProdModo(t.id)} style={{ flex: 1, background: porProdModo === t.id ? C.mustard : C.tag, color: porProdModo === t.id ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontWeight: porProdModo === t.id ? 700 : 400, fontSize: 13 }}>{t.label}</button>
                    ))}
                  </div>
                  {porProdModo === "categoria" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {catsOrdenadas.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 30 }}>Sin ventas en este rango</div>}
                      {catsOrdenadas.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted }}>
                          <span>Total vendido en el rango</span>
                          <span style={{ color: C.green, fontWeight: 800, fontSize: 14 }}>{fmt(totalPesosCats)}</span>
                        </div>
                      )}
                      {catsOrdenadas.map((c) => {
                        const d = porCat[c.id];
                        const abierta = catAbierta === c.id;
                        const pct = totalPesosCats > 0 ? Math.round((d.pesos / totalPesosCats) * 100) : 0;
                        const prods = Object.entries(d.productos).map(([nombre, x]) => ({ nombre, ...x, und: x.sueltas + x.combo })).sort((a, b) => b.und - a.und || b.pesos - a.pesos);
                        return (
                          <div key={c.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                            <button onClick={() => setCatAbierta(abierta ? null : c.id)} style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", padding: "14px 16px", color: C.text }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.emoji} {c.label} <span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}>{abierta ? "▲" : "▼"}</span></div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontWeight: 800, fontSize: 16, color: C.green }}>{fmt(d.pesos)} <span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}>({pct}%)</span></div>
                                  <div style={{ color: C.muted, fontSize: 11 }}>{d.und} und{d.undCombo > 0 ? ` (${d.undCombo} en combos)` : ""}</div>
                                </div>
                              </div>
                              <Bar value={d.pesos} max={maxPesosCat} color={C.mustard} />
                            </button>
                            {abierta && (
                              <div style={{ padding: "0 16px 12px", borderTop: `1px solid ${C.border}` }}>
                                {prods.map((f) => (
                                  <div key={f.nombre} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0", borderBottom: `1px solid ${C.border}33` }}>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600 }}>{f.nombre}{f.as > 0 && <span style={{ color: C.blue, fontSize: 10, marginLeft: 6 }}>({f.as} AS)</span>}</div>
                                      {f.combo > 0 && <div style={{ fontSize: 10, color: C.muted }}>{f.sueltas} sueltas + <span style={{ color: C.purple }}>{f.combo} en combo</span></div>}
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: C.mustard }}>{f.und} und</div>
                                      <div style={{ fontSize: 11, color: C.muted }}>{fmt(f.pesos)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {catsOrdenadas.length > 0 && <div style={{ color: C.muted, fontSize: 10 }}>Los pesos suman las ventas del rango. Los productos que salieron dentro de un combo cuentan como unidades de su categoría, pero su valor está en la categoría Combos.</div>}
                    </div>
                  ) : (<>
                  {filas.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 30 }}>Sin ventas en este rango</div>}
                  {filas.map((f) => (
                    <div key={f.nombre} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{f.nombre}</div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, fontSize: 18, color: C.green }}>{f.totalUnidades} und</div>
                          <div style={{ color: C.muted, fontSize: 11 }}>{fmt(f.totalPesos)}</div>
                        </div>
                      </div>
                      {f.unidadesCombo > 0 && (
                        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                          <span style={{ color: C.muted }}>Sueltas: <span style={{ color: C.text, fontWeight: 700 }}>{f.unidadesSueltas}</span></span>
                          <span style={{ color: C.muted }}>En combo: <span style={{ color: C.purple, fontWeight: 700 }}>{f.unidadesCombo}</span></span>
                        </div>
                      )}
                    </div>
                  ))}
                  </>)}
                </div>
              );
            })()}
            {ventaView === "caja" && persona === "Alejandro" && (
              <div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Historial de aperturas y cierres de caja — solo visible para ti.</div>
                {historialTurnos.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 30 }}>Sin registros aún</div>}
                {historialTurnos.map((t) => {
                  const esApertura = t.tipo === "apertura";
                  const fecha = new Date(t.created_at);
                  const fechaStr = fecha.toLocaleDateString("es-CL");
                  const horaStr = fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
                  const diferenciaGrande = Math.abs(t.diferencia || 0) >= 5000;
                  return (
                    <div key={t.id} style={{ ...S.card, marginBottom: 8, borderLeft: `4px solid ${esApertura ? C.green : C.red}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontWeight: 700 }}>{esApertura ? "🟢 Apertura" : "🔴 Cierre"} — {t.persona}</div>
                        <div style={{ color: C.muted, fontSize: 11 }}>{fechaStr} · {horaStr}</div>
                      </div>
                      {esApertura ? (
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: C.muted }}>Saldo inicial: </span>
                          <span style={{ fontWeight: 700, color: C.mustard }}>{fmt(t.saldo_inicial)}</span>
                          {t.diferencia !== 0 && t.diferencia !== null && (
                            <span style={{ marginLeft: 10, color: t.diferencia < 0 ? C.red : C.green, fontWeight: 700 }}>
                              (dif. cierre anterior: {fmt(t.diferencia)})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12, marginBottom: 6 }}>
                            <div><span style={{ color: C.muted }}>Efectivo: </span><span style={{ color: C.green, fontWeight: 700 }}>{fmt(t.ventas_efectivo)}</span></div>
                            <div><span style={{ color: C.muted }}>Tarjeta: </span><span style={{ color: C.blue, fontWeight: 700 }}>{fmt(t.ventas_tarjeta)}</span></div>
                            <div><span style={{ color: C.muted }}>PY: </span><span style={{ color: C.orange, fontWeight: 700 }}>{fmt(t.ventas_py)}</span></div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: diferenciaGrande ? (C.red + "22") : C.bg, borderRadius: 8, padding: "8px 10px" }}>
                            <span style={{ fontSize: 12, color: C.muted }}>Saldo final contado: <span style={{ color: C.text, fontWeight: 700 }}>{fmt(t.saldo_final)}</span></span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: t.diferencia === 0 ? C.muted : t.diferencia < 0 ? C.red : C.green }}>
                              {t.diferencia === 0 ? "Sin diferencia" : `${t.diferencia > 0 ? "+" : ""}${fmt(t.diferencia)}`}
                            </span>
                          </div>
                          {diferenciaGrande && <div style={{ color: C.red, fontSize: 11, marginTop: 6, fontWeight: 700 }}>⚠️ Diferencia significativa — revisar</div>}
                          {t.cortesias > 0 && <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>🎁 {t.cortesias} cortesía(s) en el turno</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === "recetas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[{ id: "margenes", label: "📊 Márgenes" }, { id: "productos", label: "🏷️ Productos" }, { id: "insumos", label: "🛒 Insumos" }, { id: "nueva", label: "+ Nueva" }].map((t) => (
                <button key={t.id} onClick={() => { if (t.id === "nueva" && !editRecetaId) { setFormReceta({ nombre_producto: "", categoria: recetaCatActiva, precio_venta: "", precio_py: "", descripcion_menu: "", ingredientes: INGREDIENTES_BASE[recetaCatActiva] || [], productos_combo: [] }); } setRecetaView(t.id); }} style={{ background: recetaView === t.id ? C.mustard : C.tag, color: recetaView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: recetaView === t.id ? 700 : 400, fontSize: 12 }}>{t.label}</button>
              ))}
            </div>
            {loadingRecetas && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>Cargando...</div>}

            {!loadingRecetas && recetaView === "margenes" && (
              <div>
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                  {CATEGORIAS.map((cat) => (
                    <button key={cat.id} onClick={() => setRecetaCatActiva(cat.id)} style={{ background: recetaCatActiva === cat.id ? C.mustard : C.tag, color: recetaCatActiva === cat.id ? C.bg : C.muted, border: "none", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recetas.filter((r) => r.categoria === recetaCatActiva).sort(cmpOrden).map((rec) => {
                    const esCombo = rec.categoria === "combos";
                    const costo = esCombo
                      ? (rec.productos_combo || []).reduce((s, p) => s + costoProducto(p), 0)
                      : calcularCosto(rec.ingredientes, insumosPrecio);
                    const ventaEdit = precioVentaEdit[rec.id];
                    const venta = Number(ventaEdit !== undefined ? ventaEdit : rec.precio_venta);
                    const margen = venta - costo;
                    const margenPct = venta > 0 ? (margen / venta) * 100 : 0;
                    const pyDefault = Math.round(venta * (1 + porcentajePY / 100));
                    const pyGuardado = rec.precio_py || pyDefault;
                    const pyPct = venta > 0 ? Math.round(((pyGuardado - venta) / venta) * 100) : porcentajePY;
                    const costoAS = rec.variante_as ? calcularCosto(ingredientesEfectivos(rec, { variante: "as" }), insumosPrecio) : null;
                    const ventaAS = rec.variante_as?.precio_venta ?? venta;
                    const margenAS = costoAS !== null ? ventaAS - costoAS : null;
                    const margenPctAS = costoAS !== null && ventaAS > 0 ? (margenAS / ventaAS) * 100 : null;
                    return (
                      <div key={rec.id} style={S.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="number" placeholder="#"
                              defaultValue={rec.orden ?? ""}
                              key={rec.id + "_orden_" + rec.orden}
                              onBlur={async (e) => { const val = e.target.value; if (val !== String(rec.orden ?? "")) await guardarOrden(rec.id, val); }}
                              title="Orden en el menú (más chico sale primero)"
                              style={{ width: 36, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, color: C.blue, fontWeight: 700, fontSize: 12, padding: "3px 4px", textAlign: "center", outline: "none" }} />
                            <div style={{ fontWeight: 700 }}>{rec.nombre_producto}</div>
                            {(rec.ingredientes || []).some((i) => i.insumo === "Salchichas 17 cm") && (
                              <button onClick={() => toggleVarianteAS(rec, "Salchichas 17 cm", "Churrascos")}
                                title="Permite vender este completo con churrasco en vez de salchicha (variante AS)"
                                style={{ background: rec.variante_as?.activo ? C.blue : C.tag, color: rec.variante_as?.activo ? "#fff" : C.muted, border: "none", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                {rec.variante_as?.activo ? "✓ AS activo" : "+ Variante AS"}
                              </button>
                            )}
                            {rec.variante_as?.activo && (
                              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <input type="number" defaultValue={rec.variante_as.cantidad}
                                  key={rec.id + "_cantAS_" + rec.variante_as.cantidad}
                                  onBlur={(e) => { if (Number(e.target.value) !== rec.variante_as.cantidad) actualizarCantidadVarianteAS(rec, e.target.value); }}
                                  title="Cantidad de churrasco por completo AS"
                                  style={{ width: 30, background: C.bg, border: `1px solid ${C.blue}`, borderRadius: 5, color: C.blue, fontWeight: 700, fontSize: 11, padding: "2px 3px", textAlign: "center", outline: "none" }} />
                                <span style={{ fontSize: 9, color: C.muted }}>u. churrasco</span>
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.muted }}>Costo</div><div style={{ fontWeight: 700, color: C.red, fontSize: 15 }}>{fmt(Math.round(costo))}</div></div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                          {esCombo
                            ? (rec.productos_combo || []).map((p, i) => <span key={i} style={{ background: C.purple + "22", borderRadius: 4, padding: "2px 7px", fontSize: 10, color: C.purple }}>{p} <span style={{ color: C.muted }}>{fmt(Math.round(costoProducto(p)))}</span></span>)
                            : rec.ingredientes.map((ing, i) => { const ins = insumosPrecio.find((x) => x.nombre === ing.insumo); return <span key={i} style={{ background: C.tag, borderRadius: 4, padding: "2px 7px", fontSize: 10, color: C.muted }}>{ing.insumo} <span style={{ color: C.text }}>{ins?.unidad === "unidad" ? `${ing.gramos}u` : `${ing.gramos}g`}</span></span>; })
                          }
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 10, color: ventaEdit !== undefined ? C.orange : C.muted, marginBottom: 3 }}>Precio ($)</div>
                            <input type="number"
                              value={ventaEdit !== undefined ? ventaEdit : rec.precio_venta}
                              onChange={(e) => setPrecioVentaEdit({ ...precioVentaEdit, [rec.id]: e.target.value })}
                              style={{ ...S.inp, fontWeight: 700, fontSize: 13, borderColor: ventaEdit !== undefined ? C.orange : C.border }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: C.orange, marginBottom: 3 }}>PY (+{pyPct}%)</div>
                            <input type="number"
                              defaultValue={pyGuardado}
                              key={rec.id + "_py_" + rec.precio_py}
                              onBlur={async (e) => { const val = Number(e.target.value); if (val !== pyGuardado) await guardarPrecioPY(rec.id, val); }}
                              style={{ ...S.inp, fontSize: 13 }} />
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Ganancia</div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: margen >= 0 ? C.green : C.red }}>{fmt(Math.round(margen))}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Margen</div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: margenColor(margenPct) }}>{Math.round(margenPct)}%</div>
                          </div>
                        </div>
                        {ventaEdit !== undefined && (
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button onClick={() => setPrecioVentaEdit((p) => { const n = { ...p }; delete n[rec.id]; return n; })} style={{ flex: 1, background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "7px 0", cursor: "pointer", fontSize: 12 }}>Descartar</button>
                            <button onClick={() => solicitarCambioPrecio(rec, Number(ventaEdit))} style={{ flex: 2, background: C.orange, border: "none", color: "#fff", borderRadius: 7, padding: "7px 0", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>🔐 Guardar precio</button>
                          </div>
                        )}
                        <div style={{ marginTop: 8, background: C.border, borderRadius: 4, height: 6 }}>
                          <div style={{ background: margenColor(margenPct), width: `${Math.min(100, Math.max(0, margenPct))}%`, height: "100%", borderRadius: 4 }} />
                        </div>
                        {rec.variante_as?.activo && (
                          <div style={{ marginTop: 8, background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontSize: 10, color: C.blue, fontWeight: 700 }}>🔁 Versión AS ({rec.variante_as.cantidad}u churrasco)</span>
                              <span style={{ fontSize: 11 }}>
                                <span style={{ color: C.muted }}>Costo </span><span style={{ color: C.red, fontWeight: 700 }}>{fmt(Math.round(costoAS))}</span>
                                <span style={{ color: C.muted }}> · Margen </span><span style={{ color: margenColor(margenPctAS), fontWeight: 700 }}>{Math.round(margenPctAS)}%</span>
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 10, color: precioASEdit[rec.id] !== undefined ? C.orange : C.muted }}>Precio venta AS ($)</span>
                                <input type="number"
                                  value={precioASEdit[rec.id] !== undefined ? precioASEdit[rec.id] : rec.variante_as.precio_venta}
                                  onChange={(e) => setPrecioASEdit({ ...precioASEdit, [rec.id]: e.target.value })}
                                  style={{ width: 80, background: C.surface, border: `1px solid ${precioASEdit[rec.id] !== undefined ? C.orange : C.blue}`, borderRadius: 5, color: precioASEdit[rec.id] !== undefined ? C.orange : C.blue, fontWeight: 700, fontSize: 12, padding: "3px 6px", textAlign: "center", outline: "none" }} />
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 10, color: C.orange }}>PY AS ($)</span>
                                <input type="number" defaultValue={rec.variante_as.precio_py || Math.round(ventaAS * (1 + porcentajePY / 100))}
                                  key={rec.id + "_pyAS_" + rec.variante_as.precio_py + "_" + rec.variante_as.precio_venta}
                                  onBlur={(e) => { const val = Number(e.target.value); const actual = rec.variante_as.precio_py || Math.round(ventaAS * (1 + porcentajePY / 100)); if (val !== actual) actualizarPrecioPYVarianteAS(rec, e.target.value); }}
                                  style={{ width: 80, background: C.surface, border: `1px solid ${C.orange}`, borderRadius: 5, color: C.orange, fontWeight: 700, fontSize: 12, padding: "3px 6px", textAlign: "center", outline: "none" }} />
                              </span>
                            </div>
                            {precioASEdit[rec.id] !== undefined && (
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <button onClick={() => setPrecioASEdit((p) => { const n = { ...p }; delete n[rec.id]; return n; })} style={{ flex: 1, background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "6px 0", cursor: "pointer", fontSize: 11 }}>Descartar</button>
                                <button onClick={() => solicitarCambioPrecioAS(rec, Number(precioASEdit[rec.id]))} style={{ flex: 2, background: C.orange, border: "none", color: "#fff", borderRadius: 7, padding: "6px 0", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>🔐 Guardar precio AS</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loadingRecetas && recetaView === "productos" && (
              <div>
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                  {CATEGORIAS.map((cat) => (
                    <button key={cat.id} onClick={() => setRecetaCatActiva(cat.id)} style={{ background: recetaCatActiva === cat.id ? C.mustard : C.tag, color: recetaCatActiva === cat.id ? C.bg : C.muted, border: "none", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {recetas.filter((r) => r.categoria === recetaCatActiva).sort(cmpOrden).map((rec) => {
                    const costo = calcularCosto(rec.ingredientes, insumosPrecio);
                    return (
                      <div key={rec.id} style={S.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ fontWeight: 700 }}>{rec.nombre_producto}</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setFormReceta({ nombre_producto: rec.nombre_producto, categoria: rec.categoria, precio_venta: rec.precio_venta, precio_py: rec.precio_py || "", descripcion_menu: rec.descripcion_menu || "", ingredientes: rec.ingredientes || [], productos_combo: rec.productos_combo || [] }); setEditRecetaId(rec.id); setRecetaView("nueva"); }} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                            <button onClick={() => solicitarEliminacion("receta", rec)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                          </div>
                        </div>
                        {rec.categoria === "combos" ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                            {(rec.productos_combo || []).map((p, i) => <span key={i} style={{ background: C.purple + "33", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: C.purple }}>{p}</span>)}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                            {(rec.ingredientes || []).map((ing, i) => {
                              const ins = insumosPrecio.find((x) => x.nombre === ing.insumo);
                              const key = rec.id + "_" + i;
                              return (
                                <div key={i} style={{ background: C.tag, borderRadius: 6, padding: "4px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
                                  <span style={{ color: C.muted }}>{ing.insumo}</span>
                                  <input type="number" value={editGramos[key] !== undefined ? editGramos[key] : ing.gramos}
                                    onChange={(e) => setEditGramos({ ...editGramos, [key]: e.target.value })}
                                    onBlur={(e) => { if (e.target.value !== String(ing.gramos)) actualizarGramosIngrediente(rec, i, e.target.value); setEditGramos({ ...editGramos, [key]: undefined }); }}
                                    style={{ background: C.bg, border: "none", borderBottom: `1px solid ${C.border}`, color: C.mustard, fontWeight: 700, fontSize: 11, width: 40, outline: "none", textAlign: "center" }} />
                                  <span style={{ color: C.muted, fontSize: 10 }}>{ins?.unidad === "unidad" ? "und" : "g"}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                          {rec.categoria !== "combos" && <span style={{ color: C.muted }}>Costo: <span style={{ color: C.red, fontWeight: 700 }}>{fmt(Math.round(costo))}</span></span>}
                          <span style={{ color: C.muted }}>Precio: <span style={{ color: C.mustard, fontWeight: 700 }}>{fmt(rec.precio_venta)}</span></span>
                          <span style={{ color: C.muted }}>PY: <span style={{ color: C.orange, fontWeight: 700 }}>{fmt(rec.precio_py || Math.round(rec.precio_venta * (1 + porcentajePY / 100)))}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loadingRecetas && recetaView === "insumos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={S.card}>
                  <STitle>{editInsumoId ? "Editar insumo" : "Agregar insumo"}</STitle>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <Fld label="Nombre"><input value={formInsumo.nombre} onChange={(e) => setFormInsumo({ ...formInsumo, nombre: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Precio / kg ($)"><input type="number" value={formInsumo.precio_por_kg} onChange={(e) => setFormInsumo({ ...formInsumo, precio_por_kg: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Unidad"><select value={formInsumo.unidad} onChange={(e) => setFormInsumo({ ...formInsumo, unidad: e.target.value })} style={S.inp}>{["kg","litro","unidad"].map((u) => <option key={u}>{u}</option>)}</select></Fld>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
                    <Fld label={`🟡 Alerta bajo (${formInsumo.unidad === "unidad" ? "unidades" : formInsumo.unidad})`}><input type="text" inputMode="decimal" placeholder="opcional" value={formInsumo.alerta_bajo} onChange={(e) => setFormInsumo({ ...formInsumo, alerta_bajo: e.target.value.replace(/[^0-9.,]/g, "") })} style={S.inp} /></Fld>
                    <Fld label={`🔴 Alerta crítico (${formInsumo.unidad === "unidad" ? "unidades" : formInsumo.unidad})`}><input type="text" inputMode="decimal" placeholder="opcional" value={formInsumo.alerta_critico} onChange={(e) => setFormInsumo({ ...formInsumo, alerta_critico: e.target.value.replace(/[^0-9.,]/g, "") })} style={S.inp} /></Fld>
                  </div>
                  <div style={{ color: C.muted, fontSize: 10, marginBottom: 10 }}>Si los dejas vacíos, el stock usa los límites por defecto (bajo: 1 kg o 10 und · crítico: 500 g o 5 und).</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={guardarInsumo} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>{editInsumoId ? "Actualizar" : "Agregar"}</button>
                    {editInsumoId && <button onClick={() => { setEditInsumoId(null); setFormInsumo({ nombre: "", precio_por_kg: "", unidad: "kg", alerta_bajo: "", alerta_critico: "" }); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "9px 16px", cursor: "pointer" }}>Cancelar</button>}
                  </div>
                </div>
                {insumosPrecio.map((ins) => {
                  const esMayonesaCasera = ins.nombre === "Mayonesa Casera";
                  const costoCalculado = esMayonesaCasera ? costoPorKgMayonesaCasera(insumosPrecio) : null;
                  return (
                    <div key={ins.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{ins.nombre}</div>
                        {esMayonesaCasera ? (
                          <div style={{ color: C.green, fontSize: 12 }}>
                            {fmt(Math.round(costoCalculado))} / kg <span style={{ color: C.muted }}>(calculado automáticamente)</span>
                          </div>
                        ) : (
                          <div style={{ color: C.muted, fontSize: 12 }}>{fmt(ins.precio_por_kg)} / {ins.unidad}</div>
                        )}
                        {(ins.alerta_bajo != null || ins.alerta_critico != null) && (
                          <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                            Alertas: {ins.alerta_bajo != null && <span>🟡 {ins.alerta_bajo}</span>}{ins.alerta_bajo != null && ins.alerta_critico != null && " · "}{ins.alerta_critico != null && <span>🔴 {ins.alerta_critico}</span>} {ins.unidad === "unidad" ? "und" : ins.unidad}
                          </div>
                        )}
                      </div>
                      {!esMayonesaCasera && (
                        <button onClick={() => { setFormInsumo({ nombre: ins.nombre, precio_por_kg: ins.precio_por_kg, unidad: ins.unidad, alerta_bajo: ins.alerta_bajo ?? "", alerta_critico: ins.alerta_critico ?? "" }); setEditInsumoId(ins.id); }} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                      )}
                      <button onClick={() => solicitarEliminacion("insumo", ins)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {!loadingRecetas && recetaView === "nueva" && (
              <div style={S.card}>
                <STitle>{editRecetaId ? "Editar receta" : "Nueva receta"}</STitle>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 10 }}>
                  <Fld label="Nombre"><input value={formReceta.nombre_producto} onChange={(e) => setFormReceta({ ...formReceta, nombre_producto: e.target.value })} style={S.inp} /></Fld>
                  <Fld label="Categoría">
                    <select value={formReceta.categoria} onChange={(e) => { const cat = e.target.value; setFormReceta({ ...formReceta, categoria: cat, ingredientes: editRecetaId ? formReceta.ingredientes : (INGREDIENTES_BASE[cat] || []), productos_combo: editRecetaId ? formReceta.productos_combo : [] }); }} style={S.inp}>
                      {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </Fld>
                  <Fld label="Precio normal ($)"><input type="number" value={formReceta.precio_venta} onChange={(e) => setFormReceta({ ...formReceta, precio_venta: e.target.value })} style={S.inp} /></Fld>
                  <Fld label="Precio PY ($)"><input type="number" placeholder={formReceta.precio_venta ? Math.round(Number(formReceta.precio_venta) * (1 + porcentajePY / 100)) : ""} value={formReceta.precio_py} onChange={(e) => setFormReceta({ ...formReceta, precio_py: e.target.value })} style={S.inp} /></Fld>
                </div>
                <Fld label="Descripción menú (visible en QR)" full>
                  <textarea placeholder="ej: Vienesa con palta, tomate y mayonesa casera" value={formReceta.descripcion_menu || ""} onChange={(e) => setFormReceta({ ...formReceta, descripcion_menu: e.target.value })} style={{ ...S.inp, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} />
                </Fld>
                <div style={{ marginTop: 10 }}>
                  {formReceta.categoria === "combos" ? (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Productos del combo:</div>
                      {formReceta.productos_combo.map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: 6, padding: "5px 10px", marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: C.purple }}>{p}</span>
                          <button onClick={() => setFormReceta({ ...formReceta, productos_combo: formReceta.productos_combo.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8 }}>
                        <select value={nuevoProductoCombo} onChange={(e) => setNuevoProductoCombo(e.target.value)} style={S.inp}>
                          <option value="">Selecciona producto…</option>
                          {recetas.filter((r) => r.categoria !== "combos").map((r) => <option key={r.id} value={r.nombre_producto}>{r.nombre_producto}</option>)}
                        </select>
                        <button onClick={() => { if (!nuevoProductoCombo) return; setFormReceta({ ...formReceta, productos_combo: [...formReceta.productos_combo, nuevoProductoCombo] }); setNuevoProductoCombo(""); }} style={{ background: C.tag, border: `1px solid ${C.border}`, color: C.mustard, borderRadius: 7, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 12 }}>
                      {formReceta.ingredientes.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          {formReceta.ingredientes.map((ing, i) => {
                            const ins = insumosPrecio.find((x) => x.nombre === ing.insumo);
                            return (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: 6, padding: "5px 10px", marginBottom: 5 }}>
                                <span style={{ fontSize: 13, flex: 1 }}>{ing.insumo}</span>
                                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                  <input type="number" value={ing.gramos} onChange={(e) => setFormReceta({ ...formReceta, ingredientes: formReceta.ingredientes.map((x, j) => j === i ? { ...x, gramos: Number(e.target.value) } : x) })} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, color: C.mustard, fontWeight: 700, fontSize: 13, width: 55, padding: "3px 6px", outline: "none", textAlign: "center" }} />
                                  <span style={{ color: C.muted, fontSize: 11 }}>{ins?.unidad === "unidad" ? "und" : "g"}</span>
                                  <button onClick={() => setFormReceta({ ...formReceta, ingredientes: formReceta.ingredientes.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {(() => {
                        const ins = insumosPrecio.find((i) => i.nombre === nuevoIngrediente.insumo);
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8 }}>
                            <select value={nuevoIngrediente.insumo} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, insumo: e.target.value, gramos: "" })} style={S.inp}><option value="">Selecciona insumo…</option>{insumosPrecio.map((i) => <option key={i.id} value={i.nombre}>{i.nombre}</option>)}</select>
                            <input type="number" placeholder={ins?.unidad === "unidad" ? "unidades" : "gramos"} value={nuevoIngrediente.gramos} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, gramos: e.target.value })} style={S.inp} />
                            <button onClick={() => { if (!nuevoIngrediente.insumo || !nuevoIngrediente.gramos) return; setFormReceta({ ...formReceta, ingredientes: [...formReceta.ingredientes, { insumo: nuevoIngrediente.insumo, gramos: Number(nuevoIngrediente.gramos) }] }); setNuevoIngrediente({ insumo: "", gramos: "" }); }} style={{ background: C.tag, border: `1px solid ${C.border}`, color: C.mustard, borderRadius: 7, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={guardarReceta} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "10px 0", fontWeight: 700, cursor: "pointer" }}>{editRecetaId ? "Actualizar" : "Guardar"}</button>
                  {editRecetaId && <button onClick={() => { setEditRecetaId(null); setFormReceta({ nombre_producto: "", categoria: "completos", precio_venta: "", precio_py: "", descripcion_menu: "", ingredientes: [], productos_combo: [] }); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "10px 16px", cursor: "pointer" }}>Cancelar</button>}
                </div>
              </div>
            )}
          </div>
        )}

        {view === "resumen" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {persona === "Alejandro" && (
              <button onClick={() => { setView("ventas"); setVentaView("caja"); cargarHistorialTurnos(); }} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", border: `1px solid ${C.mustard}`, background: C.mustard + "15" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔐</span>
                  <div>
                    <div style={{ fontWeight: 700, color: C.mustard }}>Historial de Caja</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>Aperturas y cierres — solo visible para ti</div>
                  </div>
                </div>
                <span style={{ color: C.mustard, fontSize: 18 }}>→</span>
              </button>
            )}
            {persona === "Alejandro" && (
              <button onClick={() => setVerEstadoResultados(!verEstadoResultados)} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", border: `1px solid ${C.blue}`, background: C.blue + "15", width: "100%", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📈</span>
                  <div>
                    <div style={{ fontWeight: 700, color: C.blue }}>Estado de resultados <span style={{ background: C.orange, color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 10, marginLeft: 6 }}>P</span></div>
                    <div style={{ color: C.muted, fontSize: 11 }}>Pendiente — solo visible para ti</div>
                  </div>
                </div>
                <span style={{ color: C.blue, fontSize: 14 }}>{verEstadoResultados ? "▲" : "▼"}</span>
              </button>
            )}
            {persona === "Alejandro" && verEstadoResultados && (() => {
              const mesesER = [...new Set([...meses, ...ventasMeses, mesActual])].sort().reverse();
              const mesSel = estadoMes || mesActual;
              const vMes = ventas.filter((v) => v.fecha.startsWith(mesSel) && !esComponente(v));
              const porMetodoER = (m) => vMes.filter((v) => v.metodo_pago === m).reduce((acc, v) => acc + v.total, 0);
              const totalVentasER = vMes.reduce((acc, v) => acc + v.total, 0);
              const gMes = gastos.filter((g) => (g.mes_corresponde || g.fecha.slice(0, 7)) === mesSel);
              const nombresInsumos = insumosPrecio.map((i) => i.nombre);
              const sumCat = (c) => gMes.filter((g) => categoriaGasto(g.insumo, nombresInsumos, g.tipo_gasto) === c).reduce((acc, g) => acc + g.monto, 0);
              const costoVentasER = sumCat("costo_ventas");
              const operacionalER = sumCat("operacional");
              const fijosER = sumCat("fijo");
              const equipamientoER = sumCat("equipamiento");
              const cuotasActivasER = gastos.map((g) => ({ g, c: cuotaDelMes(g, mesSel) })).filter((x) => x.c);
              const cuotasER = cuotasActivasER.reduce((acc, x) => acc + x.c.cuota, 0);
              const comprasCuotasER = sumCat("cuotas"); // compras repartidas pagadas este mes (salida de caja completa)
              const sinClasER = sumCat("sin_clasificar");
              const inversionER = sumCat("inversion");
              const retirosER = sumCat("retiro");
              const cortesiasER = vMes.filter((v) => parseNota(v).tipo === "cortesia");
              const costoCortER = cortesiasER.reduce((acc, v) => acc + costoVenta(v), 0);
              const valorCortER = cortesiasER.reduce((acc, v) => acc + valorListaVenta(v), 0);
              // Bebidas (compradas en la botillería): su costo se imputa solo, por cada bebida vendida
              // (sueltas, dentro de combos y cortesías). El costo sale de Recetas → Insumos ("Bebida lata 350 ml").
              const insBebida = insumosPrecio.find((i) => normNombre(i.nombre).startsWith("bebida"));
              const filasBebida = ventas.filter((v) => v.fecha.startsWith(mesSel) && recetas.find((r) => r.nombre_producto === v.producto)?.categoria === "bebidas");
              const unidadesBebidaER = filasBebida.reduce((acc, v) => acc + v.cantidad, 0);
              const costoBebidasER = Math.round(filasBebida.reduce((acc, v) => {
                const rec = recetas.find((r) => r.nombre_producto === v.producto);
                const porIngredientes = calcularCosto(rec?.ingredientes, insumosPrecio);
                return acc + v.cantidad * (porIngredientes > 0 ? porIngredientes : (insBebida?.precio_por_kg || 0));
              }, 0));
              const costoVentasTotalER = costoVentasER + costoBebidasER;
              const consumosBotER = gMes.filter((g) => g.fondo === "Botillería").reduce((acc, g) => acc + g.monto, 0);
              const porPagarBotER = costoBebidasER + consumosBotER;
              const mermasMes = calcularMermasBase(historialInventario, gastos, ventas, recetas, insumosPrecio, ingredientesEfectivos, parseNota).filter((m) => (m.fecha || "").startsWith(mesSel));
              const mermaNetaER = mermasMes.reduce((acc, m) => acc + m.costo, 0);
              const margenBrutoER = totalVentasER - costoVentasTotalER;
              const esCompleto = (v) => recetas.find((r) => r.nombre_producto === v.producto && r.categoria === "completos");
              const completosSueltos = vMes.filter(esCompleto).reduce((acc, v) => acc + v.cantidad, 0);
              const completosCombo = ventas.filter((v) => v.fecha.startsWith(mesSel) && esComponente(v) && esCompleto(v)).reduce((acc, v) => acc + v.cantidad, 0);
              const completosMes = completosSueltos + completosCombo;
              const esMesParcialER = mesSel === mesActual;
              const diasMesER = new Date(Number(mesSel.slice(0, 4)), Number(mesSel.slice(5, 7)), 0).getDate();
              const diasTranscER = Math.min(Number(today().slice(8, 10)), diasMesER);
              const fijoGustavoER = esMesParcialER ? Math.round(GUSTAVO_FIJO * diasTranscER / diasMesER) : GUSTAVO_FIJO;
              const gustavoER = fijoGustavoER + GUSTAVO_POR_COMPLETO * completosMes;
              const pagadoGustavoER = sumCat("pago_gustavo");
              const comisionPYER = Math.round(porMetodoER("Pedidos Ya") * COMISION_PEDIDOS_YA);
              const comisionTarjetaER = Math.round(porMetodoER("Tarjeta") * COMISION_TARJETA);
              const resultadoER = margenBrutoER - operacionalER - fijosER - equipamientoER - cuotasER - sinClasER - comisionPYER - comisionTarjetaER - gustavoER;
              const sinClasNombres = [...new Set(gMes.filter((g) => categoriaGasto(g.insumo, nombresInsumos, g.tipo_gasto) === "sin_clasificar").map((g) => g.insumo))];
              const pctER = (n) => totalVentasER > 0 ? ` · ${Math.round((n / totalVentasER) * 100)}%` : "";
              const filaER = (label, valor, extra) => (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: extra?.color || C.text }}>{valor}</span>
                </div>
              );
              const gastosDe = (c) => gMes.filter((g) => categoriaGasto(g.insumo, nombresInsumos, g.tipo_gasto) === c);
              const agruparPorInsumo = (arr) => { const m = {}; arr.forEach((g) => { const k = nombreCanonico(g.insumo); if (!m[k]) m[k] = { nombre: k, monto: 0, compras: 0 }; m[k].monto += g.monto; m[k].compras += 1; }); return Object.values(m).sort((a, b) => b.monto - a.monto); };
              const detalleInsumos = (arr, base, extra) => (
                <div>
                  {agruparPorInsumo(arr).map((x) => (
                    <div key={x.nombre} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12, padding: "3px 0", gap: 8 }}>
                      <span>{x.nombre} <span style={{ color: C.muted, fontSize: 10 }}>{x.compras} {x.compras === 1 ? "compra" : "compras"}</span></span>
                      <span style={{ whiteSpace: "nowrap" }}><span style={{ fontWeight: 700 }}>{fmt(x.monto)}</span>{base > 0 && <span style={{ color: C.muted, fontSize: 10 }}> ({Math.round((x.monto / base) * 100)}%)</span>}</span>
                    </div>
                  ))}
                  {extra}
                  {arr.length === 0 && !extra && <div style={{ color: C.muted, fontSize: 12 }}>Sin compras en este mes.</div>}
                </div>
              );
              const filaERDesglose = (clave, label, valor, extra, detalle) => (
                <div>
                  <div onClick={() => setErAbierto({ ...erAbierto, [clave]: !erAbierto[clave] })} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                    <span style={{ fontSize: 13 }}><span style={{ color: C.muted, fontSize: 10 }}>{erAbierto[clave] ? "▼" : "▶"}</span> {label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: extra?.color || C.text }}>{valor}</span>
                  </div>
                  {erAbierto[clave] && <div style={{ padding: "6px 0 8px 12px", borderBottom: `1px solid ${C.border}` }}>{detalle}</div>}
                </div>
              );
              const filaP = (label, nota) => (
                <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13 }}>{label}</span>
                    <span style={{ background: C.orange, color: "#fff", borderRadius: 4, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>P</span>
                  </div>
                  {nota && <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{nota}</div>}
                </div>
              );
              return (
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <STitle>Estado de resultados</STitle>
                    <select value={mesSel} onChange={(e) => setEstadoMes(e.target.value)} style={{ ...S.inp, width: "auto", marginBottom: 12 }}>
                      {mesesER.map((m) => <option key={m} value={m}>{m === mesActual ? `${m} (parcial)` : m}</option>)}
                    </select>
                  </div>
                  {filaER("Ventas brutas", fmt(totalVentasER), { color: C.green })}
                  <div style={{ padding: "2px 0 6px 12px", fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                    Efectivo {fmt(porMetodoER("Efectivo"))} · Tarjeta {fmt(porMetodoER("Tarjeta"))} · Pedidos Ya {fmt(porMetodoER("Pedidos Ya"))}
                  </div>
                  {filaERDesglose("costo", `(−) Costo de ventas${pctER(costoVentasTotalER)}`, fmt(costoVentasTotalER), { color: C.red },
                    detalleInsumos(gastosDe("costo_ventas"), costoVentasTotalER, costoBebidasER > 0 ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12, padding: "3px 0", gap: 8 }}>
                        <span>🥤 Bebidas (botillería) <span style={{ color: C.muted, fontSize: 10 }}>{unidadesBebidaER} und vendidas</span></span>
                        <span style={{ whiteSpace: "nowrap" }}><span style={{ fontWeight: 700 }}>{fmt(costoBebidasER)}</span>{costoVentasTotalER > 0 && <span style={{ color: C.muted, fontSize: 10 }}> ({Math.round((costoBebidasER / costoVentasTotalER) * 100)}%)</span>}</span>
                      </div>
                    ) : null))}
                  <div style={{ padding: "2px 0 6px 12px", fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                    Insumos comprados {fmt(costoVentasER)} + bebidas {fmt(costoBebidasER)} ({unidadesBebidaER} und)
                    {porPagarBotER > 0 && <div style={{ color: C.orange, marginTop: 2 }}>Por pagar a botillería: <span style={{ fontWeight: 700 }}>{fmt(porPagarBotER)}</span> <span style={{ color: C.muted }}>(bebidas {fmt(costoBebidasER)} + consumos {fmt(consumosBotER)})</span></div>}
                  </div>
                  {mermasMes.length > 0 && (
                    <div style={{ paddingLeft: 12 }}>
                      {filaERDesglose("merma", `${mermaNetaER >= 0 ? "Merma detectada" : "Sobrante neto"} en ajustes (ya incluida en el costo)`, fmt(Math.abs(mermaNetaER)), { color: mermaNetaER >= 0 ? C.orange : C.green },
                        <div>
                          {[...mermasMes].sort((a, b) => Math.abs(b.costo) - Math.abs(a.costo)).map((m) => {
                            const kgL = m.unidad === "kg" || m.unidad === "litro";
                            const cantTxt = kgL ? `${(Math.abs(m.dif) / 1000).toFixed(2)} ${m.unidad}` : `${Math.round(Math.abs(m.dif))} und`;
                            const falta = m.dif >= 0;
                            return (
                              <div key={m.id} style={{ padding: "4px 0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 8 }}>
                                  <span>{m.insumo} <span style={{ color: falta ? C.orange : C.green, fontSize: 10 }}>{falta ? "faltan" : "sobran"} {cantTxt}</span></span>
                                  <span style={{ fontWeight: 700, color: falta ? C.orange : C.green, whiteSpace: "nowrap" }}>{falta ? "" : "−"}{fmt(Math.abs(m.costo))}</span>
                                </div>
                                <div style={{ color: C.muted, fontSize: 10 }}>{(m.fecha || "").split("-").reverse().join("-")} · {m.persona}{m.motivo ? ` · ${m.motivo}` : ""}</div>
                              </div>
                            );
                          })}
                          <div style={{ color: C.muted, fontSize: 10, marginTop: 6 }}>Diferencia entre lo que debía haber (ajuste anterior + compras − consumo según recetas) y lo que contaste. Informativo: no cambia el resultado.</div>
                        </div>
                      )}
                    </div>
                  )}
                  {filaER(`= Margen bruto${pctER(margenBrutoER)}`, fmt(margenBrutoER), { color: margenBrutoER >= 0 ? C.green : C.red })}
                  {operacionalER > 0 && filaERDesglose("operacional", `(−) Operacionales (gas, consumibles)${pctER(operacionalER)}`, fmt(operacionalER), { color: C.red }, detalleInsumos(gastosDe("operacional"), operacionalER))}
                  {fijosER > 0 && filaERDesglose("fijos", `(−) Costos fijos${pctER(fijosER)}`, fmt(fijosER), { color: C.red }, detalleInsumos(gastosDe("fijo"), fijosER))}
                  {cuotasER > 0 && filaERDesglose("cuotas", `(−) Equipamiento en cuotas${pctER(cuotasER)}`, fmt(cuotasER), { color: C.red },
                    <div>
                      {cuotasActivasER.sort((a, b) => b.c.cuota - a.c.cuota).map((x) => (
                        <div key={x.g.id} style={{ padding: "3px 0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 8 }}>
                            <span>{nombreCanonico(x.g.insumo)} <span style={{ color: C.muted, fontSize: 10 }}>cuota {x.c.k + 1} de {x.c.n}</span></span>
                            <span style={{ fontWeight: 700 }}>{fmt(x.c.cuota)}</span>
                          </div>
                          <div style={{ color: C.muted, fontSize: 10 }}>Compra de {fmt(x.g.monto)} · {x.g.fecha.split("-").reverse().join("-")}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {equipamientoER > 0 && filaERDesglose("equipamiento", `(−) Equipamiento y reparaciones${pctER(equipamientoER)}`, fmt(equipamientoER), { color: C.red }, detalleInsumos(gastosDe("equipamiento"), equipamientoER))}
                  {filaER(`(−) Comisión tarjeta (${(COMISION_TARJETA * 100).toFixed(2).replace(".", ",")}%)${pctER(comisionTarjetaER)}`, fmt(comisionTarjetaER), { color: C.red })}
                  {filaER(`(−) Comisión Pedidos Ya (${Math.round(COMISION_PEDIDOS_YA * 100)}%)${pctER(comisionPYER)}`, fmt(comisionPYER), { color: C.red })}
                  {filaER(`(−) Gustavo${pctER(gustavoER)}`, fmt(gustavoER), { color: C.red })}
                  <div style={{ padding: "2px 0 6px 12px", fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                    {esMesParcialER ? `${fmt(fijoGustavoER)} fijo proporcional (${diasTranscER} de ${diasMesER} días)` : `${fmt(GUSTAVO_FIJO)} fijo`} + {fmt(GUSTAVO_POR_COMPLETO)} × {completosMes} completos ({completosSueltos} sueltos + {completosCombo} en combo) = {fmt(GUSTAVO_POR_COMPLETO * completosMes)} variable
                    <div style={{ marginTop: 2 }}>
                      Pagado a este mes: <span style={{ color: C.text, fontWeight: 700 }}>{fmt(pagadoGustavoER)}</span> · {gustavoER - pagadoGustavoER >= 0 ? "Saldo por pagar" : "Pagado de más"}: <span style={{ color: gustavoER - pagadoGustavoER > 0 ? C.orange : C.green, fontWeight: 700 }}>{fmt(Math.abs(gustavoER - pagadoGustavoER))}</span>
                    </div>
                  </div>
                  {sinClasER > 0 && (
                    <div>
                      {filaERDesglose("sinclas", `(−) Sin clasificar${pctER(sinClasER)}`, fmt(sinClasER), { color: C.orange }, detalleInsumos(gastosDe("sin_clasificar"), sinClasER))}
                      <div style={{ color: C.orange, fontSize: 10, margin: "2px 0 4px" }}>Revisar: {sinClasNombres.join(", ")}</div>
                    </div>
                  )}
                  {filaER(`= Resultado preliminar${pctER(resultadoER)}`, fmt(resultadoER), { color: resultadoER >= 0 ? C.green : C.red })}
                  {(retirosER > 0 || inversionER > 0 || comprasCuotasER > 0 || cuotasER > 0) && (
                    <>
                      {retirosER > 0 && filaERDesglose("retiros", `(−) Retiros de socios${pctER(retirosER)}`, fmt(retirosER), { color: C.orange },
                        <div>
                          {[...gastosDe("retiro")].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).map((g) => (
                            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", gap: 8 }}>
                              <span>{g.fecha.split("-").reverse().join("-")} <span style={{ color: C.muted, fontSize: 10 }}>{g.nota || "sin destino"}</span></span>
                              <span style={{ fontWeight: 700 }}>{fmt(g.monto)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {inversionER > 0 && filaERDesglose("inversion", `(−) Inversiones${pctER(inversionER)}`, fmt(inversionER), { color: C.orange }, detalleInsumos(gastosDe("inversion"), inversionER))}
                      {comprasCuotasER > 0 && filaER(`(−) Compras en cuotas pagadas este mes${pctER(comprasCuotasER)}`, fmt(comprasCuotasER), { color: C.orange })}
                      {cuotasER > 0 && filaER("(+) Cuotas del mes ya descontadas arriba", fmt(cuotasER), { color: C.green })}
                      {filaER(`= Saldo después de retiros e inversiones${pctER(resultadoER - retirosER - inversionER - comprasCuotasER + cuotasER)}`, fmt(resultadoER - retirosER - inversionER - comprasCuotasER + cuotasER), { color: resultadoER - retirosER - inversionER - comprasCuotasER + cuotasER >= 0 ? C.green : C.red })}
                      <div style={{ color: C.muted, fontSize: 10, margin: "4px 0 2px" }}>El resultado mide lo que ganó el negocio. Los retiros y las inversiones no son costos, pero reducen lo que queda disponible. Las compras en cuotas salen completas de la plata el mes que se pagan, y su cuota ya está restada en el resultado.</div>
                    </>
                  )}
                  <div style={{ color: C.muted, fontSize: 10, margin: "6px 0 4px" }}>Los % de cada línea son sobre las ventas brutas del mes. Incluye comisiones y Gustavo. Los costos fijos (patente, contador, publicidad, etc.) entran a medida que los ingresas en Gastos.</div>
                  {cortesiasER.length > 0 && (
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>
                      🎁 Cortesías del mes: {cortesiasER.reduce((acc, v) => acc + v.cantidad, 0)} und · costo en insumos <span style={{ color: C.red, fontWeight: 700 }}>{fmt(Math.round(costoCortER))}</span> (ya incluido en el costo de ventas) · a precio de lista {fmt(Math.round(valorCortER))}
                    </div>
                  )}
                                                    </div>
              );
            })()}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>Filtrar mes:</div>
                <select value={filtroResumen} onChange={(e) => setFiltroResumen(e.target.value)} style={S.inp}><option value="">Todo el historial</option>{meses.map((m) => <option key={m}>{m}</option>)}</select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatCard label={filtroResumen ? `Ventas ${filtroResumen}` : "Ventas (todo)"} value={fmt(totalVentasResumen)} color={C.green} />
              <StatCard label={filtroResumen ? `Gastos ${filtroResumen}` : "Gastos (todo)"} value={fmt(totalGastosResumen)} color={C.mustard} />
            </div>
            {(() => {
              const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
              const ORDEN = [1, 2, 3, 4, 5, 6, 0];
              const hoyStr = today();
              const dmy2 = (f) => f.split("-").reverse().join("-");
              const dow = (f) => new Date(f + "T00:00:00").getDay();
              const opH = (h) => (h < 6 ? h + 24 : h); // la madrugada cuenta como parte de la noche
              const parseHora = (hs) => {
                const m = /(\d{1,2}):(\d{2})/.exec(hs || "");
                if (!m) return null;
                let hr = Number(m[1]);
                if (/p\.?\s?m/i.test(hs) && hr < 12) hr += 12;
                if (/a\.?\s?m/i.test(hs) && hr === 12) hr = 0;
                return hr >= 0 && hr < 24 ? hr : null;
              };
              const periodo = ventas.filter((v) => !esComponente(v) && (filtroResumen ? v.fecha.startsWith(filtroResumen) : true));
              const etiqueta = filtroResumen ? `Mes ${filtroResumen}` : "Todo el historial";
              const porFecha = {};
              periodo.forEach((v) => { porFecha[v.fecha] = (porFecha[v.fecha] || 0) + v.total; });
              const fechas = Object.keys(porFecha).filter((f) => porFecha[f] > 0);
              // por día de la semana
              const porDow = {};
              fechas.forEach((f) => { const d = dow(f); (porDow[d] = porDow[d] || []).push(porFecha[f]); });
              const statsDow = ORDEN.map((d) => { const arr = porDow[d] || []; return { d, n: arr.length, avg: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0, min: arr.length ? Math.min(...arr) : 0, max: arr.length ? Math.max(...arr) : 0 }; });
              const diasConDatos = statsDow.filter((x) => x.n > 0);
              const maxAvg = Math.max(...diasConDatos.map((x) => x.avg), 1);
              let parecidos = null;
              const ord = diasConDatos.filter((x) => x.n >= 2).sort((a, b) => a.avg - b.avg);
              for (let i = 0; i < ord.length - 1; i++) { const rel = (ord[i + 1].avg - ord[i].avg) / ord[i + 1].avg; if (!parecidos || rel < parecidos.rel) parecidos = { a: ord[i], b: ord[i + 1], rel }; }
              // por hora
              const conHora = periodo.filter((v) => parseHora(v.hora) !== null);
              const porHora = {};
              conHora.forEach((v) => { const h = parseHora(v.hora); porHora[h] = (porHora[h] || 0) + v.total; });
              const totalHoras = Object.values(porHora).reduce((a, b) => a + b, 0);
              const horasOrden = Object.keys(porHora).map(Number).sort((a, b) => opH(a) - opH(b));
              const maxHora = Math.max(...Object.values(porHora), 1);
              let ventana = null;
              if (horasOrden.length > 0) {
                const minOp = opH(horasOrden[0]); const maxOp = opH(horasOrden[horasOrden.length - 1]);
                const val = (o) => porHora[o >= 24 ? o - 24 : o] || 0;
                const largo = Math.min(3, maxOp - minOp + 1);
                for (let o = minOp; o + largo - 1 <= maxOp; o++) { let sum = 0; for (let k = 0; k < largo; k++) sum += val(o + k); if (!ventana || sum > ventana.sum) ventana = { desde: o, largo, sum }; }
              }
              const hh = (o) => String((o >= 24 ? o - 24 : o)).padStart(2, "0");
              // mapa de calor (promedio por día de la semana)
              const nPorDow = {}; statsDow.forEach((x) => { nPorDow[x.d] = x.n; });
              const celda = {};
              conHora.forEach((v) => { const d = dow(v.fecha); const h = parseHora(v.hora); const k = d + "_" + h; celda[k] = (celda[k] || 0) + v.total; });
              const valorCelda = (d, h) => (nPorDow[d] ? (celda[d + "_" + h] || 0) / nPorDow[d] : 0);
              const maxCelda = Math.max(...diasConDatos.flatMap((x) => horasOrden.map((h) => valorCelda(x.d, h))), 1);
              // mejor / peor día y proyección
              const fechasOrd = [...fechas].sort((a, b) => porFecha[b] - porFecha[a]);
              const mejor = fechasOrd[0];
              const peor = [...fechasOrd].reverse().find((f) => f !== hoyStr);
              let proyeccion = null;
              if (filtroResumen === mesActual) {
                const [yy, mm] = mesActual.split("-").map(Number);
                const diasMes = new Date(yy, mm, 0).getDate();
                const acum = fechas.reduce((a, f) => a + porFecha[f], 0);
                let futuro = 0; let diasFut = 0;
                for (let d = 1; d <= diasMes; d++) { const f = `${mesActual}-${String(d).padStart(2, "0")}`; if (f > hoyStr) { const av = statsDow.find((x) => x.d === dow(f))?.avg || 0; futuro += av; if (av > 0) diasFut++; } }
                if (diasFut > 0) proyeccion = { total: acum + futuro, diasFut };
              }
              const tabBtn = (id, label) => (
                <button key={id} onClick={() => setInsightTab(id)} style={{ flex: 1, background: insightTab === id ? C.mustard : C.tag, color: insightTab === id ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "7px 0", cursor: "pointer", fontWeight: insightTab === id ? 700 : 400, fontSize: 12 }}>{label}</button>
              );
              return (
                <div style={S.card}>
                  <STitle>🕒 Cuándo se vende · {etiqueta}</STitle>
                  {fechas.length === 0 ? <Empty /> : (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ color: C.muted, fontSize: 10 }}>Mejor día</div>
                          <div style={{ fontWeight: 800, color: C.green, fontSize: 15 }}>{fmt(porFecha[mejor])}</div>
                          <div style={{ color: C.muted, fontSize: 10 }}>{DIAS[dow(mejor)]} {dmy2(mejor)}</div>
                        </div>
                        {peor && (
                          <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ color: C.muted, fontSize: 10 }}>Día más flojo</div>
                            <div style={{ fontWeight: 800, color: C.orange, fontSize: 15 }}>{fmt(porFecha[peor])}</div>
                            <div style={{ color: C.muted, fontSize: 10 }}>{DIAS[dow(peor)]} {dmy2(peor)}</div>
                          </div>
                        )}
                        {proyeccion && (
                          <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", gridColumn: "1 / -1" }}>
                            <div style={{ color: C.muted, fontSize: 10 }}>Proyección de cierre del mes (estimación)</div>
                            <div style={{ fontWeight: 800, color: C.blue, fontSize: 15 }}>{fmt(Math.round(proyeccion.total))}</div>
                            <div style={{ color: C.muted, fontSize: 10 }}>Suma lo vendido más el promedio de cada día que falta ({proyeccion.diasFut} días de venta restantes)</div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                        {tabBtn("horas", "⏰ Horas")}{tabBtn("dias", "📅 Días")}{tabBtn("mapa", "🔥 Mapa")}
                      </div>

                      {insightTab === "horas" && (
                        <div>
                          {horasOrden.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>Las ventas de este período no tienen hora registrada.</div>}
                          {ventana && totalHoras > 0 && (
                            <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 12 }}>
                              Las {ventana.largo} horas más fuertes ({hh(ventana.desde)}:00 a {hh(ventana.desde + ventana.largo - 1)}:59) concentran <span style={{ color: C.mustard, fontWeight: 800 }}>{Math.round((ventana.sum / totalHoras) * 100)}%</span> de las ventas.
                            </div>
                          )}
                          {horasOrden.map((h) => (
                            <div key={h} style={{ marginBottom: 7 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                                <span>{String(h).padStart(2, "0")}:00</span>
                                <span><span style={{ fontWeight: 700, color: C.mustard }}>{fmt(porHora[h])}</span> <span style={{ color: C.muted, fontSize: 10 }}>({Math.round((porHora[h] / totalHoras) * 100)}%)</span></span>
                              </div>
                              <Bar value={porHora[h]} max={maxHora} color={porHora[h] === maxHora ? C.mustard : C.green} />
                            </div>
                          ))}
                          {conHora.length < periodo.length && <div style={{ color: C.muted, fontSize: 10, marginTop: 6 }}>{periodo.length - conHora.length} de {periodo.length} ventas no tienen hora registrada y no entran en este gráfico.</div>}
                        </div>
                      )}

                      {insightTab === "dias" && (
                        <div>
                          <div style={{ color: C.muted, fontSize: 10, marginBottom: 8 }}>Promedio de venta por día de atención. El rango muestra el día más bajo y el más alto.</div>
                          {diasConDatos.map((x) => (
                            <div key={x.d} style={{ marginBottom: 9 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                                <span style={{ fontWeight: 600 }}>{DIAS[x.d]} <span style={{ color: C.muted, fontWeight: 400, fontSize: 10 }}>({x.n} {x.n === 1 ? "día" : "días"})</span></span>
                                <span style={{ fontWeight: 700, color: C.mustard }}>{fmt(Math.round(x.avg))}</span>
                              </div>
                              <Bar value={x.avg} max={maxAvg} color={C.green} />
                              {x.n > 1 && <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>Rango {fmt(x.min)} – {fmt(x.max)}</div>}
                            </div>
                          ))}
                          {parecidos && (
                            <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", marginTop: 8, fontSize: 12 }}>
                              Los días que más se parecen: <span style={{ fontWeight: 700 }}>{DIAS[parecidos.a.d]}</span> ({fmt(Math.round(parecidos.a.avg))}) y <span style={{ fontWeight: 700 }}>{DIAS[parecidos.b.d]}</span> ({fmt(Math.round(parecidos.b.avg))}).
                            </div>
                          )}
                        </div>
                      )}

                      {insightTab === "mapa" && (
                        <div>
                          {horasOrden.length === 0 ? <div style={{ color: C.muted, fontSize: 12 }}>Las ventas de este período no tienen hora registrada.</div> : (
                            <div>
                              <div style={{ color: C.muted, fontSize: 10, marginBottom: 6 }}>Miles de $ vendidos por hora, en promedio por día de atención. Más oscuro = más venta.</div>
                              <div style={{ display: "grid", gridTemplateColumns: `34px repeat(${horasOrden.length}, 1fr)`, gap: 2 }}>
                                <div />
                                {horasOrden.map((h) => <div key={"h" + h} style={{ textAlign: "center", fontSize: 9, color: C.muted }}>{String(h).padStart(2, "0")}</div>)}
                                {diasConDatos.map((x) => (
                                  <Fragment key={"fila" + x.d}>
                                    <div style={{ fontSize: 10, color: C.muted, alignSelf: "center" }}>{DIAS[x.d]}</div>
                                    {horasOrden.map((h) => {
                                      const v = valorCelda(x.d, h);
                                      const a = v > 0 ? 0.12 + 0.88 * (v / maxCelda) : 0;
                                      return <div key={x.d + "_" + h} style={{ background: v > 0 ? `rgba(232,184,75,${a.toFixed(2)})` : C.bg, color: a > 0.55 ? C.bg : C.text, borderRadius: 3, textAlign: "center", fontSize: 9, fontWeight: 700, padding: "6px 0" }}>{v >= 500 ? Math.round(v / 1000) : ""}</div>;
                                    })}
                                  </Fragment>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}

function Fld({ label, children, full }) {
  return <div style={{ gridColumn: full ? "1 / -1" : undefined }}><div style={{ color: "#8A8496", fontSize: 11, marginBottom: 5 }}>{label}</div>{children}</div>;
}
function Tag({ text, color = "#332F3C", textColor = "#A09AB0" }) {
  return <span style={{ background: color, borderRadius: 4, padding: "1px 7px", fontSize: 11, color: textColor }}>{text}</span>;
}
function Bar({ value, max, color }) {
  return <div style={{ background: "#3A3640", borderRadius: 3, height: 7 }}><div style={{ background: color, width: max ? `${Math.round((value / max) * 100)}%` : "0%", height: "100%", borderRadius: 3, transition: "width .4s ease" }} /></div>;
}
function StatCard({ label, value, color }) {
  return <div style={{ background: "#2A2730", border: "1px solid #3A3640", borderRadius: 10, padding: "14px 16px" }}><div style={{ color: "#8A8496", fontSize: 11 }}>{label}</div><div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4 }}>{value}</div></div>;
}
function STitle({ children }) {
  return <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#F2EEF8" }}>{children}</div>;
}
function Empty() {
  return <div style={{ color: "#8A8496", fontSize: 12 }}>Sin datos aún</div>;
}
