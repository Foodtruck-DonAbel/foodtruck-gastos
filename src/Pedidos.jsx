import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CATEGORIAS = [
  { id: "completos", label: "Completos", emoji: "🌭" },
  { id: "pollo", label: "Pollo", emoji: "🍗" },
  { id: "churrasco", label: "Churrasco", emoji: "🥩" },
  { id: "papas", label: "Papas", emoji: "🍟" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤" },
  { id: "agregados", label: "Agregados", emoji: "➕" },
];

const DESCRIPCIONES = {
  "Italiano": "Vienesa, palta, tomate y mayonesa casera",
  "Highway to Hell": "Vienesa, cebolla caramelizada, pepinillos y tocino",
  "Torn and Frayed": "Vienesa, cebolla caramelizada y papas hilo",
  "Purple Haze": "Vienesa, chucrut morado, pepinillo y tocino",
  "Dinámico": "Vienesa, palta, tomate, chucrut, salsa americana y mayonesa",
  "Paradise City": "Vienesa, palta, tomate, cebolla caramelizada, tocino y ají",
  "Sweet Child O' Mine": "Vienesa, cebolla caramelizada, queso fundido y tocino",
  "Pollo Highway to Hell": "Fingers de pollo, mayonesa, pepinillos y queso cheddar",
  "Pollo Welcome to the Jungle": "Fingers de pollo, salsa americana, cebolla caramelizada y queso cheddar",
  "Pollo Rock You Like a Hurricane": "Fingers de pollo, chucrut, mostaza y queso cheddar",
  "Pollo Back in Black": "Fingers de pollo, BBQ, tocino y queso cheddar",
  "Pollo Thunderstruck": "Fingers de pollo, mostaza, tocino y queso cheddar",
  "Pollo Smoke on the Water": "Fingers de pollo, BBQ, cebolla caramelizada, tocino y queso cheddar",
  "Churrasco Highway to Hell": "Churrasco, mayonesa, pepinillos y queso cheddar",
  "Churrasco Welcome to the Jungle": "Churrasco, salsa americana, cebolla caramelizada y queso cheddar",
  "Churrasco Rock You Like a Hurricane": "Churrasco, chucrut, mostaza y queso cheddar",
  "Churrasco Back in Black": "Churrasco, BBQ, tocino y queso cheddar",
  "Churrasco Thunderstruck": "Churrasco, mostaza, tocino y queso cheddar",
  "Churrasco Smoke on the Water": "Churrasco, BBQ, cebolla caramelizada, tocino y queso cheddar",
  "Papas fritas": "300g de papas crujientes recién fritas",
  "Salchipapas": "Papas fritas con vienesa",
  "Salchipapas con tocino": "Papas fritas, vienesa y tocino",
  "Papas tocino y cebolla": "Papas fritas, tocino y cebolla caramelizada",
  "Papas queso fundido y tocino": "Papas fritas, queso fundido y tocino",
  "Papas con nuggets": "Papas fritas con nuggets de pollo",
  "Papas con nuggets (12 und)": "Papas fritas con 12 nuggets de pollo",
  "Lata 250ml": "Bebida fría 250ml",
  "Queso fundido": "Porción de queso fundido",
  "Tocino agregado": "Porción de tocino",
};

const HORARIOS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-CL");

export default function Pedidos() {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catActiva, setCatActiva] = useState("completos");
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState("");
  const [form, setForm] = useState({ nombre: "", telefono: "", hora_retiro: "", metodo_pago: "" });
  const [errores, setErrores] = useState({});

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from("recetas")
        .select("nombre_producto, categoria, precio_venta, descripcion_menu")
        .neq("categoria", "combos")
        .order("precio_venta");
      if (data) setRecetas(data);
      setLoading(false);
    };
    cargar();
  }, []);

  const productosCat = recetas
    .filter((r) => r.categoria === catActiva)
    .sort((a, b) => a.precio_venta - b.precio_venta);

  const totalCarrito = carrito.reduce((s, c) => s + c.total, 0);
  const cantidadCarrito = carrito.reduce((s, c) => s + c.cantidad, 0);

  const agregarAlCarrito = (rec) => {
    const idx = carrito.findIndex((c) => c.nombre === rec.nombre_producto);
    if (idx >= 0) {
      setCarrito(carrito.map((c, i) => i === idx ? { ...c, cantidad: c.cantidad + 1, total: (c.cantidad + 1) * c.precio } : c));
    } else {
      setCarrito([...carrito, { nombre: rec.nombre_producto, precio: rec.precio_venta, cantidad: 1, total: rec.precio_venta }]);
    }
  };

  const cambiarCantidad = (idx, delta) => {
    setCarrito(carrito.map((c, i) => {
      if (i !== idx) return c;
      const nueva = c.cantidad + delta;
      if (nueva <= 0) return null;
      return { ...c, cantidad: nueva, total: nueva * c.precio };
    }).filter(Boolean));
  };

  const cantidadProducto = (nombre) => {
    const item = carrito.find((c) => c.nombre === nombre);
    return item ? item.cantidad : 0;
  };

  const validarForm = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Ingresa tu nombre";
    if (!form.telefono.trim() || form.telefono.length < 8) e.telefono = "Ingresa un teléfono válido";
    if (!form.hora_retiro) e.hora_retiro = "Selecciona una hora";
    if (!form.metodo_pago) e.metodo_pago = "Selecciona método de pago";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const confirmarPedido = async () => {
    if (!validarForm()) return;
    setEnviando(true);
    const numero = `DA-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("pedidos").insert([{
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      hora_retiro: form.hora_retiro,
      metodo_pago: form.metodo_pago,
      productos: carrito,
      total: totalCarrito,
      estado: "pendiente",
    }]);
    if (!error) {
      setNumeroPedido(numero);
      setPedidoEnviado(true);
      setCarrito([]);
      setForm({ nombre: "", telefono: "", hora_retiro: "", metodo_pago: "" });
    }
    setEnviando(false);
  };

  // Pantalla confirmación
  if (pedidoEnviado) {
    return (
      <div style={{ minHeight: "100vh", background: "#18161A", color: "#F2EEF8", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎸</div>
        <div style={{ fontWeight: 900, fontSize: 24, color: "#E8B84B", marginBottom: 8 }}>¡Pedido recibido!</div>
        <div style={{ color: "#8A8496", fontSize: 14, marginBottom: 24, textAlign: "center" }}>Te esperamos a la hora que elegiste. ¡Gracias por elegirnos!</div>
        <div style={{ background: "#2A2730", border: "1px solid #3A3640", borderRadius: 14, padding: "20px 28px", textAlign: "center", marginBottom: 24 }}>
          <div style={{ color: "#8A8496", fontSize: 12 }}>Hora de retiro</div>
          <div style={{ fontWeight: 800, fontSize: 28, color: "#E8B84B" }}>{form.hora_retiro || "—"}</div>
        </div>
        {form.metodo_pago === "Transferencia" && (
          <div style={{ background: "#2A2730", border: "1px solid #3A3640", borderRadius: 14, padding: 16, width: "100%", maxWidth: 360, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#6B9FD4" }}>💳 Datos transferencia</div>
            <div style={{ fontSize: 13, color: "#8A8496", lineHeight: 2 }}>
              <div>Banco: <span style={{ color: "#F2EEF8" }}>—</span></div>
              <div>RUT: <span style={{ color: "#F2EEF8" }}>—</span></div>
              <div>Nombre: <span style={{ color: "#F2EEF8" }}>Don Abel Rock & Food</span></div>
              <div style={{ color: "#8A8496", fontSize: 11, marginTop: 6 }}>* Completa los datos de transferencia en la app</div>
            </div>
          </div>
        )}
        <a href="/pedidos" style={{ background: "#E8B84B", color: "#18161A", textDecoration: "none", fontWeight: 700, borderRadius: 10, padding: "12px 28px", fontSize: 15 }}>
          Hacer otro pedido
        </a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#18161A", color: "#F2EEF8", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: "#18161A", padding: "20px 16px 16px", textAlign: "center", borderBottom: "1px solid #3A3640" }}>
        <img src="/logo.jpg" alt="Don Abel" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid #E8B84B", marginBottom: 8 }} />
        <div style={{ fontWeight: 900, fontSize: 22, color: "#E8B84B" }}>Rock & Food</div>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#F2EEF8" }}>Don Abel · Pedidos online</div>
      </div>

      {/* Modal formulario */}
      {mostrarFormulario && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "#221F26", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Confirmar pedido</div>

            {/* Resumen carrito */}
            <div style={{ background: "#2A2730", borderRadius: 10, padding: 12, marginBottom: 16 }}>
              {carrito.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #3A364022" }}>
                  <span>{c.nombre} × {c.cantidad}</span>
                  <span style={{ color: "#E8B84B", fontWeight: 700 }}>{fmt(c.total)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 800, fontSize: 16 }}>
                <span>Total</span>
                <span style={{ color: "#5BAD7F" }}>{fmt(totalCarrito)}</span>
              </div>
            </div>

            {/* Formulario */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ color: "#8A8496", fontSize: 11, marginBottom: 4 }}>Tu nombre</div>
                <input placeholder="ej: Juan Pérez" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  style={{ background: "#18161A", border: `1px solid ${errores.nombre ? "#E05252" : "#3A3640"}`, borderRadius: 8, color: "#F2EEF8", padding: "10px 12px", width: "100%", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                {errores.nombre && <div style={{ color: "#E05252", fontSize: 11, marginTop: 3 }}>{errores.nombre}</div>}
              </div>
              <div>
                <div style={{ color: "#8A8496", fontSize: 11, marginBottom: 4 }}>Teléfono</div>
                <input placeholder="ej: 9 1234 5678" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} type="tel"
                  style={{ background: "#18161A", border: `1px solid ${errores.telefono ? "#E05252" : "#3A3640"}`, borderRadius: 8, color: "#F2EEF8", padding: "10px 12px", width: "100%", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                {errores.telefono && <div style={{ color: "#E05252", fontSize: 11, marginTop: 3 }}>{errores.telefono}</div>}
              </div>
              <div>
                <div style={{ color: "#8A8496", fontSize: 11, marginBottom: 4 }}>Hora de retiro</div>
                <select value={form.hora_retiro} onChange={(e) => setForm({ ...form, hora_retiro: e.target.value })}
                  style={{ background: "#18161A", border: `1px solid ${errores.hora_retiro ? "#E05252" : "#3A3640"}`, borderRadius: 8, color: form.hora_retiro ? "#F2EEF8" : "#8A8496", padding: "10px 12px", width: "100%", fontSize: 14, boxSizing: "border-box", outline: "none" }}>
                  <option value="">Selecciona una hora…</option>
                  {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                {errores.hora_retiro && <div style={{ color: "#E05252", fontSize: 11, marginTop: 3 }}>{errores.hora_retiro}</div>}
              </div>
              <div>
                <div style={{ color: "#8A8496", fontSize: 11, marginBottom: 8 }}>Método de pago</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { id: "Efectivo", label: "💵 Pago en el local", desc: "Pagas al retirar" },
                    { id: "Transferencia", label: "🏦 Transferencia", desc: "Te enviamos los datos" },
                    { id: "MercadoPago", label: "💳 Mercado Pago", desc: "Próximamente disponible", disabled: true },
                  ].map((mp) => (
                    <button key={mp.id} onClick={() => !mp.disabled && setForm({ ...form, metodo_pago: mp.id })}
                      style={{ background: form.metodo_pago === mp.id ? "#E8B84B22" : "#18161A", border: `1px solid ${form.metodo_pago === mp.id ? "#E8B84B" : "#3A3640"}`, borderRadius: 10, padding: "12px 14px", cursor: mp.disabled ? "not-allowed" : "pointer", textAlign: "left", opacity: mp.disabled ? 0.4 : 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: form.metodo_pago === mp.id ? "#E8B84B" : "#F2EEF8" }}>{mp.label}</div>
                      <div style={{ fontSize: 12, color: "#8A8496", marginTop: 2 }}>{mp.desc}</div>
                    </button>
                  ))}
                </div>
                {errores.metodo_pago && <div style={{ color: "#E05252", fontSize: 11, marginTop: 3 }}>{errores.metodo_pago}</div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setMostrarFormulario(false)} style={{ flex: 1, background: "#2A2730", border: "none", color: "#8A8496", borderRadius: 10, padding: "13px 0", cursor: "pointer", fontWeight: 600 }}>Volver</button>
              <button onClick={confirmarPedido} disabled={enviando} style={{ flex: 2, background: "#5BAD7F", border: "none", color: "#fff", borderRadius: 10, padding: "13px 0", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                {enviando ? "Enviando..." : "✓ Confirmar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal carrito */}
      {mostrarCarrito && !mostrarFormulario && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#221F26", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 600, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Tu pedido</div>
            {carrito.length === 0 && <div style={{ color: "#8A8496", textAlign: "center", padding: 20 }}>El carrito está vacío</div>}
            {carrito.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, background: "#2A2730", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</div>
                  <div style={{ color: "#8A8496", fontSize: 12 }}>{fmt(c.precio)} c/u</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => cambiarCantidad(i, -1)} style={{ background: "#3A3640", border: "none", color: "#F2EEF8", borderRadius: 5, width: 28, height: 28, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{c.cantidad}</span>
                  <button onClick={() => cambiarCantidad(i, 1)} style={{ background: "#3A3640", border: "none", color: "#F2EEF8", borderRadius: 5, width: 28, height: 28, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
                  <span style={{ fontWeight: 700, color: "#E8B84B", minWidth: 64, textAlign: "right" }}>{fmt(c.total)}</span>
                </div>
              </div>
            ))}
            {carrito.length > 0 && (
              <div style={{ borderTop: "1px solid #3A3640", paddingTop: 12, display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#5BAD7F" }}>{fmt(totalCarrito)}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMostrarCarrito(false)} style={{ flex: 1, background: "#2A2730", border: "none", color: "#8A8496", borderRadius: 10, padding: "12px 0", cursor: "pointer", fontWeight: 600 }}>Seguir</button>
              {carrito.length > 0 && (
                <button onClick={() => { setMostrarCarrito(false); setMostrarFormulario(true); }} style={{ flex: 2, background: "#E8B84B", border: "none", color: "#18161A", borderRadius: 10, padding: "12px 0", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                  Pedir →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Categorías */}
      <div style={{ padding: "16px 12px 0", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {CATEGORIAS.map((cat) => (
            <button key={cat.id} onClick={() => setCatActiva(cat.id)}
              style={{ background: catActiva === cat.id ? "#E8B84B" : "#2A2730", color: catActiva === cat.id ? "#18161A" : "#8A8496", border: catActiva === cat.id ? "none" : "1px solid #3A3640", borderRadius: 10, padding: "10px 6px", cursor: "pointer", fontWeight: catActiva === cat.id ? 700 : 400, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 12px 20px" }}>
        {loading && <div style={{ textAlign: "center", color: "#8A8496", padding: 40 }}>Cargando...</div>}
        {productosCat.map((rec, idx) => {
          const desc = rec.descripcion_menu || DESCRIPCIONES[rec.nombre_producto] || "";
          const cant = cantidadProducto(rec.nombre_producto);
          return (
            <div key={idx} style={{ background: "#2A2730", border: "1px solid #3A3640", borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{rec.nombre_producto}</div>
                {desc && <div style={{ color: "#8A8496", fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
                <div style={{ fontWeight: 800, fontSize: 16, color: "#E8B84B", marginTop: 6 }}>{fmt(rec.precio_venta)}</div>
              </div>
              <div>
                {cant === 0 ? (
                  <button onClick={() => agregarAlCarrito(rec)} style={{ background: "#E8B84B", border: "none", color: "#18161A", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontWeight: 700, fontSize: 20 }}>+</button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => { const idx2 = carrito.findIndex((c) => c.nombre === rec.nombre_producto); cambiarCantidad(idx2, -1); }} style={{ background: "#3A3640", border: "none", color: "#F2EEF8", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontWeight: 700 }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{cant}</span>
                    <button onClick={() => agregarAlCarrito(rec)} style={{ background: "#E8B84B", border: "none", color: "#18161A", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontWeight: 700 }}>+</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "10px 16px 20px", color: "#8A8496", fontSize: 12 }}>
        <a href="/menu" style={{ color: "#8A8496", textDecoration: "none" }}>Ver menú sin pedido →</a>
      </div>

      {/* Carrito flotante */}
      {cantidadCarrito > 0 && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100, width: "calc(100% - 32px)", maxWidth: 560 }}>
          <button onClick={() => setMostrarCarrito(true)} style={{ width: "100%", background: "#E8B84B", border: "none", color: "#18161A", borderRadius: 14, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,.5)" }}>
            <span style={{ background: "#18161A33", borderRadius: 8, padding: "4px 10px", fontWeight: 700 }}>{cantidadCarrito} productos</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Ver pedido</span>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{fmt(totalCarrito)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
