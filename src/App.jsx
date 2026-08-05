import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const C = {
  bg: "#18161A", surface: "#221F26", card: "#2A2730", border: "#3A3640",
  mustard: "#E8B84B", mustardDim: "#B8902A", red: "#E05252",
  green: "#5BAD7F", text: "#F2EEF8", muted: "#8A8496", tag: "#332F3C",
  blue: "#6B9FD4",
};

const PERSONAS = ["Raul", "Pepe", "Alejandro", "Gustavo"];
const FONDOS = ["Efectivo foodtruck", "Efectivo Don Abel", "Tarjeta foodtruck", "Tarjeta Don Abel"];
const INSUMOS_BASE = [
  "Palta","Tomate","Pan para completo","Mayonesa","Salchichas",
  "Papas fritas","Tocino","Chucrut","Mostaza","Ketchup",
  "Salsas / aderezos","Aceite","Envases papas fritas",
  "Envases completos","Servilletas / bolsas","Gas / combustible","Limpieza","Otro",
];

const fondoColors = {
  "Efectivo foodtruck": "#6B9FD4",
  "Efectivo Don Abel": "#5BAD7F",
  "Tarjeta foodtruck": "#C97DDB",
  "Tarjeta Don Abel": "#E8B84B",
};

const metodoPagoColors = {
  "Efectivo": "#5BAD7F",
  "Tarjeta": "#6B9FD4",
  "Pedidos Ya": "#FF6B35",
};

// Productos y precios base
const PRODUCTOS_DEFAULT = [
  // Completos
  { nombre: "Italiano",                          precio: 4100, precio_py: Math.round(4100 * 1.3) },
  { nombre: "Highway to Hell",                   precio: 4600, precio_py: Math.round(4600 * 1.3) },
  { nombre: "Torn and Frayed",                   precio: 4600, precio_py: Math.round(4600 * 1.3) },
  { nombre: "Purple Haze",                       precio: 4600, precio_py: Math.round(4600 * 1.3) },
  { nombre: "Dinámico",                          precio: 4900, precio_py: Math.round(4900 * 1.3) },
  { nombre: "Paradise City",                     precio: 4900, precio_py: Math.round(4900 * 1.3) },
  { nombre: "Sweet Child O' Mine",               precio: 4900, precio_py: Math.round(4900 * 1.3) },
  // Papas
  { nombre: "Papas fritas",                      precio: 2900, precio_py: Math.round(2900 * 1.3) },
  { nombre: "Salchipapas",                       precio: 3600, precio_py: Math.round(3600 * 1.3) },
  { nombre: "Salchipapas con tocino",            precio: 4500, precio_py: Math.round(4500 * 1.3) },
  { nombre: "Papas tocino y cebolla",            precio: 4000, precio_py: Math.round(4000 * 1.3) },
  { nombre: "Papas queso fundido y tocino",      precio: 4000, precio_py: Math.round(4000 * 1.3) },
  { nombre: "Papas con nuggets",                 precio: 4500, precio_py: Math.round(4500 * 1.3) },
  { nombre: "Papas con nuggets (12 und)",        precio: 5300, precio_py: Math.round(5300 * 1.3) },
  // Bebidas y agregados
  { nombre: "Lata 250ml",                        precio: 1000, precio_py: Math.round(1000 * 1.3) },
  { nombre: "Queso fundido",                     precio: 1000, precio_py: Math.round(1000 * 1.3) },
  { nombre: "Agregado extra",                    precio:  600, precio_py: Math.round( 600 * 1.3) },
];

// Insumos de ejemplo para recetas
const INSUMOS_EJEMPLO = [
  { nombre: "Palta", precio_por_kg: 4500, unidad: "kg" },
  { nombre: "Tomate", precio_por_kg: 1200, unidad: "kg" },
  { nombre: "Pan para completo", precio_por_kg: 2800, unidad: "kg" },
  { nombre: "Mayonesa", precio_por_kg: 3200, unidad: "kg" },
  { nombre: "Salchichas", precio_por_kg: 5500, unidad: "kg" },
  { nombre: "Chucrut", precio_por_kg: 1800, unidad: "kg" },
  { nombre: "Mostaza", precio_por_kg: 2100, unidad: "kg" },
  { nombre: "Ketchup", precio_por_kg: 2000, unidad: "kg" },
  { nombre: "Tocino", precio_por_kg: 7200, unidad: "kg" },
  { nombre: "Papas fritas", precio_por_kg: 1500, unidad: "kg" },
];

// Recetas de ejemplo
const RECETAS_EJEMPLO = [
  {
    nombre_producto: "Completo Italiano",
    precio_venta: 4100,
    ingredientes: [
      { insumo: "Pan para completo", gramos: 80 },
      { insumo: "Salchichas", gramos: 60 },
      { insumo: "Palta", gramos: 40 },
      { insumo: "Tomate", gramos: 30 },
      { insumo: "Mayonesa", gramos: 20 },
    ],
  },
  {
    nombre_producto: "Completo As",
    precio_venta: 2200,
    ingredientes: [
      { insumo: "Pan para completo", gramos: 80 },
      { insumo: "Salchichas", gramos: 60 },
      { insumo: "Mayonesa", gramos: 25 },
      { insumo: "Mostaza", gramos: 10 },
      { insumo: "Chucrut", gramos: 30 },
    ],
  },
  {
    nombre_producto: "Completo Dinámico",
    precio_venta: 3000,
    ingredientes: [
      { insumo: "Pan para completo", gramos: 80 },
      { insumo: "Salchichas", gramos: 60 },
      { insumo: "Palta", gramos: 40 },
      { insumo: "Tomate", gramos: 30 },
      { insumo: "Mayonesa", gramos: 20 },
      { insumo: "Chucrut", gramos: 20 },
      { insumo: "Mostaza", gramos: 10 },
    ],
  },
  {
    nombre_producto: "Sandwich Lomito",
    precio_venta: 3500,
    ingredientes: [
      { insumo: "Pan para completo", gramos: 100 },
      { insumo: "Tocino", gramos: 80 },
      { insumo: "Palta", gramos: 50 },
      { insumo: "Tomate", gramos: 30 },
      { insumo: "Mayonesa", gramos: 25 },
    ],
  },
];

const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-CL");
const today = () => new Date().toISOString().slice(0, 10);
const personColor = (name) => ({
  Raul: "#6B9FD4", Pepe: "#E8B84B", Alejandro: "#5BAD7F", Gustavo: "#C97DDB"
}[name] || C.muted);

