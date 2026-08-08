import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CATEGORIAS = [
  { id: "completos", label: "Completos", emoji: "🌭" },
  { id: "pollo", label: "Pollo", emoji: "🍗" },
  { id: "churrasco", label: "Churrasco", emoji: "🥩" },
  { id: "papas", label: "Papas", emoji: "🍟" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤" },
  { id: "agregados", label: "Agregados", emoji: "➕" },
  { id: "combos", label: "Combos", emoji: "🎁" },
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

const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-CL");

export default function Menu() {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catActiva, setCatActiva] = useState("completos");

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from("recetas")
        .select("nombre_producto, categoria, precio_venta, descripcion_menu, productos_combo")
        .order("precio_venta");
      if (data) setRecetas(data);
      setLoading(false);
    };
    cargar();
  }, []);

  const productosCat = recetas
    .filter((r) => r.categoria === catActiva)
    .sort((a, b) => a.precio_venta - b.precio_venta);

  return (
    <div style={{ minHeight: "100vh", background: "#18161A", color: "#F2EEF8", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#18161A", padding: "24px 16px 16px", textAlign: "center", borderBottom: "1px solid #3A3640" }}>
        <img src="/logo.jpg" alt="Don Abel Rock & Food" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: 12, border: "3px solid #E8B84B" }} />
        <div style={{ fontWeight: 900, fontSize: 26, color: "#E8B84B", letterSpacing: 2, textTransform: "uppercase" }}>Rock & Food</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#F2EEF8", marginTop: 2 }}>Don Abel</div>
        <div style={{ color: "#8A8496", fontSize: 12, marginTop: 4 }}>Puerto Varas · Chile</div>
      </div>

      {/* Categorías grid 3x2 */}
      <div style={{ padding: "16px 12px 0", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {CATEGORIAS.map((cat) => (
            <button key={cat.id} onClick={() => setCatActiva(cat.id)}
              style={{
                background: catActiva === cat.id ? "#E8B84B" : "#2A2730",
                color: catActiva === cat.id ? "#18161A" : "#8A8496",
                border: catActiva === cat.id ? "none" : "1px solid #3A3640",
                borderRadius: 10, padding: "10px 6px", cursor: "pointer",
                fontWeight: catActiva === cat.id ? 700 : 400, fontSize: 13,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
              <span style={{ fontSize: 20 }}>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 12px 60px" }}>
        {loading && <div style={{ textAlign: "center", color: "#8A8496", padding: 60 }}>Cargando menú...</div>}
        {!loading && productosCat.length === 0 && <div style={{ textAlign: "center", color: "#8A8496", padding: 40 }}>Sin productos en esta categoría</div>}
        {productosCat.map((rec, idx) => {
          const descripcion = rec.descripcion_menu || DESCRIPCIONES[rec.nombre_producto] || "";
          const esCombo = rec.categoria === "combos";
          return (
            <div key={idx} style={{ background: "#2A2730", border: "1px solid #3A3640", borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{rec.nombre_producto}</div>
                {esCombo && rec.productos_combo && rec.productos_combo.length > 0 && (
                  <div style={{ color: "#C97DDB", fontSize: 12, marginBottom: 4 }}>
                    {rec.productos_combo.join(" + ")}
                  </div>
                )}
                {descripcion && <div style={{ color: "#8A8496", fontSize: 12, lineHeight: 1.6 }}>{descripcion}</div>}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: esCombo ? "#C97DDB" : "#E8B84B", whiteSpace: "nowrap" }}>
                {fmt(rec.precio_venta)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 16px 40px", borderTop: "1px solid #3A3640", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <a href="https://wa.me/56965205046?text=Hola%20Don%20Abel%2C%20quiero%20información"
          style={{ color: "#5BAD7F", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          💬 Escríbenos por WhatsApp
        </a>
        <a href="https://www.instagram.com/donabel.rockandfood"
          target="_blank" rel="noopener noreferrer"
          style={{ color: "#C97DDB", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          📸 @donabel.rockandfood
        </a>
        <a href="https://www.pedidosya.cl/restaurantes/puerto-varas/rock-and-food-a98cd423-b6af-4e0f-a4cd-eee9ea1c6ea4-menu?origin=shop_list"
          target="_blank" rel="noopener noreferrer"
          style={{ color: "#FF6B35", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          🛵 También en Pedidos Ya
        </a>
      </div>
    </div>
  );
}
