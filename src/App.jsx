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
const personColor = (n) => ({ Raul: "#6B9FD4", Pepe: "#E8B84B", Alejandro: "#5BAD7F", Gustavo: "#C97DDB" }[n] || C.muted);
const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-CL");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const normProv = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const UNIDAD_DEFAULT_INSUMO = {
  "Salchichas": "unidad", "Chicken Fingers": "unidad", "Churrascos": "unidad",
  "Pan para completo": "unidad", "Pan Castaño Brioche para Sandwich": "unidad",
  "Queso cheddar": "unidad", "Nuggets": "unidad", "Nuggets pollo": "unidad",
  "Palta": "kg", "Tomate": "kg", "Tocino": "kg", "Papas fritas": "kg",
  "Mayonesa": "kg", "Mayonesa Casera": "kg", "Mostaza": "kg", "Ketchup": "kg",
  "Chucrut": "kg", "Pepinillo": "kg", "Cebolla": "kg", "Aceite para Freir": "litro",
};

// Mapa de equivalencias: nombre en gastos -> nombre en insumos_precio
const MERMA_INSUMOS = { "Palta": 0.30 }; // 30% merma

const MAPA_INSUMOS = {
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
const CATEGORIAS = [
  { id: "completos", label: "Completos", emoji: "🌭" },
  { id: "pollo", label: "Pollo", emoji: "🍗" },
  { id: "churrasco", label: "Churrasco", emoji: "🥩" },
  { id: "papas", label: "Papas", emoji: "🍟" },
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

const RECETAS_EJEMPLO = [
  { nombre_producto: "Italiano", categoria: "completos", precio_venta: 4100, precio_py: 5535, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Palta", gramos: 40 },{ insumo: "Tomate", gramos: 30 },{ insumo: "Mayonesa casera", gramos: 25 }] },
  { nombre_producto: "Highway to Hell", categoria: "completos", precio_venta: 4600, precio_py: 6210, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Cebolla caramelizada", gramos: 40 },{ insumo: "Pepinillos", gramos: 20 },{ insumo: "Tocino", gramos: 30 }] },
  { nombre_producto: "Torn and Frayed", categoria: "completos", precio_venta: 4600, precio_py: 6210, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Cebolla caramelizada", gramos: 40 },{ insumo: "Papas hilo", gramos: 20 }] },
  { nombre_producto: "Purple Haze", categoria: "completos", precio_venta: 4600, precio_py: 6210, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Chucrut morado", gramos: 30 },{ insumo: "Pepinillos", gramos: 20 },{ insumo: "Tocino", gramos: 30 }] },
  { nombre_producto: "Dinámico", categoria: "completos", precio_venta: 4900, precio_py: 6615, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Palta", gramos: 40 },{ insumo: "Tomate", gramos: 30 },{ insumo: "Chucrut", gramos: 20 },{ insumo: "Salsa americana", gramos: 15 },{ insumo: "Mayonesa casera", gramos: 20 }] },
  { nombre_producto: "Paradise City", categoria: "completos", precio_venta: 4900, precio_py: 6615, ingredientes: [{ insumo: "Pan para completo", gramos: 80 },{ insumo: "Vienesa", gramos: 80 },{ insumo: "Palta", gramos: 40 },{ insumo: "Tomate", gramos: 30 },{ insumo: "Cebolla caramelizada", gramos: 30 },{ insumo: "Tocino", gramos: 30 },{ insumo: "Ají", gramos: 10 }] },
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
  const [view, setView] = useState("home");
  const [persona, setPersona] = useState("");

  // Gastos
  const [gastos, setGastos] = useState([]);
  const [insumos, setInsumos] = useState(INSUMOS_BASE);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gastosView, setGastosView] = useState("nuevo");
  const [form, setForm] = useState({ fecha: today(), insumo: INSUMOS_BASE[0], insumoCustom: "", cantidad: "", unidad: "unidad", fondo: FONDOS[0], proveedor: "", proveedorCustom: "", monto: "", nota: "" });
  const [filtro, setFiltro] = useState({ mes: "", insumo: "", persona: "" });

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
  const [descuentoModal, setDescuentoModal] = useState(null);
  const [descuentoTipo, setDescuentoTipo] = useState("");
  const [descuentoPct, setDescuentoPct] = useState("");
  const [cortesiaDueno, setCortesiaDueno] = useState("");
  const [dashPeriodo, setDashPeriodo] = useState("mes");

  // Recetas
  const [insumosPrecio, setInsumosPrecio] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [recetaView, setRecetaView] = useState("margenes");
  const [recetaCatActiva, setRecetaCatActiva] = useState("completos");
  const [precioVentaEdit, setPrecioVentaEdit] = useState({}); // { recetaId: valor }
  const [confirmarPrecioModal, setConfirmarPrecioModal] = useState(null);
  const [formInsumo, setFormInsumo] = useState({ nombre: "", precio_por_kg: "", unidad: "kg" });
  const [editInsumoId, setEditInsumoId] = useState(null);
  const [formReceta, setFormReceta] = useState({ nombre_producto: "", categoria: "completos", precio_venta: "", precio_py: "", descripcion_menu: "", ingredientes: [], productos_combo: [] });
  const [editRecetaId, setEditRecetaId] = useState(null);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({ insumo: "", gramos: "" });
  const [nuevoProductoCombo, setNuevoProductoCombo] = useState("");
  const [editGramos, setEditGramos] = useState({});
  const [porcentajePY, setPorcentajePY] = useState(35);

  // Resumen
  const [filtroResumen, setFiltroResumen] = useState("");
  const [stockData, setStockData] = useState([]);
  const [modalActualizarPrecio, setModalActualizarPrecio] = useState(null);

  // Admin
  const ADMIN_CLAVE = "1232026";
  const [adminModal, setAdminModal] = useState(null);
  const [adminClave, setAdminClave] = useState("");
  const [adminError, setAdminError] = useState(false);

  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (view === "gastos") { cargarGastos(); cargarVentas(); if (recetas.length === 0) cargarRecetas(); }
    if (view === "ventas") { cargarVentas(); cargarGastos(); if (recetas.length === 0) cargarRecetas(); }
    if (view === "resumen") { cargarGastos(); cargarVentas(); }
    if (view === "recetas") { cargarRecetas(); cargarConfig(); }
  }, [view]);

  const cargarGastos = async () => {
    setLoading(true);
    const { data } = await supabase.from("gastos").select("*").order("created_at", { ascending: false });
    if (data) { setGastos(data); setProveedores([...new Set(data.map((g) => normProv(g.proveedor)).filter(Boolean))].sort()); }
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

  const cargarConfig = async () => {
    const { data } = await supabase.from("config").select("*").eq("id", "general").single();
    if (data) setPorcentajePY(data.porcentaje_py || 35);
  };

  const calcularStock = (gastosData, ventasData, recetasData, insumosData) => {
    // 1. Sumar compras por insumo (en gramos/unidades)
    const compras = {};
    gastosData.forEach((g) => {
      const insumoRef = resolverInsumo(g.insumo);
      if (!insumoRef) return;
      if (!compras[insumoRef]) compras[insumoRef] = 0;
      compras[insumoRef] += aGramos(g.cantidad, g.unidad);
    });

    // 2. Sumar consumo por insumo según ventas x recetas
    const consumo = {};
    ventasData.forEach((v) => {
      const rec = recetasData.find((r) => r.nombre_producto === v.producto);
      if (!rec || !rec.ingredientes) return;
      rec.ingredientes.forEach((ing) => {
        const ins = insumosData.find((i) => i.nombre === ing.insumo);
        if (!ins) return;
        if (!consumo[ing.insumo]) consumo[ing.insumo] = 0;
        const cantIngrediente = ins.unidad === "unidad" ? ing.gramos : ing.gramos;
        consumo[ing.insumo] += cantIngrediente * v.cantidad;
      });
    });

    // 3. Calcular stock disponible
    const insumosMapeados = Object.keys(MAPA_INSUMOS).map((k) => MAPA_INSUMOS[k]);
    const insumosUnicos = [...new Set(Object.values(MAPA_INSUMOS))];
    return insumosUnicos.map((nombre) => {
      const ins = insumosData.find((i) => i.nombre === nombre);
      const comprado = compras[nombre] || 0;
      const consumido = consumo[nombre] || 0;
      const disponible = comprado - consumido;
      const unidad = ins?.unidad || "unidad";
      // Convertir disponible a unidad legible
      const esKgLitro = unidad === "kg" || unidad === "litro";
      const disponibleKg = esKgLitro ? disponible / 1000 : disponible;
      const alerta = esKgLitro
        ? disponible < 500 ? "rojo" : disponible < 1000 ? "naranja" : "verde"
        : disponible < 5 ? "rojo" : disponible < 10 ? "naranja" : "verde";
      return { nombre, comprado, consumido, disponible, disponibleKg, unidad, alerta, ins };
    }).filter((x) => x.comprado > 0 || x.consumido > 0).sort((a, b) => {
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
    await supabase.from(tabla).delete().eq("id", registro.id);
    if (tipo !== "receta" && tipo !== "insumo") {
      await supabase.from("log_eliminaciones").insert([{ tipo, registro_id: registro.id, detalle: registro, eliminado_por: persona || "desconocido" }]);
    }
    setAdminModal(null); setAdminClave("");
    showToast("Eliminado");
    if (tipo === "venta") cargarVentas();
    else if (tipo === "receta" || tipo === "insumo") { setRecetas([]); setInsumosPrecio([]); cargarRecetas(); }
    else cargarGastos();
  };

  // Precio normal con clave
  const solicitarCambioPrecio = (rec, valor) => { setConfirmarPrecioModal({ rec, valor }); setAdminClave(""); setAdminError(false); };
  const confirmarCambioPrecio = async () => {
    if (adminClave !== ADMIN_CLAVE) { setAdminError(true); return; }
    const { rec, valor } = confirmarPrecioModal;
    await supabase.from("recetas").update({ precio_venta: Number(valor) }).eq("id", rec.id);
    setPrecioVentaEdit((p) => { const n = { ...p }; delete n[rec.id]; return n; });
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
    const insumofinal = form.insumo === "Otro" ? (form.insumoCustom || "Otro") : form.insumo;
    const provFinal = form.proveedor === "__nuevo__" ? normProv(form.proveedorCustom) : form.proveedor;
    if (!form.monto || isNaN(Number(form.monto))) { setForm({ ...form, _errorMonto: true }); showToast("Completa el monto"); return; }
    if (!form.cantidad || isNaN(Number(form.cantidad)) || Number(form.cantidad) <= 0) { setForm({ ...form, _errorCantidad: true }); showToast("Completa la cantidad"); return; }
    setSaving(true);
    await supabase.from("gastos").insert([{ fecha: form.fecha, insumo: insumofinal, cantidad: form.cantidad || null, unidad: form.unidad, fondo: form.fondo, proveedor: provFinal || null, monto: Number(form.monto), persona, nota: form.nota || null }]);
    showToast("✓ Gasto guardado");
    setForm({ ...form, cantidad: "", proveedor: "", proveedorCustom: "", monto: "", montoDisplay: "", nota: "", insumoCustom: "", _errorMonto: false, _errorCantidad: false });
    cargarGastos(); setSaving(false);
    // Verificar si hay diferencia de precio con insumos
    const insumoRef = resolverInsumo(insumofinal);
    const cantidad = Number(form.cantidad);
    const monto = Number(form.monto);
    if (insumoRef && cantidad > 0 && monto > 0) {
      const ins = insumosPrecio.find((i) => i.nombre === insumoRef);
      if (ins) {
        const merma = MERMA_INSUMOS[insumoRef] || 0;
        const cantidadAprovechable = merma > 0 ? cantidad * (1 - merma) : cantidad;
        const precioNuevo = Math.round(monto / cantidadAprovechable);
        if (Math.abs(precioNuevo - ins.precio_por_kg) > 5) {
          setModalActualizarPrecio({ insumoRef, ins, precioActual: ins.precio_por_kg, precioNuevo, cantidad, cantidadAprovechable, merma });
        }
      }
    }
  };

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
    const idx = carrito.findIndex((c) => c.nombre === nombre && c.metodo_pago === metodoPago && !c.descuento && c.combo === comboNombre);
    if (idx >= 0) {
      setCarrito(carrito.map((c, i) => i === idx ? { ...c, cantidad: c.cantidad + 1, total: (c.cantidad + 1) * c.precio_unitario } : c));
    } else {
      setCarrito([...carrito, { nombre, cantidad: 1, precio_unitario: precio, precio_original: precio, metodo_pago: metodoPago, total: precio, descuento: null, receta_nombre: rec.nombre_producto, combo: comboNombre }]);
    }
  };

  const agregarCombo = (comboRec) => {
    const productos = comboRec.productos_combo || [];
    if (productos.length === 0) { showToast("Este combo no tiene productos definidos"); return; }
    const precioCombo = precioProducto(comboRec);
    const sumaNormal = productos.reduce((s, p) => { const r = recetas.find((r) => r.nombre_producto === p); return s + (r ? r.precio_venta : 0); }, 0);
    productos.forEach((nombreProd) => {
      const r = recetas.find((r) => r.nombre_producto === nombreProd);
      if (!r) return;
      const precioProp = sumaNormal > 0 ? Math.round((r.precio_venta / sumaNormal) * precioCombo) : 0;
      agregarAlCarrito(r, { nombre: nombreProd, precio: precioProp, combo: comboRec.nombre_producto });
    });
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
    setSavingVenta(true);
    const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const rows = carrito.map((c) => ({
      fecha: fechaVenta, hora,
      producto: c.nombre, cantidad: c.cantidad,
      precio_unitario: c.precio_unitario, total: c.total,
      metodo_pago: c.metodo_pago, persona: persona || null,
      nota: JSON.stringify({ ...(c.descuento || {}), ...(c.combo ? { combo: c.combo } : {}) }) || null,
    }));
    const { error } = await supabase.from("ventas").insert(rows);
    if (error) showToast("Error al guardar");
    else { showToast(`✓ Venta — ${fmt(totalCarrito)}`); setCarrito([]); cargarVentas(); }
    setSavingVenta(false);
  };

  const guardarInsumo = async () => {
    if (!formInsumo.nombre || !formInsumo.precio_por_kg) { showToast("Completa nombre y precio"); return; }
    const data = { nombre: formInsumo.nombre.trim(), precio_por_kg: Number(formInsumo.precio_por_kg), unidad: formInsumo.unidad };
    if (editInsumoId) { await supabase.from("insumos_precio").update(data).eq("id", editInsumoId); showToast("✓ Actualizado"); setEditInsumoId(null); }
    else { await supabase.from("insumos_precio").insert([data]); showToast("✓ Agregado"); }
    setFormInsumo({ nombre: "", precio_por_kg: "", unidad: "kg" }); cargarRecetas();
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

  const margenColor = (pct) => pct >= 60 ? C.green : pct >= 40 ? C.mustard : C.red;

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

  const porPersonaGastos = PERSONAS.map((p) => ({ p, t: gastosResumen.filter((g) => g.persona === p).reduce((s, g) => s + g.monto, 0), c: gastosResumen.filter((g) => g.persona === p).length })).filter((x) => x.t > 0);
  const porInsumo = Object.entries(gastosResumen.reduce((acc, g) => { acc[g.insumo] = (acc[g.insumo] || 0) + g.monto; return acc; }, {})).map(([n, t]) => ({ n, t })).sort((a, b) => b.t - a.t).slice(0, 10);

  const ventasMesActual = ventas.filter((v) => v.fecha.startsWith(mesActual));
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

      {confirmarPrecioModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 320, width: "90%" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔐 Confirmar cambio de precio</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>{confirmarPrecioModal.rec.nombre_producto}</div>
            <div style={{ color: C.mustard, fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Nuevo precio: {fmt(confirmarPrecioModal.valor)}</div>
            <input type="password" placeholder="Clave" value={adminClave} onChange={(e) => { setAdminClave(e.target.value); setAdminError(false); }} onKeyDown={(e) => e.key === "Enter" && confirmarCambioPrecio()} style={{ ...S.inp, fontSize: 18, letterSpacing: 6, marginBottom: 8 }} autoFocus />
            {adminError && <div style={{ color: C.red, fontSize: 12, marginBottom: 8 }}>Clave incorrecta</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setConfirmarPrecioModal(null); setAdminClave(""); setPrecioVentaEdit((p) => { const n={...p}; delete n[confirmarPrecioModal.rec.id]; return n; }); }} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "10px 0", cursor: "pointer" }}>Descartar</button>
              <button onClick={confirmarCambioPrecio} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700 }}>Confirmar</button>
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
                { id: "resumen", emoji: "📊", label: "Resumen", sub: `Utilidad ${fmt(utilidadMes)}`, color: utilidadMes >= 0 ? C.green : C.red },
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
            <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
              <div><div style={{ color: C.muted, fontSize: 10 }}>Ventas hoy</div><div style={{ fontWeight: 800, fontSize: 17, color: C.green }}>{fmt(totalVentasDia)}</div></div>
              <div><div style={{ color: C.muted, fontSize: 10 }}>Gastos mes</div><div style={{ fontWeight: 800, fontSize: 17, color: C.mustard }}>{fmt(totalMes)}</div></div>
              <div><div style={{ color: C.muted, fontSize: 10 }}>Utilidad</div><div style={{ fontWeight: 800, fontSize: 17, color: utilidadMes >= 0 ? C.green : C.red }}>{fmt(utilidadMes)}</div></div>
            </div>
          </div>
        )}

        {view === "gastos" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[{ id: "nuevo", label: "+ Nuevo" }, { id: "historial", label: "Historial" }, { id: "stock", label: "📦 Stock" }].map((t) => (
                <button key={t.id} onClick={() => setGastosView(t.id)} style={{ background: gastosView === t.id ? C.mustard : C.tag, color: gastosView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontWeight: gastosView === t.id ? 700 : 400, fontSize: 13 }}>{t.label}</button>
              ))}
            </div>
            {gastosView === "nuevo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Registrar gasto</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Fld label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} style={S.inp} /></Fld>
                    <Fld label="Total que pagaste por este insumo ($)" full>
                      <input type="text" inputMode="numeric" placeholder="ej: 12.790" value={form.montoDisplay || ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                          const display = raw ? Number(raw).toLocaleString("es-CL") : "";
                          setForm({ ...form, monto: raw, montoDisplay: display });
                        }}
                        style={{ ...S.inp, borderColor: form._errorMonto ? C.red : C.border }} />
                      {form._errorMonto && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>Ingresa el monto</div>}
                    </Fld>
                    <Fld label="Insumo" full><select value={form.insumo} onChange={(e) => { const unidadAuto = UNIDAD_DEFAULT_INSUMO[e.target.value]; setForm({ ...form, insumo: e.target.value, unidad: unidadAuto || form.unidad }); }} style={S.inp}>{insumos.map((i) => <option key={i}>{i}</option>)}</select></Fld>
                    {form.insumo === "Otro" && <Fld label="¿Cuál?" full><input value={form.insumoCustom} onChange={(e) => setForm({ ...form, insumoCustom: e.target.value })} style={S.inp} /></Fld>}
                    <Fld label="Cantidad *">
                      <input type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value, _errorCantidad: false })} style={{ ...S.inp, borderColor: form._errorCantidad ? C.red : C.border }} />
                      {form._errorCantidad && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>Ingresa la cantidad</div>}
                    </Fld>
                    <Fld label="Unidad">{ UNIDAD_DEFAULT_INSUMO[form.insumo] ? (<div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, color: C.mustard, padding: "8px 10px", fontSize: 13, fontWeight: 700 }}>{UNIDAD_DEFAULT_INSUMO[form.insumo]} <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>(fijo por receta)</span></div>) : (<select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} style={S.inp}>{["unidad","kg","g","litro","ml","paquete","caja","bolsa"].map((u) => <option key={u}>{u}</option>)}</select>) }</Fld>
                    <Fld label="Fondo"><select value={form.fondo} onChange={(e) => setForm({ ...form, fondo: e.target.value })} style={S.inp}>{FONDOS.map((f) => <option key={f}>{f}</option>)}</select></Fld>
                    <Fld label="Proveedor"><select value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value, proveedorCustom: "" })} style={S.inp}><option value="">Sin proveedor</option>{proveedores.map((p) => <option key={p}>{p}</option>)}<option value="__nuevo__">+ Nuevo…</option></select></Fld>
                    {form.proveedor === "__nuevo__" && <Fld label="Nombre" full><input value={form.proveedorCustom} onChange={(e) => setForm({ ...form, proveedorCustom: e.target.value })} style={S.inp} /></Fld>}
                    <Fld label="Nota" full><input placeholder="opcional" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} style={S.inp} /></Fld>
                  </div>
                  <button onClick={agregarGasto} disabled={saving} style={{ marginTop: 14, background: persona ? C.mustard : C.border, color: persona ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 700, cursor: persona ? "pointer" : "default", width: "100%" }}>
                    {saving ? "Guardando..." : persona ? `Guardar — ${persona}` : "Selecciona quién registra arriba"}
                  </button>
                </div>
                <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}><div style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Agregar insumo a la lista</div>
                    <input placeholder="ej: Mermelada" value={form._nuevoInsumo || ""} onChange={(e) => setForm({ ...form, _nuevoInsumo: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { const n = (form._nuevoInsumo || "").trim(); if (!n || insumos.includes(n)) return; setInsumos([...insumos.slice(0, -1), n, "Otro"]); setForm({ ...form, _nuevoInsumo: "" }); showToast(`"${n}" agregado`); } }} style={S.inp} />
                  </div>
                  <button onClick={() => { const n = (form._nuevoInsumo || "").trim(); if (!n || insumos.includes(n)) return; setInsumos([...insumos.slice(0, -1), n, "Otro"]); setForm({ ...form, _nuevoInsumo: "" }); showToast(`"${n}" agregado`); }} style={{ background: C.tag, border: `1px solid ${C.border}`, color: C.mustard, borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
                </div>
              </div>
            )}
            {gastosView === "historial" && (
              <div>
                <div style={{ ...S.card, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select value={filtro.mes} onChange={(e) => setFiltro({ ...filtro, mes: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 110 }}><option value="">Todos los meses</option>{meses.map((m) => <option key={m}>{m}</option>)}</select>
                  <select value={filtro.insumo} onChange={(e) => setFiltro({ ...filtro, insumo: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 120 }}><option value="">Todos los insumos</option>{[...new Set(gastos.map((g) => g.insumo))].sort().map((i) => <option key={i}>{i}</option>)}</select>
                  <select value={filtro.persona} onChange={(e) => setFiltro({ ...filtro, persona: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 100 }}><option value="">Todos</option>{PERSONAS.map((p) => <option key={p}>{p}</option>)}</select>
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
            {gastosView === "stock" && (() => {
              const stock = calcularStock(gastos, ventas, recetas, insumosPrecio);
              const alertColor = { verde: C.green, naranja: C.orange, rojo: C.red };
              const alertEmoji = { verde: "🟢", naranja: "🟡", rojo: "🔴" };
              return (
                <div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Basado en compras registradas vs ventas del período.</div>
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
              {[{ id: "registrar", label: "🧾 Registrar" }, { id: "dashboard", label: "📊 Dashboard" }, { id: "historial", label: "📋 Historial" }].map((t) => (
                <button key={t.id} onClick={() => setVentaView(t.id)} style={{ background: ventaView === t.id ? C.mustard : C.tag, color: ventaView === t.id ? C.bg : C.muted, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: ventaView === t.id ? 700 : 400, fontSize: 12 }}>{t.label}</button>
              ))}
            </div>

            {ventaView === "registrar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                    {recetas.filter((r) => r.categoria === catActiva).sort((a, b) => a.precio_venta - b.precio_venta).map((rec) => (
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
              const ventasPeriodo = dashPeriodo === "hoy" ? ventas.filter((v) => v.fecha === ahora)
                : dashPeriodo === "7dias" ? ventas.filter((v) => v.fecha >= hace7str && v.fecha <= ahora)
                : ventasMesActual;
              const totalPeriodo = ventasPeriodo.reduce((s, v) => s + v.total, 0);
              const cantidadPeriodo = ventasPeriodo.length;
              const ticketPromedio = cantidadPeriodo > 0 ? Math.round(totalPeriodo / cantidadPeriodo) : 0;
              const gastosPeriodo = dashPeriodo === "hoy" ? gastos.filter((g) => g.fecha === ahora).reduce((s, g) => s + g.monto, 0)
                : dashPeriodo === "7dias" ? gastos.filter((g) => g.fecha >= hace7str && g.fecha <= ahora).reduce((s, g) => s + g.monto, 0)
                : totalMes;
              const utilidadPeriodo = totalPeriodo - gastosPeriodo;
              const margenOperacional = totalPeriodo > 0 && gastosPeriodo > 0 ? Math.round((utilidadPeriodo / totalPeriodo) * 100) : null;
              const diasGrafico = dashPeriodo === "hoy" ? [ahora]
                : dashPeriodo === "7dias" ? Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })
                : Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => { const d = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }).filter((d) => d <= ahora);
              const ventasDia = diasGrafico.map((d) => ({ dia: d.slice(8), fecha: d, total: ventas.filter((v) => v.fecha === d).reduce((s, v) => s + v.total, 0) }));
              const maxDia = Math.max(...ventasDia.map((d) => d.total), 1);
              const metodosPeriodo = ["Efectivo", "Tarjeta", "Pedidos Ya"].map((m) => ({ m, t: ventasPeriodo.filter((v) => v.metodo_pago === m).reduce((s, v) => s + v.total, 0) })).filter((x) => x.t > 0);
              const productosPeriodo = Object.entries(ventasPeriodo.reduce((acc, v) => { acc[v.producto] = acc[v.producto] || { total: 0, cantidad: 0 }; acc[v.producto].total += v.total; acc[v.producto].cantidad += v.cantidad; return acc; }, {})).map(([n, d]) => ({ n, ...d })).sort((a, b) => b.total - a.total).slice(0, 8);
              const cortesiasPeriodo = ventasPeriodo.filter((v) => { try { return JSON.parse(v.nota || "{}").tipo === "cortesia"; } catch { return false; } });
              const descuentosPeriodo = ventasPeriodo.filter((v) => { try { return JSON.parse(v.nota || "{}").tipo === "personal"; } catch { return false; } });
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[{ id: "hoy", label: "Hoy" }, { id: "7dias", label: "7 días" }, { id: "mes", label: "Este mes" }].map((p) => (
                      <button key={p.id} onClick={() => setDashPeriodo(p.id)} style={{ flex: 1, background: dashPeriodo === p.id ? C.green : C.tag, color: dashPeriodo === p.id ? "#fff" : C.muted, border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontWeight: dashPeriodo === p.id ? 700 : 400, fontSize: 13 }}>{p.label}</button>
                    ))}
                  </div>
                  <div style={S.card}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                      <div style={{ textAlign: "center" }}><div style={{ color: C.muted, fontSize: 11 }}>Ventas</div><div style={{ fontWeight: 800, fontSize: 20, color: C.green }}>{fmt(totalPeriodo)}</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ color: C.muted, fontSize: 11 }}>Ticket prom.</div><div style={{ fontWeight: 800, fontSize: 20, color: C.mustard }}>{fmt(ticketPromedio)}</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ color: C.muted, fontSize: 11 }}>Transacciones</div><div style={{ fontWeight: 800, fontSize: 20, color: C.blue }}>{cantidadPeriodo}</div></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 11 }}>Gastos</div><div style={{ fontWeight: 700, fontSize: 16, color: C.red }}>{fmt(gastosPeriodo)}</div></div>
                      <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 11 }}>Utilidad</div><div style={{ fontWeight: 700, fontSize: 16, color: utilidadPeriodo >= 0 ? C.green : C.red }}>{fmt(utilidadPeriodo)}</div></div>
                    </div>
                    {margenOperacional !== null && (
                      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: C.muted }}>Margen operacional</span>
                        <span style={{ fontWeight: 700, color: margenOperacional >= 0 ? C.green : C.red }}>{margenOperacional}%</span>
                      </div>
                    )}
                    {gastosPeriodo === 0 && totalPeriodo > 0 && (
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>Registra gastos del período para ver el margen operacional</div>
                    )}
                  </div>
                  {dashPeriodo !== "hoy" && (
                    <div style={S.card}>
                      <STitle>Ventas por día</STitle>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: dashPeriodo === "7dias" ? 8 : 3, height: 100, paddingBottom: 20 }}>
                        {ventasDia.map((d) => (
                          <div key={d.fecha} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <div style={{ fontSize: 9, color: d.total > 0 ? C.green : C.muted }}>{d.total > 0 ? fmt(d.total).replace("$", "") : ""}</div>
                            <div style={{ width: "100%", background: d.total > 0 ? C.green : C.border, borderRadius: "3px 3px 0 0", height: `${Math.max(4, Math.round((d.total / maxDia) * 70))}px`, position: "relative" }}>
                              {d.fecha === ahora && <div style={{ position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: C.mustard }} />}
                            </div>
                            <div style={{ fontSize: 9, color: d.fecha === ahora ? C.mustard : C.muted }}>{d.dia}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={S.card}>
                    <STitle>Por método de pago</STitle>
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
                    <STitle>Por producto</STitle>
                    {productosPeriodo.length === 0 && <Empty />}
                    {productosPeriodo.map((x) => (
                      <div key={x.n} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span>{x.n} <span style={{ color: C.muted, fontSize: 11 }}>({x.cantidad})</span></span>
                          <span style={{ fontWeight: 700, color: C.green }}>{fmt(x.total)}</span>
                        </div>
                        <Bar value={x.total} max={productosPeriodo[0]?.total || 1} color={C.green} />
                      </div>
                    ))}
                  </div>
                  {(cortesiasPeriodo.length > 0 || descuentosPeriodo.length > 0) && (
                    <div style={S.card}>
                      <STitle>Cortesías y descuentos</STitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 11 }}>🎁 Cortesías</div><div style={{ fontWeight: 700, fontSize: 18, color: C.orange }}>{cortesiasPeriodo.length}</div></div>
                        <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 11 }}>% Descuentos</div><div style={{ fontWeight: 700, fontSize: 18, color: C.blue }}>{descuentosPeriodo.length}</div></div>
                      </div>
                      {cortesiasPeriodo.map((v) => { const d = JSON.parse(v.nota || "{}"); return (<div key={v.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${C.border}22` }}><span>{v.producto} <span style={{ color: personColor(d.autorizado_por) }}>({d.autorizado_por})</span></span><span style={{ color: C.muted }}>{v.fecha}</span></div>); })}
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
                        {v.nota && (() => { try { const d = JSON.parse(v.nota); if (d.tipo === "cortesia") return <Tag text={`🎁 ${d.autorizado_por}`} color={C.green + "33"} textColor={C.green} />; if (d.tipo === "personal") return <Tag text={`${d.porcentaje}% off`} color={C.blue + "33"} textColor={C.blue} />; if (d.combo) return <Tag text={`🎁 ${d.combo}`} color={C.purple + "33"} textColor={C.purple} />; return null; } catch { return null; } })()}
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
                  {recetas.filter((r) => r.categoria === recetaCatActiva).sort((a, b) => a.precio_venta - b.precio_venta).map((rec) => {
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
                    return (
                      <div key={rec.id} style={S.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontWeight: 700 }}>{rec.nombre_producto}</div>
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
                  {recetas.filter((r) => r.categoria === recetaCatActiva).sort((a, b) => a.precio_venta - b.precio_venta).map((rec) => {
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
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={guardarInsumo} style={{ flex: 1, background: C.mustard, border: "none", color: C.bg, borderRadius: 7, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>{editInsumoId ? "Actualizar" : "Agregar"}</button>
                    {editInsumoId && <button onClick={() => { setEditInsumoId(null); setFormInsumo({ nombre: "", precio_por_kg: "", unidad: "kg" }); }} style={{ background: C.tag, border: "none", color: C.muted, borderRadius: 7, padding: "9px 16px", cursor: "pointer" }}>Cancelar</button>}
                  </div>
                </div>
                {insumosPrecio.map((ins) => (
                  <div key={ins.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{ins.nombre}</div><div style={{ color: C.muted, fontSize: 12 }}>{fmt(ins.precio_por_kg)} / {ins.unidad}</div></div>
                    <button onClick={() => { setFormInsumo({ nombre: ins.nombre, precio_por_kg: ins.precio_por_kg, unidad: ins.unidad }); setEditInsumoId(ins.id); }} style={{ background: C.tag, border: "none", color: C.mustard, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                    <button onClick={() => solicitarEliminacion("insumo", ins)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                  </div>
                ))}
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
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>Filtrar mes:</div>
                <select value={filtroResumen} onChange={(e) => setFiltroResumen(e.target.value)} style={S.inp}><option value="">Todo el historial</option>{meses.map((m) => <option key={m}>{m}</option>)}</select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatCard label="Ventas mes" value={fmt(totalVentasMes)} color={C.green} />
              <StatCard label="Gastos mes" value={fmt(totalMes)} color={C.mustard} />
              <StatCard label="Utilidad" value={fmt(utilidadMes)} color={utilidadMes >= 0 ? C.green : C.red} />
              <StatCard label="Total gastos" value={fmt(totalGeneral)} color={C.muted} />
            </div>
            <div style={S.card}>
              <STitle>Gastos por persona</STitle>
              {porPersonaGastos.map((x) => (
                <div key={x.p} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: personColor(x.p), display: "inline-block" }} />{x.p}</span>
                    <span style={{ fontWeight: 700, color: personColor(x.p) }}>{fmt(x.t)}</span>
                  </div>
                  <Bar value={x.t} max={Math.max(...porPersonaGastos.map((p) => p.t))} color={personColor(x.p)} />
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