const normalizarProveedor = (s) =>
  (s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function App() {
  const [gastos, setGastos] = useState([]);
  const [insumos, setInsumos] = useState(INSUMOS_BASE);
  const [proveedores, setProveedores] = useState([]);
  const [view, setView] = useState("nuevo");
  const [persona, setPersona] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fecha: today(), insumo: INSUMOS_BASE[0], insumoCustom: "",
    cantidad: "", unidad: "unidad", fondo: FONDOS[0],
    proveedor: "", proveedorCustom: "", monto: "", nota: "",
  });
  const [nuevoInsumo, setNuevoInsumo] = useState("");
  const [filtro, setFiltro] = useState({ mes: "", insumo: "", persona: "" });
  const [filtroResumen, setFiltroResumen] = useState("");
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // --- Estado Recetas ---
  const [insumosPrecio, setInsumosPrecio] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loadingRecetas, setLoadingRecetas] = useState(true);
  const [recetaView, setRecetaView] = useState("calcular");
  const [preciosVenta, setPreciosVenta] = useState({});
  const [formInsumo, setFormInsumo] = useState({ nombre: "", precio_por_kg: "", unidad: "kg" });
  const [editInsumoId, setEditInsumoId] = useState(null);
  const [formReceta, setFormReceta] = useState({ nombre_producto: "", precio_venta: "", ingredientes: [] });
  const [editRecetaId, setEditRecetaId] = useState(null);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({ insumo: "", gramos: "" });

  // --- Estado Ventas ---
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(true);
  const [ventaView, setVentaView] = useState("registrar"); // "registrar" | "historial" | "dashboard" | "productos"
  const [productos, setProductos] = useState(PRODUCTOS_DEFAULT);
  const [carritoVenta, setCarritoVenta] = useState([]); // [{producto, cantidad, precio_unitario, metodo_pago}]
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [fechaVenta, setFechaVenta] = useState(today());
  const [savingVenta, setSavingVenta] = useState(false);
  const [filtroVentas, setFiltroVentas] = useState({ mes: "", metodo: "" });
  const [editProducto, setEditProducto] = useState(null);

  // --- Admin ---
  const ADMIN_CLAVE = "1232026";
  const [adminModal, setAdminModal] = useState(null);
  const [adminClave, setAdminClave] = useState("");
  const [adminError, setAdminError] = useState(false);

  useEffect(() => { cargarGastos(); }, []);
  useEffect(() => { if (view === "recetas") cargarRecetas(); }, [view]);
  useEffect(() => { if (view === "ventas") cargarVentas(); }, [view]);

  const cargarGastos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gastos").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setGastos(data);
      const provs = [...new Set(
        data.map((g) => normalizarProveedor(g.proveedor)).filter(Boolean)
      )].sort();
      setProveedores(provs);
    }
    setLoading(false);
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
    } else { setInsumosPrecio(ins || []); }
    if (rec && rec.length === 0) {
      await supabase.from("recetas").insert(RECETAS_EJEMPLO);
      const { data: rec2 } = await supabase.from("recetas").select("*").order("nombre_producto");
      setRecetas(rec2 || []);
    } else { setRecetas(rec || []); }
    setLoadingRecetas(false);
  };

  const cargarVentas = async () => {
    setLoadingVentas(true);
    const { data, error } = await supabase
      .from("ventas").select("*").order("created_at", { ascending: false });
    if (!error && data) setVentas(data);
    setLoadingVentas(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  // ── Admin: verificar clave y eliminar con log ──
  const solicitarEliminacion = (tipo, registro) => {
    setAdminModal({ tipo, registro });
    setAdminClave("");
    setAdminError(false);
  };

  const confirmarEliminacion = async () => {
    if (adminClave !== ADMIN_CLAVE) {
      setAdminError(true);
      return;
    }
    const { tipo, registro } = adminModal;
    const tabla = tipo === "venta" ? "ventas" : "gastos";
    await supabase.from(tabla).delete().eq("id", registro.id);
    await supabase.from("log_eliminaciones").insert([{
      tipo,
      registro_id: registro.id,
      detalle: registro,
      eliminado_por: persona || "desconocido",
    }]);
    setAdminModal(null);
    setAdminClave("");
    showToast("Registro eliminado y guardado en log");
    if (tipo === "venta") cargarVentas();
    else { setConfirmDelete(null); cargarGastos(); }
  };

  // ── Calcular costo de una receta ──
  const calcularCosto = (ingredientes, insumosLista) => {
    return ingredientes.reduce((total, ing) => {
      const insumo = insumosLista.find((i) => i.nombre === ing.insumo);
      if (!insumo) return total;
      if (insumo.unidad === "unidad") return total + insumo.precio_por_kg * (ing.gramos || 0);
      return total + (insumo.precio_por_kg / 1000) * ing.gramos;
    }, 0);
  };

  // ── Ventas ──
  const precioProducto = (prod) => {
    return metodoPago === "Pedidos Ya" ? prod.precio_py : prod.precio;
  };

  const agregarAlCarrito = (prod) => {
    const precio = precioProducto(prod);
    const existe = carritoVenta.find((c) => c.producto === prod.nombre && c.metodo_pago === metodoPago);
    if (existe) {
      setCarritoVenta(carritoVenta.map((c) =>
        c.producto === prod.nombre && c.metodo_pago === metodoPago
          ? { ...c, cantidad: c.cantidad + 1, total: (c.cantidad + 1) * precio }
          : c
      ));
    } else {
      setCarritoVenta([...carritoVenta, { producto: prod.nombre, cantidad: 1, precio_unitario: precio, metodo_pago: metodoPago, total: precio }]);
    }
  };

  const cambiarCantidad = (idx, delta) => {
    const nuevos = carritoVenta.map((c, i) => {
      if (i !== idx) return c;
      const nueva = c.cantidad + delta;
      if (nueva <= 0) return null;
      return { ...c, cantidad: nueva, total: nueva * c.precio_unitario };
    }).filter(Boolean);
    setCarritoVenta(nuevos);
  };

  const totalCarrito = carritoVenta.reduce((s, c) => s + c.total, 0);

  const registrarVenta = async () => {
    if (carritoVenta.length === 0) { showToast("Agrega productos al pedido"); return; }
    setSavingVenta(true);
    const rows = carritoVenta.map((c) => ({
      fecha: fechaVenta,
      producto: c.producto,
      cantidad: c.cantidad,
      precio_unitario: c.precio_unitario,
      total: c.total,
      metodo_pago: c.metodo_pago,
      persona: persona || null,
    }));
    const { error } = await supabase.from("ventas").insert(rows);
    if (error) { showToast("Error al guardar"); }
    else {
      showToast(`✓ Venta registrada — ${fmt(totalCarrito)}`);
      setCarritoVenta([]);
      cargarVentas();
    }
    setSavingVenta(false);
  };

  const guardarProducto = async () => {
    if (!editProducto) return;
    setProductos(productos.map((p) =>
      p.nombre === editProducto.nombre ? editProducto : p
    ));
    setEditProducto(null);
    showToast("✓ Producto actualizado");
  };

  // ── Gastos ──
  const agregarGasto = async () => {
    if (!persona) { showToast("Selecciona quién registra"); return; }
    const insumofinal = form.insumo === "Otro" ? (form.insumoCustom || "Otro") : form.insumo;
    const proveedorFinal = form.proveedor === "__nuevo__"
      ? normalizarProveedor(form.proveedorCustom) : form.proveedor;
    if (!insumofinal || !form.monto || isNaN(Number(form.monto))) {
      showToast("Completa monto e insumo"); return;
    }
    setSaving(true);
    const nuevo = {
      fecha: form.fecha, insumo: insumofinal,
      cantidad: form.cantidad || null, unidad: form.unidad,
      fondo: form.fondo, proveedor: proveedorFinal || null,
      monto: Number(form.monto), persona, nota: form.nota || null,
    };
    const { error } = await supabase.from("gastos").insert([nuevo]);
    if (error) { showToast("Error al guardar"); }
    else {
      showToast("✓ Gasto guardado");
      setForm({ ...form, cantidad: "", proveedor: "", proveedorCustom: "", monto: "", nota: "", insumoCustom: "" });
      cargarGastos();
    }
    setSaving(false);
  };

  const eliminar = (registro) => {
    solicitarEliminacion("gasto", registro);
  };

  const agregarInsumo = () => {
    const n = nuevoInsumo.trim();
    if (!n || insumos.includes(n)) return;
    setInsumos([...insumos.slice(0, -1), n, "Otro"]);
    setNuevoInsumo("");
    showToast(`"${n}" agregado`);
  };

  // ── Recetas ──
  const guardarInsumo = async () => {
    if (!formInsumo.nombre || !formInsumo.precio_por_kg) { showToast("Completa nombre y precio"); return; }
    const data = { nombre: formInsumo.nombre.trim(), precio_por_kg: Number(formInsumo.precio_por_kg), unidad: formInsumo.unidad };
    if (editInsumoId) {
      await supabase.from("insumos_precio").update(data).eq("id", editInsumoId);
      showToast("✓ Insumo actualizado"); setEditInsumoId(null);
    } else {
      await supabase.from("insumos_precio").insert([data]);
      showToast("✓ Insumo agregado");
    }
    setFormInsumo({ nombre: "", precio_por_kg: "", unidad: "kg" });
    cargarRecetas();
  };

  const editarInsumo = (ins) => {
    setFormInsumo({ nombre: ins.nombre, precio_por_kg: ins.precio_por_kg, unidad: ins.unidad });
    setEditInsumoId(ins.id);
  };

  const eliminarInsumo = async (id) => {
    await supabase.from("insumos_precio").delete().eq("id", id);
    showToast("Insumo eliminado"); cargarRecetas();
  };

  const agregarIngrediente = () => {
    if (!nuevoIngrediente.insumo || !nuevoIngrediente.gramos) return;
    setFormReceta({ ...formReceta, ingredientes: [...formReceta.ingredientes, { insumo: nuevoIngrediente.insumo, gramos: Number(nuevoIngrediente.gramos) }] });
    setNuevoIngrediente({ insumo: "", gramos: "" });
  };

  const quitarIngrediente = (idx) => {
    setFormReceta({ ...formReceta, ingredientes: formReceta.ingredientes.filter((_, i) => i !== idx) });
  };

  const guardarReceta = async () => {
    if (!formReceta.nombre_producto || formReceta.ingredientes.length === 0) { showToast("Agrega nombre e ingredientes"); return; }
    const data = { nombre_producto: formReceta.nombre_producto.trim(), precio_venta: Number(formReceta.precio_venta) || 0, ingredientes: formReceta.ingredientes };
    if (editRecetaId) {
      await supabase.from("recetas").update(data).eq("id", editRecetaId);
      showToast("✓ Receta actualizada"); setEditRecetaId(null);
    } else {
      await supabase.from("recetas").insert([data]);
      showToast("✓ Receta guardada");
    }
    setFormReceta({ nombre_producto: "", precio_venta: "", ingredientes: [] });
    cargarRecetas();
  };

  const editarReceta = (rec) => {
    setFormReceta({ nombre_producto: rec.nombre_producto, precio_venta: rec.precio_venta, ingredientes: rec.ingredientes });
    setEditRecetaId(rec.id); setRecetaView("recetas");
  };

  const eliminarReceta = async (id) => {
    await supabase.from("recetas").delete().eq("id", id);
    showToast("Receta eliminada"); cargarRecetas();
  };

  const actualizarPrecioVenta = async (receta, precio) => {
    await supabase.from("recetas").update({ precio_venta: Number(precio) }).eq("id", receta.id);
    cargarRecetas();
  };

  const margenColor = (pct) => {
    if (pct >= 60) return C.green;
    if (pct >= 40) return C.mustard;
    return C.red;
  };

  // ── Cálculos gastos ──
  const gastosFiltrados = gastos.filter((g) => {
    if (filtro.mes && !g.fecha.startsWith(filtro.mes)) return false;
    if (filtro.insumo && g.insumo !== filtro.insumo) return false;
    if (filtro.persona && g.persona !== filtro.persona) return false;
    return true;
  });
  const gastosResumen = filtroResumen ? gastos.filter((g) => g.fecha.startsWith(filtroResumen)) : gastos;
  const totalFiltrado = gastosFiltrados.reduce((s, g) => s + g.monto, 0);
  const totalGeneral = gastos.reduce((s, g) => s + g.monto, 0);
  const mesActual = today().slice(0, 7);
  const totalMes = gastos.filter((g) => g.fecha.startsWith(mesActual)).reduce((s, g) => s + g.monto, 0);
  const meses = [...new Set(gastos.map((g) => g.fecha.slice(0, 7)))].sort().reverse();

  const porInsumo = Object.entries(
    gastosResumen.reduce((acc, g) => { acc[g.insumo] = (acc[g.insumo] || 0) + g.monto; return acc; }, {})
  ).map(([n, t]) => ({ n, t })).sort((a, b) => b.t - a.t).slice(0, 10);

  const porPersona = PERSONAS.map((p) => ({
    p, t: gastosResumen.filter((g) => g.persona === p).reduce((s, g) => s + g.monto, 0),
    c: gastosResumen.filter((g) => g.persona === p).length,
  })).filter((x) => x.t > 0);

  const porProveedor = Object.entries(
    gastosResumen.filter((g) => g.proveedor).reduce((acc, g) => {
      const key = normalizarProveedor(g.proveedor);
      acc[key] = (acc[key] || 0) + g.monto; return acc;
    }, {})
  ).map(([n, t]) => ({ n, t })).sort((a, b) => b.t - a.t).slice(0, 6);

  const porFondo = FONDOS.map((f) => ({
    f, t: gastosResumen.filter((g) => g.fondo === f).reduce((s, g) => s + g.monto, 0),
    c: gastosResumen.filter((g) => g.fondo === f).length,
  })).filter((x) => x.t > 0);

  const porMes = [...new Set(gastos.map((g) => g.fecha.slice(0, 7)))].sort().reverse().map((m) => {
    const gs = gastos.filter((g) => g.fecha.startsWith(m));
    return { m, t: gs.reduce((s, g) => s + g.monto, 0), c: gs.length };
  });

  const maxInsumo = porInsumo[0]?.t || 1;
  const maxProv = porProveedor[0]?.t || 1;
  const maxFondo = porFondo.length > 0 ? Math.max(...porFondo.map((x) => x.t)) : 1;
  const maxMes = porMes.length > 0 ? Math.max(...porMes.map((x) => x.t)) : 1;
  const totalResumen = gastosResumen.reduce((s, g) => s + g.monto, 0);

  // ── Cálculos ventas ──
  const ventasMeses = [...new Set(ventas.map((v) => v.fecha.slice(0, 7)))].sort().reverse();
  const ventasFiltradas = ventas.filter((v) => {
    if (filtroVentas.mes && !v.fecha.startsWith(filtroVentas.mes)) return false;
    if (filtroVentas.metodo && v.metodo_pago !== filtroVentas.metodo) return false;
    return true;
  });
  const totalVentasDia = ventas.filter((v) => v.fecha === today()).reduce((s, v) => s + v.total, 0);
  const totalVentasMes = ventas.filter((v) => v.fecha.startsWith(mesActual)).reduce((s, v) => s + v.total, 0);
  const totalGastosMes = totalMes;
  const utilidadMes = totalVentasMes - totalGastosMes;

  const ventasPorProducto = Object.entries(
    ventas.filter((v) => v.fecha.startsWith(mesActual)).reduce((acc, v) => {
      acc[v.producto] = acc[v.producto] || { total: 0, cantidad: 0 };
      acc[v.producto].total += v.total;
      acc[v.producto].cantidad += v.cantidad;
      return acc;
    }, {})
  ).map(([n, d]) => ({ n, ...d })).sort((a, b) => b.total - a.total);

  const ventasPorMetodo = ["Efectivo", "Tarjeta", "Pedidos Ya"].map((m) => ({
    m, t: ventas.filter((v) => v.fecha.startsWith(mesActual) && v.metodo_pago === m).reduce((s, v) => s + v.total, 0),
  })).filter((x) => x.t > 0);

  const maxVentaProducto = ventasPorProducto[0]?.total || 1;
  const maxVentaMetodo = ventasPorMetodo.length > 0 ? Math.max(...ventasPorMetodo.map((x) => x.t)) : 1;

  const S = {
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px" },
    inp: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: "8px 10px", width: "100%", fontSize: 13, boxSizing: "border-box", outline: "none" },
  };

  const exportCSV = () => {
    const header = "Fecha,Insumo,Cantidad,Unidad,Fondo,Proveedor,Monto,Persona,Nota\n";
    const rows = gastos.map((g) =>
      [g.fecha, g.insumo, g.cantidad || "", g.unidad || "", g.fondo, g.proveedor || "", g.monto, g.persona, g.nota || ""].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "foodtruck_gastos.csv"; a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: C.mustard, color: C.bg, padding: "8px 20px", borderRadius: 30, fontWeight: 700, fontSize: 13, zIndex: 100, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 300, width: "90%" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>¿Eliminar gasto?</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{confirmDelete.insumo} — {fmt(confirmDelete.monto)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "8px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDelete)} style={{ flex: 1, background: C.red, border: "none", color: "#fff", borderRadius: 7, padding: "8px 0", cursor: "pointer", fontWeight: 700 }}>Continuar</button>
            </div>
          </div>
        </div>
      )}
      {adminModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 320, width: "90%" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🔐 Clave de administrador</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Se guardará un log de esta eliminación.</div>
            <input
              type="password"
              placeholder="Ingresa la clave"
              value={adminClave}
              onChange={(e) => { setAdminClave(e.target.value); setAdminError(false); }}
              onKeyDown={(e) => e.key === "Enter" && confirmarEliminacion()}
              style={{ ...S.inp, marginBottom: 8, fontSize: 16, letterSpacing: 4 }}
              autoFocus
            />
            {adminError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Clave incorrecta</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setAdminModal(null); setAdminClave(""); setAdminError(false); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "9px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarEliminacion} style={{ flex: 1, background: C.red, border: "none", color: "#fff", borderRadius: 7, padding: "9px 0", cursor: "pointer", fontWeight: 700 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {editProducto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 340, width: "90%" }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Editar — {editProducto.nombre}</div>
            <Fld label="Precio normal ($)">
              <input type="number" value={editProducto.precio} onChange={(e) => setEditProducto({ ...editProducto, precio: Number(e.target.value) })} style={S.inp} />
            </Fld>
            <div style={{ marginTop: 10 }}>
              <Fld label="Precio Pedidos Ya ($)">
                <input type="number" value={editProducto.precio_py} onChange={(e) => setEditProducto({ ...editProducto, precio_py: Number(e.target.value) })} style={S.inp} />
              </Fld>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditProducto(null)} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "9px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardarProducto} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🌭</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>FoodTruck · Don Abel</div>
              <div style={{ color: C.muted, fontSize: 11 }}>
                {loading ? "Cargando..." : `${gastos.length} gastos · ${fmt(totalGeneral)} total`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {PERSONAS.map((p) => (
              <button key={p} onClick={() => setPersona(p)} style={{ background: persona === p ? personColor(p) : C.tag, color: persona === p ? C.bg : C.muted, border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: persona === p ? 700 : 400, cursor: "pointer" }}>
                {p}
              </button>
            ))}
            <span style={{ color: C.muted, fontSize: 11, alignSelf: "center", marginLeft: 4 }}>
              {persona ? `Hola, ${persona}` : "← ¿Quién eres?"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[
              { id: "nuevo", label: "+ Gasto" },
              { id: "historial", label: "Historial" },
              { id: "resumen", label: "Resumen" },
              { id: "ventas", label: "💰 Ventas" },
              { id: "recetas", label: "🍽️ Recetas" },
            ].map((t) => (
              <button key={t.id} onClick={() => setView(t.id)} style={{ background: view === t.id ? C.mustard : "transparent", color: view === t.id ? C.bg : C.muted, border: `1px solid ${view === t.id ? C.mustard : C.border}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: view === t.id ? 700 : 400, fontSize: 13 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 60px" }}>

        {/* ── NUEVO GASTO ── */}
        {view === "nuevo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Registrar gasto</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Fld label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} style={S.inp} /></Fld>
                <Fld label="Monto ($)"><input type="number" placeholder="0" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} style={S.inp} /></Fld>
                <Fld label="Insumo" full>
                  <select value={form.insumo} onChange={(e) => setForm({ ...form, insumo: e.target.value })} style={S.inp}>
                    {insumos.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </Fld>
                {form.insumo === "Otro" && (
                  <Fld label="¿Cuál insumo?" full>
                    <input placeholder="Escribe el nombre" value={form.insumoCustom} onChange={(e) => setForm({ ...form, insumoCustom: e.target.value })} style={S.inp} />
                  </Fld>
                )}
                <Fld label="Cantidad"><input type="number" placeholder="ej: 2" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} style={S.inp} /></Fld>
                <Fld label="Unidad">
                  <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} style={S.inp}>
                    {["unidad","kg","g","litro","ml","paquete","caja","bolsa"].map((u) => <option key={u}>{u}</option>)}
                  </select>
                </Fld>
                <Fld label="Fondo usado">
                  <select value={form.fondo} onChange={(e) => setForm({ ...form, fondo: e.target.value })} style={S.inp}>
                    {FONDOS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Fld>
                <Fld label="Proveedor">
                  <select value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value, proveedorCustom: "" })} style={S.inp}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => <option key={p} value={p}>{p}</option>)}
                    <option value="__nuevo__">+ Nuevo proveedor…</option>
                  </select>
                </Fld>
                {form.proveedor === "__nuevo__" && (
                  <Fld label="Nombre del proveedor" full>
                    <input placeholder="ej: Jumbo, Mayorista 10" value={form.proveedorCustom} onChange={(e) => setForm({ ...form, proveedorCustom: e.target.value })} style={S.inp} />
                  </Fld>
                )}
                <Fld label="Nota (opcional)" full>
                  <input placeholder="ej: precio subió, oferta…" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} style={S.inp} />
                </Fld>
              </div>
              <button onClick={agregarGasto} disabled={saving} style={{ marginTop: 14, background: persona ? C.mustard : C.border, color: persona ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: persona ? "pointer" : "default", width: "100%" }}>
                {saving ? "Guardando..." : persona ? `Guardar — ${persona}` : "Selecciona quién registra arriba"}
              </button>
            </div>
            <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Agregar insumo a la lista</div>
                <input placeholder="ej: Mermelada" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregarInsumo()} style={S.inp} />
              </div>
              <button onClick={agregarInsumo} style={{ background: C.tag, border: `1px solid ${C.border}`, color: C.mustard, borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {view === "historial" && (
          <div>
            <div style={{ ...S.card, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={filtro.mes} onChange={(e) => setFiltro({ ...filtro, mes: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 110 }}>
                <option value="">Todos los meses</option>
                {meses.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={filtro.insumo} onChange={(e) => setFiltro({ ...filtro, insumo: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 120 }}>
                <option value="">Todos los insumos</option>
                {insumos.map((i) => <option key={i}>{i}</option>)}
              </select>
              <select value={filtro.persona} onChange={(e) => setFiltro({ ...filtro, persona: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 100 }}>
                <option value="">Todos</option>
                {PERSONAS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: C.muted, fontSize: 12 }}>
              <span>{gastosFiltrados.length} registros</span>
              <span style={{ color: C.mustard, fontWeight: 700, fontSize: 15 }}>{fmt(totalFiltrado)}</span>
            </div>
            {loading && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>Cargando...</div>}
            {!loading && gastosFiltrados.length === 0 && (<div style={{ textAlign: "center", color: C.muted, padding: 40, ...S.card }}>Sin registros aún</div>)}
            {gastosFiltrados.map((g) => (
              <div key={g.id} style={{ ...S.card, marginBottom: 8, display: "flex", gap: 10 }}>
                <div style={{ width: 3, borderRadius: 3, background: personColor(g.persona), flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.insumo}</div>
                  {g.cantidad && <div style={{ color: C.muted, fontSize: 11 }}>{g.cantidad} {g.unidad}</div>}
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span>{g.fecha}</span>
                    <Tag color={personColor(g.persona) + "33"} text={g.persona} textColor={personColor(g.persona)} />
                    <Tag text={g.fondo} />
                    {g.proveedor && <Tag text={normalizarProveedor(g.proveedor)} color="#2A3530" textColor={C.green} />}
                  </div>
                  {g.nota && <div style={{ color: C.muted, fontSize: 11, marginTop: 4, fontStyle: "italic" }}>{g.nota}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: C.mustard, fontSize: 15 }}>{fmt(g.monto)}</div>
                  <button onClick={() => setConfirmDelete(g)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4 }}>eliminar</button>
                </div>
              </div>
            ))}
            <button onClick={exportCSV} style={{ marginTop: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "9px 0", cursor: "pointer", fontSize: 13, width: "100%" }}>Exportar CSV</button>
          </div>
        )}

        {/* ── RESUMEN ── */}
        {view === "resumen" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>Filtrar por mes:</div>
                <select value={filtroResumen} onChange={(e) => setFiltroResumen(e.target.value)} style={{ ...S.inp }}>
                  <option value="">Todo el historial</option>
                  {meses.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {filtroResumen && (
                <div style={{ marginTop: 8, color: C.muted, fontSize: 12 }}>
                  Mostrando <span style={{ color: C.mustard, fontWeight: 700 }}>{filtroResumen}</span> — {gastosResumen.length} registros · <span style={{ color: C.mustard, fontWeight: 700 }}>{fmt(totalResumen)}</span>
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatCard label={filtroResumen ? "Total del mes" : "Total acumulado"} value={fmt(filtroResumen ? totalResumen : totalGeneral)} color={C.mustard} />
              <StatCard label="Este mes" value={fmt(totalMes)} color={C.green} />
            </div>
            <div style={S.card}>
              <STitle>Por persona</STitle>
              {porPersona.length === 0 && <Empty />}
              {porPersona.map((x) => (
                <div key={x.p} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: personColor(x.p), display: "inline-block" }} />
                      {x.p} <span style={{ color: C.muted, fontSize: 11 }}>({x.c} compras)</span>
                    </span>
                    <span style={{ fontWeight: 700, color: personColor(x.p) }}>{fmt(x.t)}</span>
                  </div>
                  <Bar value={x.t} max={Math.max(...porPersona.map((p) => p.t))} color={personColor(x.p)} />
                </div>
              ))}
            </div>
            <div style={S.card}>
              <STitle>Por origen del dinero</STitle>
              {porFondo.length === 0 && <Empty />}
              {porFondo.map((x) => (
                <div key={x.f} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: fondoColors[x.f] || C.muted, display: "inline-block" }} />
                      {x.f} <span style={{ color: C.muted, fontSize: 11 }}>({x.c} compras)</span>
                    </span>
                    <span style={{ fontWeight: 700, color: fondoColors[x.f] || C.muted }}>{fmt(x.t)}</span>
                  </div>
                  <Bar value={x.t} max={maxFondo} color={fondoColors[x.f] || C.muted} />
                </div>
              ))}
            </div>
            <div style={S.card}>
              <STitle>Por insumo</STitle>
              {porInsumo.length === 0 && <Empty />}
              {porInsumo.map((x) => (
                <div key={x.n} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{x.n}</span><span style={{ fontWeight: 700 }}>{fmt(x.t)}</span>
                  </div>
                  <Bar value={x.t} max={maxInsumo} color={C.mustard} />
                </div>
              ))}
            </div>
            <div style={S.card}>
              <STitle>Top proveedores</STitle>
              {porProveedor.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>Agrega proveedores al registrar gastos</div>}
              {porProveedor.map((x, i) => (
                <div key={x.n} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ display: "flex", gap: 8 }}><span style={{ color: C.muted, width: 14, textAlign: "right" }}>{i + 1}</span>{x.n}</span>
                    <span style={{ fontWeight: 700, color: C.green }}>{fmt(x.t)}</span>
                  </div>
                  <Bar value={x.t} max={maxProv} color={C.green} />
                </div>
              ))}
            </div>
            <div style={S.card}>
              <STitle>Tendencia mensual</STitle>
              {porMes.length === 0 && <Empty />}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted, fontWeight: 600 }}>Mes</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted, fontWeight: 600 }}>Compras</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted, fontWeight: 600 }}>Total</th>
                      <th style={{ padding: "6px 8px", width: "35%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {porMes.map((x) => (
                      <tr key={x.m} style={{ borderBottom: `1px solid ${C.border}22` }}>
                        <td style={{ padding: "8px 8px", fontWeight: x.m === mesActual ? 700 : 400, color: x.m === mesActual ? C.mustard : C.text }}>
                          {x.m}{x.m === mesActual && <span style={{ color: C.muted, fontSize: 10, marginLeft: 4 }}>actual</span>}
                        </td>
                        <td style={{ textAlign: "right", padding: "8px 8px", color: C.muted }}>{x.c}</td>
                        <td style={{ textAlign: "right", padding: "8px 8px", fontWeight: 700, color: C.mustard }}>{fmt(x.t)}</td>
                        <td style={{ padding: "8px 8px" }}>
                          <div style={{ background: C.border, borderRadius: 3, height: 6 }}>
                            <div style={{ background: x.m === mesActual ? C.mustard : C.mustardDim, width: `${Math.round((x.t / maxMes) * 100)}%`, height: "100%", borderRadius: 3 }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── VENTAS ── */}
        {view === "ventas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Sub-nav ventas */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "registrar", label: "🧾 Registrar" },
                { id: "dashboard", label: "📊 Dashboard" },
                { id: "historial", label: "📋 Historial" },
                { id: "productos", label: "🏷️ Productos" },
              ].map((t) => (
                <button key={t.id} onClick={() => setVentaView(t.id)} style={{ background: ventaView === t.id ? C.mustard : C.tag, color: ventaView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: ventaView === t.id ? 700 : 400, fontSize: 12 }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── REGISTRAR VENTA ── */}
            {ventaView === "registrar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Fecha y método de pago */}
                <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Fld label="Fecha">
                    <input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} style={S.inp} />
                  </Fld>
                  <Fld label="Método de pago">
                    <div style={{ display: "flex", gap: 6 }}>
                      {["Efectivo", "Tarjeta", "Pedidos Ya"].map((m) => (
                        <button key={m} onClick={() => setMetodoPago(m)} style={{ flex: 1, background: metodoPago === m ? (metodoPagoColors[m] || C.mustard) : C.tag, color: metodoPago === m ? "#fff" : C.muted, border: "none", borderRadius: 6, padding: "7px 4px", cursor: "pointer", fontWeight: metodoPago === m ? 700 : 400, fontSize: 11 }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </Fld>
                </div>

                {/* Grid de productos */}
                <div style={S.card}>
                  <STitle>Productos {metodoPago === "Pedidos Ya" && <span style={{ color: "#FF6B35", fontSize: 11, fontWeight: 400 }}>· precios Pedidos Ya (+30%)</span>}</STitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {productos.map((prod) => (
                      <button key={prod.nombre} onClick={() => agregarAlCarrito(prod)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 10px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = C.mustard}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 4 }}>{prod.nombre}</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: metodoPago === "Pedidos Ya" ? "#FF6B35" : C.mustard }}>
                          {fmt(metodoPago === "Pedidos Ya" ? prod.precio_py : prod.precio)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Carrito */}
                {carritoVenta.length > 0 && (
                  <div style={S.card}>
                    <STitle>Pedido actual</STitle>
                    {carritoVenta.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, background: C.bg, borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.producto}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{fmt(c.precio_unitario)} c/u · <Tag text={c.metodo_pago} color={metodoPagoColors[c.metodo_pago] + "33"} textColor={metodoPagoColors[c.metodo_pago]} /></div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button onClick={() => cambiarCantidad(i, -1)} style={{ background: C.tag, border: "none", color: C.text, borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{c.cantidad}</span>
                          <button onClick={() => cambiarCantidad(i, 1)} style={{ background: C.tag, border: "none", color: C.text, borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
                          <span style={{ fontWeight: 700, color: C.mustard, minWidth: 60, textAlign: "right" }}>{fmt(c.total)}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: C.green }}>{fmt(totalCarrito)}</span>
                    </div>
                    <button onClick={registrarVenta} disabled={savingVenta} style={{ marginTop: 12, background: C.green, border: "none", color: "#fff", borderRadius: 8, padding: "12px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%" }}>
                      {savingVenta ? "Guardando..." : "✓ Confirmar venta"}
                    </button>
                    <button onClick={() => setCarritoVenta([])} style={{ marginTop: 8, background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "8px 0", cursor: "pointer", fontSize: 12, width: "100%" }}>
                      Cancelar pedido
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── DASHBOARD VENTAS ── */}
            {ventaView === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <StatCard label="Ventas hoy" value={fmt(totalVentasDia)} color={C.green} />
                  <StatCard label="Ventas este mes" value={fmt(totalVentasMes)} color={C.mustard} />
                  <StatCard label="Gastos este mes" value={fmt(totalGastosMes)} color={C.red} />
                  <StatCard label="Utilidad del mes" value={fmt(utilidadMes)} color={utilidadMes >= 0 ? C.green : C.red} />
                </div>

                <div style={S.card}>
                  <STitle>Ventas por producto — {mesActual}</STitle>
                  {ventasPorProducto.length === 0 && <Empty />}
                  {ventasPorProducto.map((x) => (
                    <div key={x.n} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span>{x.n} <span style={{ color: C.muted, fontSize: 11 }}>({x.cantidad} und)</span></span>
                        <span style={{ fontWeight: 700, color: C.green }}>{fmt(x.total)}</span>
                      </div>
                      <Bar value={x.total} max={maxVentaProducto} color={C.green} />
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <STitle>Por método de pago — {mesActual}</STitle>
                  {ventasPorMetodo.length === 0 && <Empty />}
                  {ventasPorMetodo.map((x) => (
                    <div key={x.m} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: metodoPagoColors[x.m] || C.muted, display: "inline-block" }} />
                          {x.m}
                        </span>
                        <span style={{ fontWeight: 700, color: metodoPagoColors[x.m] || C.muted }}>{fmt(x.t)}</span>
                      </div>
                      <Bar value={x.t} max={maxVentaMetodo} color={metodoPagoColors[x.m] || C.muted} />
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <STitle>Resumen financiero — {mesActual}</STitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.muted }}>Total ventas</span>
                      <span style={{ fontWeight: 700, color: C.green }}>{fmt(totalVentasMes)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.muted }}>Total gastos</span>
                      <span style={{ fontWeight: 700, color: C.red }}>{fmt(totalGastosMes)}</span>
                    </div>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700 }}>Utilidad neta</span>
                      <span style={{ fontWeight: 800, fontSize: 18, color: utilidadMes >= 0 ? C.green : C.red }}>{fmt(utilidadMes)}</span>
                    </div>
                    {totalVentasMes > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: C.muted }}>Margen neto</span>
                        <span style={{ fontWeight: 700, color: utilidadMes >= 0 ? C.green : C.red }}>
                          {Math.round((utilidadMes / totalVentasMes) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── HISTORIAL VENTAS ── */}
            {ventaView === "historial" && (
              <div>
                <div style={{ ...S.card, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select value={filtroVentas.mes} onChange={(e) => setFiltroVentas({ ...filtroVentas, mes: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 110 }}>
                    <option value="">Todos los meses</option>
                    {ventasMeses.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={filtroVentas.metodo} onChange={(e) => setFiltroVentas({ ...filtroVentas, metodo: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 120 }}>
                    <option value="">Todos los métodos</option>
                    {["Efectivo","Tarjeta","Pedidos Ya"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: C.muted, fontSize: 12 }}>
                  <span>{ventasFiltradas.length} registros</span>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>{fmt(ventasFiltradas.reduce((s, v) => s + v.total, 0))}</span>
                </div>
                {loadingVentas && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>Cargando...</div>}
                {!loadingVentas && ventasFiltradas.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 40, ...S.card }}>Sin ventas aún</div>}
                {ventasFiltradas.map((v) => (
                  <div key={v.id} style={{ ...S.card, marginBottom: 8, display: "flex", gap: 10 }}>
                    <div style={{ width: 3, borderRadius: 3, background: metodoPagoColors[v.metodo_pago] || C.muted, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{v.producto}</div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span>{v.fecha}</span>
                        <span>{v.cantidad} und · {fmt(v.precio_unitario)} c/u</span>
                        <Tag text={v.metodo_pago} color={(metodoPagoColors[v.metodo_pago] || C.muted) + "33"} textColor={metodoPagoColors[v.metodo_pago] || C.muted} />
                        {v.persona && <Tag color={personColor(v.persona) + "33"} text={v.persona} textColor={personColor(v.persona)} />}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: C.green, fontSize: 15 }}>{fmt(v.total)}</div>
                      <button onClick={() => solicitarEliminacion("venta", v)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4 }}>eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── PRODUCTOS ── */}
            {ventaView === "productos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: C.muted, fontSize: 12, padding: "4px 0" }}>Toca Editar para cambiar precios normales y de Pedidos Ya.</div>
                {productos.map((prod) => (
                  <div key={prod.nombre} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{prod.nombre}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12 }}>
                        <span style={{ color: C.mustard, fontWeight: 700 }}>{fmt(prod.precio)}</span>
                        <span style={{ color: C.muted }}>PY: <span style={{ color: "#FF6B35", fontWeight: 700 }}>{fmt(prod.precio_py)}</span></span>
                      </div>
                    </div>
                    <button onClick={() => setEditProducto({ ...prod })} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RECETAS ── */}
        {view === "recetas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { id: "calcular", label: "📊 Márgenes" },
                { id: "insumos", label: "🛒 Insumos" },
                { id: "recetas", label: "📝 Recetas" },
              ].map((t) => (
                <button key={t.id} onClick={() => setRecetaView(t.id)} style={{ background: recetaView === t.id ? C.mustard : C.tag, color: recetaView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: recetaView === t.id ? 700 : 400, fontSize: 12 }}>
                  {t.label}
                </button>
              ))}
            </div>
            {loadingRecetas && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>Cargando recetas...</div>}

            {/* Márgenes */}
            {!loadingRecetas && recetaView === "calcular" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 12, padding: "4px 0" }}>Costo calculado en base a los gramos de cada receta × precio/kg. Edita el precio de venta aquí directamente.</div>
                {recetas.length === 0 && <div style={{ ...S.card, color: C.muted, textAlign: "center" }}>No hay recetas aún.</div>}
                {recetas.map((rec) => {
                  const costo = calcularCosto(rec.ingredientes, insumosPrecio);
                  const venta = preciosVenta[rec.id] !== undefined ? preciosVenta[rec.id] : rec.precio_venta;
                  const margen = venta - costo;
                  const margenPct = venta > 0 ? (margen / venta) * 100 : 0;
                  return (
                    <div key={rec.id} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{rec.nombre_producto}</div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: C.muted }}>Costo</div>
                          <div style={{ fontWeight: 700, color: C.red, fontSize: 16 }}>{fmt(Math.round(costo))}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                        {rec.ingredientes.map((ing, i) => {
                          const insumoData = insumosPrecio.find((x) => x.nombre === ing.insumo);
                          const label = insumoData?.unidad === "unidad" ? `${ing.gramos} und` : `${ing.gramos}g`;
                          return (
                            <span key={i} style={{ background: C.tag, borderRadius: 4, padding: "2px 8px", fontSize: 11, color: C.muted }}>
                              {ing.insumo} <span style={{ color: C.text }}>{label}</span>
                            </span>
                          );
                        })}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Precio venta ($)</div>
                          <input type="number" value={preciosVenta[rec.id] !== undefined ? preciosVenta[rec.id] : rec.precio_venta}
                            onChange={(e) => setPreciosVenta({ ...preciosVenta, [rec.id]: e.target.value })}
                            onBlur={(e) => { actualizarPrecioVenta(rec, e.target.value); setPreciosVenta({ ...preciosVenta, [rec.id]: undefined }); }}
                            style={{ ...S.inp, fontWeight: 700, fontSize: 15 }} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Ganancia</div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: margen >= 0 ? C.green : C.red }}>{fmt(Math.round(margen))}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Margen</div>
                          <div style={{ fontWeight: 800, fontSize: 20, color: margenColor(margenPct) }}>{Math.round(margenPct)}%</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, background: C.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
                        <div style={{ background: margenColor(margenPct), width: `${Math.min(100, Math.max(0, margenPct))}%`, height: "100%", borderRadius: 4, transition: "width .3s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 3 }}>
                        <span>0%</span><span style={{ color: C.mustard }}>40%</span><span style={{ color: C.green }}>60%+</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Insumos */}
            {!loadingRecetas && recetaView === "insumos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={S.card}>
                  <STitle>{editInsumoId ? "Editar insumo" : "Agregar insumo"}</STitle>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <Fld label="Nombre"><input placeholder="ej: Palta" value={formInsumo.nombre} onChange={(e) => setFormInsumo({ ...formInsumo, nombre: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Precio / kg ($)"><input type="number" placeholder="0" value={formInsumo.precio_por_kg} onChange={(e) => setFormInsumo({ ...formInsumo, precio_por_kg: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Unidad">
                      <select value={formInsumo.unidad} onChange={(e) => setFormInsumo({ ...formInsumo, unidad: e.target.value })} style={S.inp}>
                        {["kg","litro","unidad"].map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </Fld>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={guardarInsumo} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>
                      {editInsumoId ? "Actualizar" : "Agregar"}
                    </button>
                    {editInsumoId && (
                      <button onClick={() => { setEditInsumoId(null); setFormInsumo({ nombre: "", precio_por_kg: "", unidad: "kg" }); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "9px 16px", cursor: "pointer" }}>Cancelar</button>
                    )}
                  </div>
                </div>
                {insumosPrecio.map((ins) => (
                  <div key={ins.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{ins.nombre}</div>
                      <div style={{ color: C.muted, fontSize: 12 }}>{fmt(ins.precio_por_kg)} / {ins.unidad}</div>
                    </div>
                    {ins.unidad !== "unidad" && <div style={{ color: C.muted, fontSize: 11 }}>{fmt(Math.round(ins.precio_por_kg / 1000))} / g</div>}
                    <button onClick={() => editarInsumo(ins)} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                    <button onClick={() => eliminarInsumo(ins.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Editor recetas */}
            {!loadingRecetas && recetaView === "recetas" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={S.card}>
                  <STitle>{editRecetaId ? "Editar receta" : "Nueva receta"}</STitle>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 10 }}>
                    <Fld label="Nombre del producto">
                      <input placeholder="ej: Completo Italiano" value={formReceta.nombre_producto} onChange={(e) => setFormReceta({ ...formReceta, nombre_producto: e.target.value })} style={S.inp} />
                    </Fld>
                    <Fld label="Precio venta ($)">
                      <input type="number" placeholder="0" value={formReceta.precio_venta} onChange={(e) => setFormReceta({ ...formReceta, precio_venta: e.target.value })} style={S.inp} />
                    </Fld>
                  </div>
                  {formReceta.ingredientes.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>Ingredientes:</div>
                      {formReceta.ingredientes.map((ing, i) => {
                        const insumoData = insumosPrecio.find((x) => x.nombre === ing.insumo);
                        const label = insumoData?.unidad === "unidad" ? `${ing.gramos} und` : `${ing.gramos}g`;
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: 6, padding: "5px 10px", marginBottom: 5 }}>
                            <span style={{ fontSize: 13 }}>{ing.insumo}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ color: C.mustard, fontWeight: 600 }}>{label}</span>
                              <button onClick={() => quitarIngrediente(i)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(() => {
                    const insumoSel = insumosPrecio.find((i) => i.nombre === nuevoIngrediente.insumo);
                    const esPorUnidad = insumoSel?.unidad === "unidad";
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, marginBottom: 10 }}>
                        <select value={nuevoIngrediente.insumo} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, insumo: e.target.value, gramos: "" })} style={S.inp}>
                          <option value="">Selecciona insumo…</option>
                          {insumosPrecio.map((i) => <option key={i.id} value={i.nombre}>{i.nombre}</option>)}
                        </select>
                        <input type="number" placeholder={esPorUnidad ? "unidades" : "gramos"} value={nuevoIngrediente.gramos} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, gramos: e.target.value })} style={S.inp} />
                        <button onClick={agregarIngrediente} style={{ background: C.tag, border: `1px solid ${C.border}`, color: C.mustard, borderRadius: 7, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>+</button>
                      </div>
                    );
                  })()}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={guardarReceta} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>
                      {editRecetaId ? "Actualizar receta" : "Guardar receta"}
                    </button>
                    {editRecetaId && (
                      <button onClick={() => { setEditRecetaId(null); setFormReceta({ nombre_producto: "", precio_venta: "", ingredientes: [] }); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "9px 16px", cursor: "pointer" }}>Cancelar</button>
                    )}
                  </div>
                </div>
                {recetas.map((rec) => {
                  const costo = calcularCosto(rec.ingredientes, insumosPrecio);
                  return (
                    <div key={rec.id} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{rec.nombre_producto}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => editarReceta(rec)} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                          <button onClick={() => eliminarReceta(rec.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                        {rec.ingredientes.map((ing, i) => {
                          const insumoData = insumosPrecio.find((x) => x.nombre === ing.insumo);
                          const label = insumoData?.unidad === "unidad" ? `${ing.gramos} und` : `${ing.gramos}g`;
                          return (
                            <span key={i} style={{ background: C.tag, borderRadius: 4, padding: "2px 8px", fontSize: 11, color: C.muted }}>
                              {ing.insumo} <span style={{ color: C.text }}>{label}</span>
                            </span>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                        <span style={{ color: C.muted }}>Costo: <span style={{ color: C.red, fontWeight: 700 }}>{fmt(Math.round(costo))}</span></span>
                        <span style={{ color: C.muted }}>Venta: <span style={{ color: C.mustard, fontWeight: 700 }}>{fmt(rec.precio_venta)}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Fld({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <div style={{ color: "#8A8496", fontSize: 11, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}
function Tag({ text, color = "#332F3C", textColor = "#A09AB0" }) {
  return <span style={{ background: color, borderRadius: 4, padding: "1px 7px", fontSize: 11, color: textColor }}>{text}</span>;
}
function Bar({ value, max, color }) {
  return (
    <div style={{ background: "#3A3640", borderRadius: 3, height: 7 }}>
      <div style={{ background: color, width: max ? `${Math.round((value / max) * 100)}%` : "0%", height: "100%", borderRadius: 3, transition: "width .4s ease" }} />
    </div>
  );
}
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#2A2730", border: "1px solid #3A3640", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ color: "#8A8496", fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}
function STitle({ children }) {
  return <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "#F2EEF8" }}>{children}</div>;
}
function Empty() {
  return <div style={{ color: "#8A8496", fontSize: 12 }}>Sin datos aún</div>;
}
