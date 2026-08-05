import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const C = {
  bg: "#18161A", surface: "#221F26", card: "#2A2730", border: "#3A3640",
  mustard: "#E8B84B", mustardDim: "#B8902A", red: "#E05252",
  green: "#5BAD7F", text: "#F2EEF8", muted: "#8A8496", tag: "#332F3C",
  blue: "#6B9FD4", purple: "#C97DDB", orange: "#FF6B35",
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
  "Efectivo foodtruck": "#6B9FD4", "Efectivo Don Abel": "#5BAD7F",
  "Tarjeta foodtruck": "#C97DDB", "Tarjeta Don Abel": "#E8B84B",
};
const metodoPagoColors = { "Efectivo": "#5BAD7F", "Tarjeta": "#6B9FD4", "Pedidos Ya": "#FF6B35" };
const personColor = (name) => ({ Raul: "#6B9FD4", Pepe: "#E8B84B", Alejandro: "#5BAD7F", Gustavo: "#C97DDB" }[name] || C.muted);
const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-CL");
const today = () => new Date().toISOString().slice(0, 10);
const normalizarProveedor = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── PRODUCTOS ──
const CATEGORIAS_PRODUCTOS = [
  {
    id: "completos", label: "Completos", emoji: "🌭",
    items: [
      { nombre: "Italiano", precio: 4100, precio_py: 5330 },
      { nombre: "Highway to Hell", precio: 4600, precio_py: 5980 },
      { nombre: "Torn and Frayed", precio: 4600, precio_py: 5980 },
      { nombre: "Purple Haze", precio: 4600, precio_py: 5980 },
      { nombre: "Dinámico", precio: 4900, precio_py: 6370 },
      { nombre: "Paradise City", precio: 4900, precio_py: 6370 },
      { nombre: "Sweet Child O' Mine", precio: 4900, precio_py: 6370 },
    ],
  },
  {
    id: "pollo", label: "Pollo", emoji: "🍗",
    items: [
      { nombre: "Pollo Highway to Hell", precio: 4500, precio_py: 5850 },
      { nombre: "Pollo Welcome to the Jungle", precio: 4500, precio_py: 5850 },
      { nombre: "Pollo Rock You Like a Hurricane", precio: 4500, precio_py: 5850 },
      { nombre: "Pollo Back in Black", precio: 4900, precio_py: 6370 },
      { nombre: "Pollo Thunderstruck", precio: 4900, precio_py: 6370 },
      { nombre: "Pollo Smoke on the Water", precio: 5200, precio_py: 6760 },
    ],
  },
  {
    id: "churrasco", label: "Churrasco", emoji: "🥩",
    items: [
      { nombre: "Churrasco Highway to Hell", precio: 5200, precio_py: 6760 },
      { nombre: "Churrasco Welcome to the Jungle", precio: 5200, precio_py: 6760 },
      { nombre: "Churrasco Rock You Like a Hurricane", precio: 5200, precio_py: 6760 },
      { nombre: "Churrasco Back in Black", precio: 5700, precio_py: 7410 },
      { nombre: "Churrasco Thunderstruck", precio: 5700, precio_py: 7410 },
      { nombre: "Churrasco Smoke on the Water", precio: 5900, precio_py: 7670 },
    ],
  },
  {
    id: "papas", label: "Papas", emoji: "🍟",
    items: [
      { nombre: "Papas fritas", precio: 2900, precio_py: 3770 },
      { nombre: "Salchipapas", precio: 3600, precio_py: 4680 },
      { nombre: "Salchipapas con tocino", precio: 4500, precio_py: 5850 },
      { nombre: "Papas tocino y cebolla", precio: 4000, precio_py: 5200 },
      { nombre: "Papas queso fundido y tocino", precio: 4000, precio_py: 5200 },
      { nombre: "Papas con nuggets", precio: 4500, precio_py: 5850 },
      { nombre: "Papas con nuggets (12 und)", precio: 5300, precio_py: 6890 },
    ],
  },
  {
    id: "bebidas", label: "Bebidas", emoji: "🥤",
    items: [
      { nombre: "Lata 250ml", precio: 1000, precio_py: 1300 },
    ],
  },
  {
    id: "agregados", label: "Agregados", emoji: "➕",
    items: [
      { nombre: "Queso fundido", precio: 1000, precio_py: 1300 },
      { nombre: "Tocino agregado", precio: 1000, precio_py: 1300 },
      { nombre: "Agregado extra", precio: 600, precio_py: 780 },
    ],
  },
];

// ── RECETAS EJEMPLO ──
const RECETAS_EJEMPLO = [
  { nombre_producto: "Italiano", precio_venta: 4100, ingredientes: [{ insumo: "Vienesa", gramos: 80 }, { insumo: "Palta", gramos: 40 }, { insumo: "Tomate", gramos: 30 }, { insumo: "Mayonesa casera", gramos: 25 }, { insumo: "Pan para completo", gramos: 80 }] },
  { nombre_producto: "Highway to Hell", precio_venta: 4600, ingredientes: [{ insumo: "Vienesa", gramos: 80 }, { insumo: "Cebolla caramelizada", gramos: 40 }, { insumo: "Pepinillos", gramos: 20 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Pan para completo", gramos: 80 }] },
  { nombre_producto: "Torn and Frayed", precio_venta: 4600, ingredientes: [{ insumo: "Vienesa", gramos: 80 }, { insumo: "Cebolla caramelizada", gramos: 40 }, { insumo: "Papas hilo", gramos: 20 }, { insumo: "Pan para completo", gramos: 80 }] },
  { nombre_producto: "Purple Haze", precio_venta: 4600, ingredientes: [{ insumo: "Vienesa", gramos: 80 }, { insumo: "Chucrut morado", gramos: 30 }, { insumo: "Pepinillos", gramos: 20 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Pan para completo", gramos: 80 }] },
  { nombre_producto: "Dinámico", precio_venta: 4900, ingredientes: [{ insumo: "Vienesa", gramos: 80 }, { insumo: "Palta", gramos: 40 }, { insumo: "Tomate", gramos: 30 }, { insumo: "Chucrut", gramos: 20 }, { insumo: "Salsa americana", gramos: 15 }, { insumo: "Mayonesa casera", gramos: 20 }, { insumo: "Pan para completo", gramos: 80 }] },
  { nombre_producto: "Paradise City", precio_venta: 4900, ingredientes: [{ insumo: "Vienesa", gramos: 80 }, { insumo: "Palta", gramos: 40 }, { insumo: "Tomate", gramos: 30 }, { insumo: "Cebolla caramelizada", gramos: 30 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Ají", gramos: 10 }, { insumo: "Pan para completo", gramos: 80 }] },
  { nombre_producto: "Sweet Child O' Mine", precio_venta: 4900, ingredientes: [{ insumo: "Vienesa", gramos: 80 }, { insumo: "Cebolla caramelizada", gramos: 40 }, { insumo: "Queso fundido", gramos: 30 }, { insumo: "Pan para completo", gramos: 80 }] },
  { nombre_producto: "Pollo Highway to Hell", precio_venta: 4500, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Fingers de pollo", gramos: 100 }, { insumo: "Mayonesa casera", gramos: 20 }, { insumo: "Pepinillos", gramos: 15 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Back in Black", precio_venta: 4900, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Fingers de pollo", gramos: 100 }, { insumo: "BBQ", gramos: 20 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Welcome to the Jungle", precio_venta: 4500, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Fingers de pollo", gramos: 100 }, { insumo: "Salsa americana", gramos: 20 }, { insumo: "Cebolla caramelizada", gramos: 30 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Thunderstruck", precio_venta: 4900, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Fingers de pollo", gramos: 100 }, { insumo: "Mostaza", gramos: 15 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Rock You Like a Hurricane", precio_venta: 4500, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Fingers de pollo", gramos: 100 }, { insumo: "Chucrut", gramos: 25 }, { insumo: "Mostaza", gramos: 15 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Pollo Smoke on the Water", precio_venta: 5200, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Fingers de pollo", gramos: 100 }, { insumo: "BBQ", gramos: 20 }, { insumo: "Cebolla caramelizada", gramos: 30 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Highway to Hell", precio_venta: 5200, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Churrasco", gramos: 120 }, { insumo: "Mayonesa casera", gramos: 20 }, { insumo: "Pepinillos", gramos: 15 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Back in Black", precio_venta: 5700, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Churrasco", gramos: 120 }, { insumo: "BBQ", gramos: 20 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Welcome to the Jungle", precio_venta: 5200, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Churrasco", gramos: 120 }, { insumo: "Salsa americana", gramos: 20 }, { insumo: "Cebolla caramelizada", gramos: 30 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Thunderstruck", precio_venta: 5700, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Churrasco", gramos: 120 }, { insumo: "Mostaza", gramos: 15 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Rock You Like a Hurricane", precio_venta: 5200, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Churrasco", gramos: 120 }, { insumo: "Chucrut", gramos: 25 }, { insumo: "Mostaza", gramos: 15 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Churrasco Smoke on the Water", precio_venta: 5900, ingredientes: [{ insumo: "Pan brioche", gramos: 90 }, { insumo: "Churrasco", gramos: 120 }, { insumo: "BBQ", gramos: 20 }, { insumo: "Cebolla caramelizada", gramos: 30 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Queso cheddar", gramos: 25 }] },
  { nombre_producto: "Papas fritas", precio_venta: 2900, ingredientes: [{ insumo: "Papas fritas", gramos: 300 }] },
  { nombre_producto: "Salchipapas", precio_venta: 3600, ingredientes: [{ insumo: "Papas fritas", gramos: 300 }, { insumo: "Vienesa", gramos: 80 }] },
  { nombre_producto: "Salchipapas con tocino", precio_venta: 4500, ingredientes: [{ insumo: "Papas fritas", gramos: 300 }, { insumo: "Vienesa", gramos: 80 }, { insumo: "Tocino", gramos: 30 }] },
  { nombre_producto: "Papas tocino y cebolla", precio_venta: 4000, ingredientes: [{ insumo: "Papas fritas", gramos: 300 }, { insumo: "Tocino", gramos: 30 }, { insumo: "Cebolla caramelizada", gramos: 40 }] },
  { nombre_producto: "Papas queso fundido y tocino", precio_venta: 4000, ingredientes: [{ insumo: "Papas fritas", gramos: 300 }, { insumo: "Queso fundido", gramos: 40 }, { insumo: "Tocino", gramos: 30 }] },
  { nombre_producto: "Papas con nuggets", precio_venta: 4500, ingredientes: [{ insumo: "Papas fritas", gramos: 300 }, { insumo: "Nuggets", gramos: 6 }] },
  { nombre_producto: "Papas con nuggets (12 und)", precio_venta: 5300, ingredientes: [{ insumo: "Papas fritas", gramos: 300 }, { insumo: "Nuggets", gramos: 12 }] },
];

const INSUMOS_EJEMPLO = [
  { nombre: "Vienesa", precio_por_kg: 5500, unidad: "kg" },
  { nombre: "Pan para completo", precio_por_kg: 2800, unidad: "kg" },
  { nombre: "Pan brioche", precio_por_kg: 3500, unidad: "kg" },
  { nombre: "Palta", precio_por_kg: 4500, unidad: "kg" },
  { nombre: "Tomate", precio_por_kg: 1200, unidad: "kg" },
  { nombre: "Mayonesa casera", precio_por_kg: 2500, unidad: "kg" },
  { nombre: "Tocino", precio_por_kg: 7200, unidad: "kg" },
  { nombre: "Cebolla caramelizada", precio_por_kg: 1800, unidad: "kg" },
  { nombre: "Pepinillos", precio_por_kg: 2200, unidad: "kg" },
  { nombre: "Chucrut", precio_por_kg: 1800, unidad: "kg" },
  { nombre: "Chucrut morado", precio_por_kg: 2000, unidad: "kg" },
  { nombre: "Papas hilo", precio_por_kg: 3000, unidad: "kg" },
  { nombre: "Salsa americana", precio_por_kg: 2000, unidad: "kg" },
  { nombre: "Ají", precio_por_kg: 1500, unidad: "kg" },
  { nombre: "Queso fundido", precio_por_kg: 4500, unidad: "kg" },
  { nombre: "Queso cheddar", precio_por_kg: 5000, unidad: "kg" },
  { nombre: "Fingers de pollo", precio_por_kg: 6500, unidad: "kg" },
  { nombre: "Churrasco", precio_por_kg: 9000, unidad: "kg" },
  { nombre: "BBQ", precio_por_kg: 2200, unidad: "kg" },
  { nombre: "Mostaza", precio_por_kg: 2100, unidad: "kg" },
  { nombre: "Papas fritas", precio_por_kg: 1500, unidad: "kg" },
  { nombre: "Nuggets", precio_por_kg: 4000, unidad: "kg" },
];

export default function App() {
  // ── Navegación ──
  const [view, setView] = useState("home"); // home | gastos | ventas | recetas | resumen
  const [persona, setPersona] = useState("");

  // ── Gastos ──
  const [gastos, setGastos] = useState([]);
  const [insumos, setInsumos] = useState(INSUMOS_BASE);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gastosView, setGastosView] = useState("nuevo"); // nuevo | historial
  const [form, setForm] = useState({ fecha: today(), insumo: INSUMOS_BASE[0], insumoCustom: "", cantidad: "", unidad: "unidad", fondo: FONDOS[0], proveedor: "", proveedorCustom: "", monto: "", nota: "" });
  const [nuevoInsumo, setNuevoInsumo] = useState("");
  const [filtro, setFiltro] = useState({ mes: "", insumo: "", persona: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Ventas ──
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [ventaView, setVentaView] = useState("registrar"); // registrar | historial | dashboard | productos
  const [categorias, setCategorias] = useState(CATEGORIAS_PRODUCTOS);
  const [catActiva, setCatActiva] = useState("completos");
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [fechaVenta, setFechaVenta] = useState(today());
  const [savingVenta, setSavingVenta] = useState(false);
  const [filtroVentas, setFiltroVentas] = useState({ mes: "", metodo: "" });
  const [editProducto, setEditProducto] = useState(null);
  // Descuentos
  const [descuentoModal, setDescuentoModal] = useState(null); // item del carrito
  const [descuentoTipo, setDescuentoTipo] = useState(""); // "cortesia" | "personal"
  const [descuentoPct, setDescuentoPct] = useState("");
  const [cortesiaDueno, setCortesiaDueno] = useState("");

  // ── Recetas ──
  const [insumosPrecio, setInsumosPrecio] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [recetaView, setRecetaView] = useState("calcular");
  const [preciosVenta, setPreciosVenta] = useState({});
  const [formInsumo, setFormInsumo] = useState({ nombre: "", precio_por_kg: "", unidad: "kg" });
  const [editInsumoId, setEditInsumoId] = useState(null);
  const [formReceta, setFormReceta] = useState({ nombre_producto: "", precio_venta: "", ingredientes: [] });
  const [editRecetaId, setEditRecetaId] = useState(null);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({ insumo: "", gramos: "" });

  // ── Resumen ──
  const [filtroResumen, setFiltroResumen] = useState("");

  // ── Admin ──
  const ADMIN_CLAVE = "1232026";
  const [adminModal, setAdminModal] = useState(null);
  const [adminClave, setAdminClave] = useState("");
  const [adminError, setAdminError] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // ── Carga de datos ──
  useEffect(() => {
    if (view === "gastos" || view === "resumen") cargarGastos();
    if (view === "ventas" || view === "resumen") cargarVentas();
    if (view === "recetas") cargarRecetas();
  }, [view]);

  const cargarGastos = async () => {
    setLoading(true);
    const { data } = await supabase.from("gastos").select("*").order("created_at", { ascending: false });
    if (data) {
      setGastos(data);
      setProveedores([...new Set(data.map((g) => normalizarProveedor(g.proveedor)).filter(Boolean))].sort());
    }
    setLoading(false);
  };

  const cargarVentas = async () => {
    setLoadingVentas(true);
    const { data } = await supabase.from("ventas").select("*").order("created_at", { ascending: false });
    if (data) setVentas(data);
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

  // ── Admin: eliminar con log ──
  const solicitarEliminacion = (tipo, registro) => {
    setAdminModal({ tipo, registro });
    setAdminClave(""); setAdminError(false);
  };

  const confirmarEliminacion = async () => {
    if (adminClave !== ADMIN_CLAVE) { setAdminError(true); return; }
    const { tipo, registro } = adminModal;
    const tabla = tipo === "venta" ? "ventas" : "gastos";
    await supabase.from(tabla).delete().eq("id", registro.id);
    await supabase.from("log_eliminaciones").insert([{
      tipo, registro_id: registro.id, detalle: registro, eliminado_por: persona || "desconocido",
    }]);
    setAdminModal(null); setAdminClave("");
    setConfirmDelete(null);
    showToast("Registro eliminado — log guardado");
    if (tipo === "venta") cargarVentas(); else cargarGastos();
  };

  // ── Gastos ──
  const agregarGasto = async () => {
    if (!persona) { showToast("Selecciona quién registra"); return; }
    const insumofinal = form.insumo === "Otro" ? (form.insumoCustom || "Otro") : form.insumo;
    const proveedorFinal = form.proveedor === "__nuevo__" ? normalizarProveedor(form.proveedorCustom) : form.proveedor;
    if (!form.monto || isNaN(Number(form.monto))) { showToast("Completa el monto"); return; }
    setSaving(true);
    await supabase.from("gastos").insert([{ fecha: form.fecha, insumo: insumofinal, cantidad: form.cantidad || null, unidad: form.unidad, fondo: form.fondo, proveedor: proveedorFinal || null, monto: Number(form.monto), persona, nota: form.nota || null }]);
    showToast("✓ Gasto guardado");
    setForm({ ...form, cantidad: "", proveedor: "", proveedorCustom: "", monto: "", nota: "", insumoCustom: "" });
    cargarGastos();
    setSaving(false);
  };

  const agregarInsumo = () => {
    const n = nuevoInsumo.trim();
    if (!n || insumos.includes(n)) return;
    setInsumos([...insumos.slice(0, -1), n, "Otro"]);
    setNuevoInsumo(""); showToast(`"${n}" agregado`);
  };

  // ── Ventas ──
  const calcularCosto = (ingredientes, insumosLista) => {
    if (!ingredientes || !insumosLista) return 0;
    return ingredientes.reduce((total, ing) => {
      const ins = insumosLista.find((i) => i.nombre === ing.insumo);
      if (!ins) return total;
      if (ins.unidad === "unidad") return total + ins.precio_por_kg * (ing.gramos || 0);
      return total + (ins.precio_por_kg / 1000) * ing.gramos;
    }, 0);
  };

  const costoProducto = (nombreProducto) => {
    const receta = recetas.find((r) => r.nombre_producto === nombreProducto);
    if (!receta) return 0;
    return calcularCosto(receta.ingredientes, insumosPrecio);
  };

  const precioProducto = (prod) => metodoPago === "Pedidos Ya" ? prod.precio_py : prod.precio;

  const agregarAlCarrito = (prod) => {
    const precio = precioProducto(prod);
    const existe = carrito.findIndex((c) => c.nombre === prod.nombre && c.metodo_pago === metodoPago);
    if (existe >= 0) {
      setCarrito(carrito.map((c, i) => i === existe ? { ...c, cantidad: c.cantidad + 1, total: (c.cantidad + 1) * c.precio_unitario } : c));
    } else {
      setCarrito([...carrito, { nombre: prod.nombre, cantidad: 1, precio_unitario: precio, precio_original: precio, metodo_pago: metodoPago, total: precio, descuento: null }]);
    }
  };

  const cambiarCantidad = (idx, delta) => {
    const nuevos = carrito.map((c, i) => {
      if (i !== idx) return c;
      const nueva = c.cantidad + delta;
      if (nueva <= 0) return null;
      return { ...c, cantidad: nueva, total: nueva * c.precio_unitario };
    }).filter(Boolean);
    setCarrito(nuevos);
  };

  const aplicarDescuento = () => {
    if (!descuentoTipo) return;
    const idx = carrito.indexOf(descuentoModal);
    if (idx < 0) return;
    let nuevoPrecio = 0;
    let descInfo = null;
    if (descuentoTipo === "cortesia") {
      if (!cortesiaDueno) { showToast("Selecciona quién autoriza"); return; }
      nuevoPrecio = 0;
      descInfo = { tipo: "cortesia", autorizado_por: cortesiaDueno };
    } else if (descuentoTipo === "personal") {
      const pct = Number(descuentoPct);
      if (!pct || pct <= 0 || pct >= 100) { showToast("Ingresa un porcentaje válido"); return; }
      const costo = costoProducto(descuentoModal.nombre);
      const precioConDesc = Math.round(descuentoModal.precio_original * (1 - pct / 100));
      const margenResultante = costo > 0 ? ((precioConDesc - costo) / precioConDesc) * 100 : 100;
      if (margenResultante < 20) {
        showToast(`Margen quedaría en ${Math.round(margenResultante)}% — mínimo 20%`); return;
      }
      nuevoPrecio = precioConDesc;
      descInfo = { tipo: "personal", porcentaje: pct };
    }
    const nuevos = carrito.map((c, i) => i === idx ? { ...c, precio_unitario: nuevoPrecio, total: nuevoPrecio * c.cantidad, descuento: descInfo } : c);
    setCarrito(nuevos);
    setDescuentoModal(null); setDescuentoTipo(""); setDescuentoPct(""); setCortesiaDueno("");
    showToast("✓ Descuento aplicado");
  };

  const quitarDescuento = (idx) => {
    setCarrito(carrito.map((c, i) => i === idx ? { ...c, precio_unitario: c.precio_original, total: c.precio_original * c.cantidad, descuento: null } : c));
  };

  const totalCarrito = carrito.reduce((s, c) => s + c.total, 0);

  const registrarVenta = async () => {
    if (carrito.length === 0) { showToast("Agrega productos al pedido"); return; }
    setSavingVenta(true);
    const rows = carrito.map((c) => ({
      fecha: fechaVenta, producto: c.nombre, cantidad: c.cantidad,
      precio_unitario: c.precio_unitario, total: c.total,
      metodo_pago: c.metodo_pago, persona: persona || null,
      nota: c.descuento ? JSON.stringify(c.descuento) : null,
    }));
    const { error } = await supabase.from("ventas").insert(rows);
    if (error) showToast("Error al guardar");
    else { showToast(`✓ Venta — ${fmt(totalCarrito)}`); setCarrito([]); cargarVentas(); }
    setSavingVenta(false);
  };

  const guardarProducto = () => {
    if (!editProducto) return;
    setCategorias(categorias.map((cat) => ({
      ...cat,
      items: cat.items.map((p) => p.nombre === editProducto.nombre ? editProducto : p),
    })));
    setEditProducto(null); showToast("✓ Producto actualizado");
  };

  // ── Recetas ──
  const guardarInsumo = async () => {
    if (!formInsumo.nombre || !formInsumo.precio_por_kg) { showToast("Completa nombre y precio"); return; }
    const data = { nombre: formInsumo.nombre.trim(), precio_por_kg: Number(formInsumo.precio_por_kg), unidad: formInsumo.unidad };
    if (editInsumoId) { await supabase.from("insumos_precio").update(data).eq("id", editInsumoId); showToast("✓ Actualizado"); setEditInsumoId(null); }
    else { await supabase.from("insumos_precio").insert([data]); showToast("✓ Insumo agregado"); }
    setFormInsumo({ nombre: "", precio_por_kg: "", unidad: "kg" }); cargarRecetas();
  };

  const eliminarInsumo = async (id) => { await supabase.from("insumos_precio").delete().eq("id", id); showToast("Eliminado"); cargarRecetas(); };

  const agregarIngrediente = () => {
    if (!nuevoIngrediente.insumo || !nuevoIngrediente.gramos) return;
    setFormReceta({ ...formReceta, ingredientes: [...formReceta.ingredientes, { insumo: nuevoIngrediente.insumo, gramos: Number(nuevoIngrediente.gramos) }] });
    setNuevoIngrediente({ insumo: "", gramos: "" });
  };

  const guardarReceta = async () => {
    if (!formReceta.nombre_producto || formReceta.ingredientes.length === 0) { showToast("Agrega nombre e ingredientes"); return; }
    const data = { nombre_producto: formReceta.nombre_producto.trim(), precio_venta: Number(formReceta.precio_venta) || 0, ingredientes: formReceta.ingredientes };
    if (editRecetaId) { await supabase.from("recetas").update(data).eq("id", editRecetaId); showToast("✓ Actualizada"); setEditRecetaId(null); }
    else { await supabase.from("recetas").insert([data]); showToast("✓ Receta guardada"); }
    setFormReceta({ nombre_producto: "", precio_venta: "", ingredientes: [] }); cargarRecetas();
  };

  const actualizarPrecioVenta = async (rec, precio) => {
    await supabase.from("recetas").update({ precio_venta: Number(precio) }).eq("id", rec.id); cargarRecetas();
  };

  const margenColor = (pct) => pct >= 60 ? C.green : pct >= 40 ? C.mustard : C.red;

  // ── Cálculos resumen ──
  const mesActual = today().slice(0, 7);
  const meses = [...new Set(gastos.map((g) => g.fecha.slice(0, 7)))].sort().reverse();
  const ventasMeses = [...new Set(ventas.map((v) => v.fecha.slice(0, 7)))].sort().reverse();
  const gastosResumen = filtroResumen ? gastos.filter((g) => g.fecha.startsWith(filtroResumen)) : gastos;
  const totalGeneral = gastos.reduce((s, g) => s + g.monto, 0);
  const totalMes = gastos.filter((g) => g.fecha.startsWith(mesActual)).reduce((s, g) => s + g.monto, 0);
  const totalVentasMes = ventas.filter((v) => v.fecha.startsWith(mesActual)).reduce((s, v) => s + v.total, 0);
  const totalVentasDia = ventas.filter((v) => v.fecha === today()).reduce((s, v) => s + v.total, 0);
  const utilidadMes = totalVentasMes - totalMes;

  const gastosFiltrados = gastos.filter((g) => {
    if (filtro.mes && !g.fecha.startsWith(filtro.mes)) return false;
    if (filtro.insumo && g.insumo !== filtro.insumo) return false;
    if (filtro.persona && g.persona !== filtro.persona) return false;
    return true;
  });
  const ventasFiltradas = ventas.filter((v) => {
    if (filtroVentas.mes && !v.fecha.startsWith(filtroVentas.mes)) return false;
    if (filtroVentas.metodo && v.metodo_pago !== filtroVentas.metodo) return false;
    return true;
  });

  const porInsumo = Object.entries(gastosResumen.reduce((acc, g) => { acc[g.insumo] = (acc[g.insumo] || 0) + g.monto; return acc; }, {})).map(([n, t]) => ({ n, t })).sort((a, b) => b.t - a.t).slice(0, 10);
  const porPersona = PERSONAS.map((p) => ({ p, t: gastosResumen.filter((g) => g.persona === p).reduce((s, g) => s + g.monto, 0), c: gastosResumen.filter((g) => g.persona === p).length })).filter((x) => x.t > 0);
  const ventasPorProducto = Object.entries(ventas.filter((v) => v.fecha.startsWith(mesActual)).reduce((acc, v) => { acc[v.producto] = acc[v.producto] || { total: 0, cantidad: 0 }; acc[v.producto].total += v.total; acc[v.producto].cantidad += v.cantidad; return acc; }, {})).map(([n, d]) => ({ n, ...d })).sort((a, b) => b.total - a.total);
  const ventasPorMetodo = ["Efectivo", "Tarjeta", "Pedidos Ya"].map((m) => ({ m, t: ventas.filter((v) => v.fecha.startsWith(mesActual) && v.metodo_pago === m).reduce((s, v) => s + v.total, 0) })).filter((x) => x.t > 0);

  const S = {
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px" },
    inp: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: "8px 10px", width: "100%", fontSize: 13, boxSizing: "border-box", outline: "none" },
  };

  const exportCSV = () => {
    const header = "Fecha,Insumo,Cantidad,Unidad,Fondo,Proveedor,Monto,Persona,Nota\n";
    const rows = gastos.map((g) => [g.fecha, g.insumo, g.cantidad || "", g.unidad || "", g.fondo, g.proveedor || "", g.monto, g.persona, g.nota || ""].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gastos.csv"; a.click();
  };

  // ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: C.mustard, color: C.bg, padding: "8px 20px", borderRadius: 30, fontWeight: 700, fontSize: 13, zIndex: 999, whiteSpace: "nowrap" }}>{toast}</div>}

      {/* Modal Admin clave */}
      {adminModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 320, width: "90%" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔐 Clave de administrador</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Esta acción quedará en el log de eliminaciones.</div>
            <input type="password" placeholder="Ingresa la clave" value={adminClave} onChange={(e) => { setAdminClave(e.target.value); setAdminError(false); }} onKeyDown={(e) => e.key === "Enter" && confirmarEliminacion()} style={{ ...S.inp, fontSize: 18, letterSpacing: 6, marginBottom: 8 }} autoFocus />
            {adminError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Clave incorrecta</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setAdminModal(null); setAdminClave(""); setAdminError(false); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "10px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarEliminacion} style={{ flex: 1, background: C.red, border: "none", color: "#fff", borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar producto */}
      {editProducto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 340, width: "90%" }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>{editProducto.nombre}</div>
            <Fld label="Precio normal ($)"><input type="number" value={editProducto.precio} onChange={(e) => setEditProducto({ ...editProducto, precio: Number(e.target.value) })} style={S.inp} /></Fld>
            <div style={{ marginTop: 10 }}><Fld label="Precio Pedidos Ya ($)"><input type="number" value={editProducto.precio_py} onChange={(e) => setEditProducto({ ...editProducto, precio_py: Number(e.target.value) })} style={S.inp} /></Fld></div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditProducto(null)} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "9px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardarProducto} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal descuento */}
      {descuentoModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 340, width: "90%" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Descuento — {descuentoModal.nombre}</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Precio normal: {fmt(descuentoModal.precio_original)}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={() => setDescuentoTipo("cortesia")} style={{ flex: 1, background: descuentoTipo === "cortesia" ? C.mustard : C.tag, color: descuentoTipo === "cortesia" ? C.bg : C.muted, border: "none", borderRadius: 7, padding: "9px 0", cursor: "pointer", fontWeight: 700 }}>🎁 Cortesía</button>
              <button onClick={() => setDescuentoTipo("personal")} style={{ flex: 1, background: descuentoTipo === "personal" ? C.blue : C.tag, color: descuentoTipo === "personal" ? "#fff" : C.muted, border: "none", borderRadius: 7, padding: "9px 0", cursor: "pointer", fontWeight: 700 }}>% Personal</button>
            </div>
            {descuentoTipo === "cortesia" && (
              <div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>¿Quién autoriza?</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {["Raul", "Pepe", "Alejandro"].map((d) => (
                    <button key={d} onClick={() => setCortesiaDueno(d)} style={{ flex: 1, background: cortesiaDueno === d ? personColor(d) : C.tag, color: cortesiaDueno === d ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "7px 0", cursor: "pointer", fontWeight: cortesiaDueno === d ? 700 : 400, fontSize: 12 }}>{d}</button>
                  ))}
                </div>
              </div>
            )}
            {descuentoTipo === "personal" && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>Porcentaje de descuento (mín. margen 20%)</div>
                <input type="number" placeholder="ej: 15" value={descuentoPct} onChange={(e) => setDescuentoPct(e.target.value)} style={S.inp} />
                {descuentoPct && (() => {
                  const costo = costoProducto(descuentoModal.nombre);
                  const precioConDesc = Math.round(descuentoModal.precio_original * (1 - Number(descuentoPct) / 100));
                  const margen = costo > 0 ? Math.round(((precioConDesc - costo) / precioConDesc) * 100) : 100;
                  return <div style={{ marginTop: 6, fontSize: 12, color: margen >= 20 ? C.green : C.red }}>Precio: {fmt(precioConDesc)} · Margen: {margen}% {margen < 20 ? "⚠️ Bajo mínimo" : "✓"}</div>;
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

      {/* ── HEADER ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {view !== "home" && (
                <button onClick={() => setView("home")} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 16 }}>←</button>
              )}
              <span style={{ fontSize: 18 }}>🌭</span>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Don Abel</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {PERSONAS.map((p) => (
                <button key={p} onClick={() => setPersona(p)} style={{ background: persona === p ? personColor(p) : C.tag, color: persona === p ? C.bg : C.muted, border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: persona === p ? 700 : 400, cursor: "pointer" }}>{p}</button>
              ))}
            </div>
          </div>
          {persona && <div style={{ fontSize: 11, color: C.muted, textAlign: "right", marginTop: -6 }}>Hola, {persona}</div>}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 60px" }}>

        {/* ── HOME ── */}
        {view === "home" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { id: "ventas", emoji: "💰", label: "Ventas", sub: `Hoy ${fmt(totalVentasDia)}`, color: C.green },
                { id: "gastos", emoji: "🧾", label: "Gastos", sub: `Mes ${fmt(totalMes)}`, color: C.mustard },
                { id: "recetas", emoji: "🍽️", label: "Recetas", sub: "Costos y márgenes", color: C.purple },
                { id: "resumen", emoji: "📊", label: "Resumen", sub: `Utilidad ${fmt(utilidadMes)}`, color: utilidadMes >= 0 ? C.green : C.red },
              ].map((item) => (
                <button key={item.id} onClick={() => { setView(item.id); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 16px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = item.color}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: item.color }}>{item.label}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{item.sub}</div>
                </button>
              ))}
            </div>
            <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
              <div><div style={{ color: C.muted, fontSize: 11 }}>Ventas hoy</div><div style={{ fontWeight: 800, fontSize: 18, color: C.green }}>{fmt(totalVentasDia)}</div></div>
              <div><div style={{ color: C.muted, fontSize: 11 }}>Gastos mes</div><div style={{ fontWeight: 800, fontSize: 18, color: C.mustard }}>{fmt(totalMes)}</div></div>
              <div><div style={{ color: C.muted, fontSize: 11 }}>Utilidad</div><div style={{ fontWeight: 800, fontSize: 18, color: utilidadMes >= 0 ? C.green : C.red }}>{fmt(utilidadMes)}</div></div>
            </div>
          </div>
        )}

        {/* ── GASTOS ── */}
        {view === "gastos" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[{ id: "nuevo", label: "+ Nuevo" }, { id: "historial", label: "Historial" }].map((t) => (
                <button key={t.id} onClick={() => setGastosView(t.id)} style={{ background: gastosView === t.id ? C.mustard : C.tag, color: gastosView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontWeight: gastosView === t.id ? 700 : 400, fontSize: 13 }}>{t.label}</button>
              ))}
            </div>

            {gastosView === "nuevo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Registrar gasto</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Fld label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Monto ($)"><input type="number" placeholder="0" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Insumo" full><select value={form.insumo} onChange={(e) => setForm({ ...form, insumo: e.target.value })} style={S.inp}>{insumos.map((i) => <option key={i}>{i}</option>)}</select></Fld>
                    {form.insumo === "Otro" && <Fld label="¿Cuál?" full><input placeholder="Nombre del insumo" value={form.insumoCustom} onChange={(e) => setForm({ ...form, insumoCustom: e.target.value })} style={S.inp} /></Fld>}
                    <Fld label="Cantidad"><input type="number" placeholder="ej: 2" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Unidad"><select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} style={S.inp}>{["unidad","kg","g","litro","ml","paquete","caja","bolsa"].map((u) => <option key={u}>{u}</option>)}</select></Fld>
                    <Fld label="Fondo"><select value={form.fondo} onChange={(e) => setForm({ ...form, fondo: e.target.value })} style={S.inp}>{FONDOS.map((f) => <option key={f}>{f}</option>)}</select></Fld>
                    <Fld label="Proveedor"><select value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value, proveedorCustom: "" })} style={S.inp}><option value="">Sin proveedor</option>{proveedores.map((p) => <option key={p}>{p}</option>)}<option value="__nuevo__">+ Nuevo…</option></select></Fld>
                    {form.proveedor === "__nuevo__" && <Fld label="Nombre proveedor" full><input placeholder="ej: Jumbo" value={form.proveedorCustom} onChange={(e) => setForm({ ...form, proveedorCustom: e.target.value })} style={S.inp} /></Fld>}
                    <Fld label="Nota" full><input placeholder="opcional" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} style={S.inp} /></Fld>
                  </div>
                  <button onClick={agregarGasto} disabled={saving} style={{ marginTop: 14, background: persona ? C.mustard : C.border, color: persona ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: persona ? "pointer" : "default", width: "100%" }}>
                    {saving ? "Guardando..." : persona ? `Guardar — ${persona}` : "Selecciona quién registra arriba"}
                  </button>
                </div>
                <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}><div style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Agregar insumo a la lista</div><input placeholder="ej: Mermelada" value={nuevoInsumo} onChange={(e) => setNuevoInsumo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregarInsumo()} style={S.inp} /></div>
                  <button onClick={agregarInsumo} style={{ background: C.tag, border: `1px solid ${C.border}`, color: C.mustard, borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
                </div>
              </div>
            )}

            {gastosView === "historial" && (
              <div>
                <div style={{ ...S.card, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select value={filtro.mes} onChange={(e) => setFiltro({ ...filtro, mes: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 110 }}><option value="">Todos los meses</option>{meses.map((m) => <option key={m}>{m}</option>)}</select>
                  <select value={filtro.insumo} onChange={(e) => setFiltro({ ...filtro, insumo: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 120 }}><option value="">Todos los insumos</option>{insumos.map((i) => <option key={i}>{i}</option>)}</select>
                  <select value={filtro.persona} onChange={(e) => setFiltro({ ...filtro, persona: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 100 }}><option value="">Todos</option>{PERSONAS.map((p) => <option key={p}>{p}</option>)}</select>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: C.muted, fontSize: 12 }}>
                  <span>{gastosFiltrados.length} registros</span>
                  <span style={{ color: C.mustard, fontWeight: 700 }}>{fmt(gastosFiltrados.reduce((s, g) => s + g.monto, 0))}</span>
                </div>
                {loading && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>Cargando...</div>}
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
                        {g.proveedor && <Tag text={normalizarProveedor(g.proveedor)} color="#2A3530" textColor={C.green} />}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: C.mustard }}>{fmt(g.monto)}</div>
                      <button onClick={() => solicitarEliminacion("gasto", g)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4 }}>eliminar</button>
                    </div>
                  </div>
                ))}
                <button onClick={exportCSV} style={{ marginTop: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "9px 0", cursor: "pointer", fontSize: 13, width: "100%" }}>Exportar CSV</button>
              </div>
            )}
          </div>
        )}

        {/* ── VENTAS ── */}
        {view === "ventas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[{ id: "registrar", label: "🧾 Registrar" }, { id: "dashboard", label: "📊 Dashboard" }, { id: "historial", label: "📋 Historial" }, { id: "productos", label: "🏷️ Productos" }].map((t) => (
                <button key={t.id} onClick={() => setVentaView(t.id)} style={{ background: ventaView === t.id ? C.mustard : C.tag, color: ventaView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: ventaView === t.id ? 700 : 400, fontSize: 12 }}>{t.label}</button>
              ))}
            </div>

            {/* Registrar */}
            {ventaView === "registrar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Fld label="Fecha"><input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} style={S.inp} /></Fld>
                  <Fld label="Método de pago">
                    <div style={{ display: "flex", gap: 5 }}>
                      {["Efectivo", "Tarjeta", "Pedidos Ya"].map((m) => (
                        <button key={m} onClick={() => setMetodoPago(m)} style={{ flex: 1, background: metodoPago === m ? (metodoPagoColors[m]) : C.tag, color: metodoPago === m ? "#fff" : C.muted, border: "none", borderRadius: 6, padding: "7px 2px", cursor: "pointer", fontWeight: metodoPago === m ? 700 : 400, fontSize: 10 }}>{m}</button>
                      ))}
                    </div>
                  </Fld>
                </div>

                {/* Categorías */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                  {categorias.map((cat) => (
                    <button key={cat.id} onClick={() => setCatActiva(cat.id)} style={{ background: catActiva === cat.id ? C.mustard : C.tag, color: catActiva === cat.id ? C.bg : C.muted, border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontWeight: catActiva === cat.id ? 700 : 400, fontSize: 12, whiteSpace: "nowrap" }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>

                {/* Productos de la categoría activa */}
                <div style={S.card}>
                  {metodoPago === "Pedidos Ya" && <div style={{ color: C.orange, fontSize: 11, marginBottom: 10 }}>· Precios Pedidos Ya (+30%)</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {categorias.find((c) => c.id === catActiva)?.items.map((prod) => (
                      <button key={prod.nombre} onClick={() => agregarAlCarrito(prod)}
                        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 10px", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = C.mustard}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: C.text, marginBottom: 3, lineHeight: 1.3 }}>{prod.nombre}</div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: metodoPago === "Pedidos Ya" ? C.orange : C.mustard }}>{fmt(metodoPago === "Pedidos Ya" ? prod.precio_py : prod.precio)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Carrito */}
                {carrito.length > 0 && (
                  <div style={S.card}>
                    <STitle>Pedido actual</STitle>
                    {carrito.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nombre}</div>
                          <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <Tag text={c.metodo_pago} color={(metodoPagoColors[c.metodo_pago] || C.muted) + "33"} textColor={metodoPagoColors[c.metodo_pago] || C.muted} />
                            {c.descuento && <Tag text={c.descuento.tipo === "cortesia" ? `🎁 ${c.descuento.autorizado_por}` : `${c.descuento.porcentaje}% off`} color={C.green + "33"} textColor={C.green} />}
                            {c.descuento && <button onClick={() => quitarDescuento(i)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 10, padding: 0 }}>quitar</button>}
                            {!c.descuento && <button onClick={() => setDescuentoModal(c)} style={{ background: "none", border: "none", color: C.mustard, cursor: "pointer", fontSize: 10, padding: 0 }}>+ descuento</button>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button onClick={() => cambiarCantidad(i, -1)} style={{ background: C.tag, border: "none", color: C.text, borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontWeight: 700 }}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{c.cantidad}</span>
                          <button onClick={() => cambiarCantidad(i, 1)} style={{ background: C.tag, border: "none", color: C.text, borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontWeight: 700 }}>+</button>
                          <span style={{ fontWeight: 700, color: c.descuento ? C.green : C.mustard, minWidth: 56, textAlign: "right" }}>{fmt(c.total)}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

            {/* Dashboard */}
            {ventaView === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <StatCard label="Ventas hoy" value={fmt(totalVentasDia)} color={C.green} />
                  <StatCard label="Ventas este mes" value={fmt(totalVentasMes)} color={C.mustard} />
                  <StatCard label="Gastos este mes" value={fmt(totalMes)} color={C.red} />
                  <StatCard label="Utilidad del mes" value={fmt(utilidadMes)} color={utilidadMes >= 0 ? C.green : C.red} />
                </div>
                <div style={S.card}>
                  <STitle>Por producto — {mesActual}</STitle>
                  {ventasPorProducto.length === 0 && <Empty />}
                  {ventasPorProducto.slice(0, 8).map((x) => (
                    <div key={x.n} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span>{x.n} <span style={{ color: C.muted, fontSize: 11 }}>({x.cantidad})</span></span>
                        <span style={{ fontWeight: 700, color: C.green }}>{fmt(x.total)}</span>
                      </div>
                      <Bar value={x.total} max={ventasPorProducto[0]?.total || 1} color={C.green} />
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <STitle>Por método de pago</STitle>
                  {ventasPorMetodo.map((x) => (
                    <div key={x.m} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: metodoPagoColors[x.m], display: "inline-block" }} />{x.m}</span>
                        <span style={{ fontWeight: 700, color: metodoPagoColors[x.m] }}>{fmt(x.t)}</span>
                      </div>
                      <Bar value={x.t} max={Math.max(...ventasPorMetodo.map((v) => v.t)) || 1} color={metodoPagoColors[x.m]} />
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <STitle>Resumen financiero — {mesActual}</STitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Ventas</span><span style={{ fontWeight: 700, color: C.green }}>{fmt(totalVentasMes)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>Gastos</span><span style={{ fontWeight: 700, color: C.red }}>{fmt(totalMes)}</span></div>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700 }}>Utilidad neta</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: utilidadMes >= 0 ? C.green : C.red }}>{fmt(utilidadMes)}</span>
                    </div>
                    {totalVentasMes > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: C.muted }}>Margen neto</span><span style={{ fontWeight: 700, color: utilidadMes >= 0 ? C.green : C.red }}>{Math.round((utilidadMes / totalVentasMes) * 100)}%</span></div>}
                  </div>
                </div>
              </div>
            )}

            {/* Historial ventas */}
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
                {loadingVentas && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>Cargando...</div>}
                {ventasFiltradas.map((v) => (
                  <div key={v.id} style={{ ...S.card, marginBottom: 8, display: "flex", gap: 10 }}>
                    <div style={{ width: 3, borderRadius: 3, background: metodoPagoColors[v.metodo_pago] || C.muted, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{v.producto}</div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span>{v.fecha}</span><span>{v.cantidad} und · {fmt(v.precio_unitario)} c/u</span>
                        <Tag text={v.metodo_pago} color={(metodoPagoColors[v.metodo_pago] || C.muted) + "33"} textColor={metodoPagoColors[v.metodo_pago] || C.muted} />
                        {v.nota && (() => { try { const d = JSON.parse(v.nota); return <Tag text={d.tipo === "cortesia" ? `🎁 ${d.autorizado_por}` : `${d.porcentaje}% off`} color={C.green + "33"} textColor={C.green} />; } catch { return null; } })()}
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

            {/* Productos */}
            {ventaView === "productos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {categorias.map((cat) => (
                  <div key={cat.id} style={S.card}>
                    <STitle>{cat.emoji} {cat.label}</STitle>
                    {cat.items.map((prod) => (
                      <div key={prod.nombre} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{prod.nombre}</div>
                          <div style={{ fontSize: 12 }}><span style={{ color: C.mustard, fontWeight: 700 }}>{fmt(prod.precio)}</span><span style={{ color: C.muted, marginLeft: 8 }}>PY: <span style={{ color: C.orange }}>{fmt(prod.precio_py)}</span></span></div>
                        </div>
                        <button onClick={() => setEditProducto({ ...prod })} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                      </div>
                    ))}
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
              {[{ id: "calcular", label: "📊 Márgenes" }, { id: "insumos", label: "🛒 Insumos" }, { id: "recetas", label: "📝 Recetas" }].map((t) => (
                <button key={t.id} onClick={() => setRecetaView(t.id)} style={{ background: recetaView === t.id ? C.mustard : C.tag, color: recetaView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: recetaView === t.id ? 700 : 400, fontSize: 12 }}>{t.label}</button>
              ))}
            </div>
            {loadingRecetas && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>Cargando...</div>}

            {/* Márgenes */}
            {!loadingRecetas && recetaView === "calcular" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recetas.map((rec) => {
                  const costo = calcularCosto(rec.ingredientes, insumosPrecio);
                  const venta = preciosVenta[rec.id] !== undefined ? preciosVenta[rec.id] : rec.precio_venta;
                  const margen = venta - costo;
                  const margenPct = venta > 0 ? (margen / venta) * 100 : 0;
                  return (
                    <div key={rec.id} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontWeight: 700 }}>{rec.nombre_producto}</div>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: C.muted }}>Costo</div><div style={{ fontWeight: 700, color: C.red }}>{fmt(Math.round(costo))}</div></div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                        {rec.ingredientes.map((ing, i) => {
                          const ins = insumosPrecio.find((x) => x.nombre === ing.insumo);
                          return <span key={i} style={{ background: C.tag, borderRadius: 4, padding: "2px 7px", fontSize: 10, color: C.muted }}>{ing.insumo} <span style={{ color: C.text }}>{ins?.unidad === "unidad" ? `${ing.gramos}u` : `${ing.gramos}g`}</span></span>;
                        })}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Precio venta ($)</div>
                          <input type="number" value={preciosVenta[rec.id] !== undefined ? preciosVenta[rec.id] : rec.precio_venta} onChange={(e) => setPreciosVenta({ ...preciosVenta, [rec.id]: e.target.value })} onBlur={(e) => { actualizarPrecioVenta(rec, e.target.value); setPreciosVenta({ ...preciosVenta, [rec.id]: undefined }); }} style={{ ...S.inp, fontWeight: 700 }} />
                        </div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Ganancia</div><div style={{ fontWeight: 700, fontSize: 16, color: margen >= 0 ? C.green : C.red }}>{fmt(Math.round(margen))}</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Margen</div><div style={{ fontWeight: 800, fontSize: 20, color: margenColor(margenPct) }}>{Math.round(margenPct)}%</div></div>
                      </div>
                      <div style={{ marginTop: 8, background: C.border, borderRadius: 4, height: 7 }}>
                        <div style={{ background: margenColor(margenPct), width: `${Math.min(100, Math.max(0, margenPct))}%`, height: "100%", borderRadius: 4 }} />
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
                    <Fld label="Nombre"><input placeholder="ej: Vienesa" value={formInsumo.nombre} onChange={(e) => setFormInsumo({ ...formInsumo, nombre: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Precio / kg ($)"><input type="number" value={formInsumo.precio_por_kg} onChange={(e) => setFormInsumo({ ...formInsumo, precio_por_kg: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Unidad"><select value={formInsumo.unidad} onChange={(e) => setFormInsumo({ ...formInsumo, unidad: e.target.value })} style={S.inp}>{["kg","litro","unidad"].map((u) => <option key={u}>{u}</option>)}</select></Fld>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={guardarInsumo} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>{editInsumoId ? "Actualizar" : "Agregar"}</button>
                    {editInsumoId && <button onClick={() => { setEditInsumoId(null); setFormInsumo({ nombre: "", precio_por_kg: "", unidad: "kg" }); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "9px 16px", cursor: "pointer" }}>Cancelar</button>}
                  </div>
                </div>
                {insumosPrecio.map((ins) => (
                  <div key={ins.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{ins.nombre}</div><div style={{ color: C.muted, fontSize: 12 }}>{fmt(ins.precio_por_kg)} / {ins.unidad}</div></div>
                    <button onClick={() => { setFormInsumo({ nombre: ins.nombre, precio_por_kg: ins.precio_por_kg, unidad: ins.unidad }); setEditInsumoId(ins.id); }} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>Editar</button>
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
                    <Fld label="Nombre"><input placeholder="ej: Italiano" value={formReceta.nombre_producto} onChange={(e) => setFormReceta({ ...formReceta, nombre_producto: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Precio venta ($)"><input type="number" value={formReceta.precio_venta} onChange={(e) => setFormReceta({ ...formReceta, precio_venta: e.target.value })} style={S.inp} /></Fld>
                  </div>
                  {formReceta.ingredientes.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      {formReceta.ingredientes.map((ing, i) => {
                        const ins = insumosPrecio.find((x) => x.nombre === ing.insumo);
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: 6, padding: "5px 10px", marginBottom: 5 }}>
                            <span style={{ fontSize: 13 }}>{ing.insumo}</span>
                            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ color: C.mustard, fontWeight: 600 }}>{ins?.unidad === "unidad" ? `${ing.gramos} und` : `${ing.gramos}g`}</span>
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
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, marginBottom: 10 }}>
                        <select value={nuevoIngrediente.insumo} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, insumo: e.target.value, gramos: "" })} style={S.inp}><option value="">Selecciona insumo…</option>{insumosPrecio.map((i) => <option key={i.id} value={i.nombre}>{i.nombre}</option>)}</select>
                        <input type="number" placeholder={ins?.unidad === "unidad" ? "unidades" : "gramos"} value={nuevoIngrediente.gramos} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, gramos: e.target.value })} style={S.inp} />
                        <button onClick={agregarIngrediente} style={{ background: C.tag, border: `1px solid ${C.border}`, color: C.mustard, borderRadius: 7, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
                      </div>
                    );
                  })()}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={guardarReceta} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>{editRecetaId ? "Actualizar" : "Guardar receta"}</button>
                    {editRecetaId && <button onClick={() => { setEditRecetaId(null); setFormReceta({ nombre_producto: "", precio_venta: "", ingredientes: [] }); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "9px 16px", cursor: "pointer" }}>Cancelar</button>}
                  </div>
                </div>
                {recetas.map((rec) => {
                  const costo = calcularCosto(rec.ingredientes, insumosPrecio);
                  return (
                    <div key={rec.id} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{rec.nombre_producto}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { setFormReceta({ nombre_producto: rec.nombre_producto, precio_venta: rec.precio_venta, ingredientes: rec.ingredientes }); setEditRecetaId(rec.id); }} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                          <button onClick={() => solicitarEliminacion("receta", rec)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 14, fontSize: 13 }}>
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

        {/* ── RESUMEN ── */}
        {view === "resumen" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>Filtrar mes:</div>
                <select value={filtroResumen} onChange={(e) => setFiltroResumen(e.target.value)} style={S.inp}><option value="">Todo el historial</option>{meses.map((m) => <option key={m}>{m}</option>)}</select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatCard label="Ventas este mes" value={fmt(totalVentasMes)} color={C.green} />
              <StatCard label="Gastos este mes" value={fmt(totalMes)} color={C.mustard} />
              <StatCard label="Utilidad" value={fmt(utilidadMes)} color={utilidadMes >= 0 ? C.green : C.red} />
              <StatCard label="Total gastos" value={fmt(totalGeneral)} color={C.muted} />
            </div>
            <div style={S.card}>
              <STitle>Gastos por persona</STitle>
              {porPersona.length === 0 && <Empty />}
              {porPersona.map((x) => (
                <div key={x.p} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: personColor(x.p), display: "inline-block" }} />{x.p} <span style={{ color: C.muted, fontSize: 11 }}>({x.c})</span></span>
                    <span style={{ fontWeight: 700, color: personColor(x.p) }}>{fmt(x.t)}</span>
                  </div>
                  <Bar value={x.t} max={Math.max(...porPersona.map((p) => p.t))} color={personColor(x.p)} />
                </div>
              ))}
            </div>
            <div style={S.card}>
              <STitle>Gastos por insumo</STitle>
              {porInsumo.map((x) => (
                <div key={x.n} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{x.n}</span><span style={{ fontWeight: 700 }}>{fmt(x.t)}</span></div>
                  <Bar value={x.t} max={porInsumo[0]?.t || 1} color={C.mustard} />
                </div>
              ))}
            </div>
            <div style={S.card}>
              <STitle>Ventas por producto — {mesActual}</STitle>
              {ventasPorProducto.slice(0, 8).map((x) => (
                <div key={x.n} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{x.n} <span style={{ color: C.muted, fontSize: 11 }}>({x.cantidad})</span></span><span style={{ fontWeight: 700, color: C.green }}>{fmt(x.total)}</span></div>
                  <Bar value={x.total} max={ventasPorProducto[0]?.total || 1} color={C.green} />
                </div>
              ))}
            </div>
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
  return <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "#F2EEF8" }}>{children}</div>;
}
function Empty() {
  return <div style={{ color: "#8A8496", fontSize: 12 }}>Sin datos aún</div>;
}
