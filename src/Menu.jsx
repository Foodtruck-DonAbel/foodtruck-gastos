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

const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-CL");

export default function Menu() {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catActiva, setCatActiva] = useState("completos");

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from("recetas")
        .select("nombre_producto, categoria, precio_venta, ingredientes")
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

  return (
    <div style={{ minHeight: "100vh", background: "#18161A", color: "#F2EEF8", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#221F26", borderBottom: "1px solid #3A3640", padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🌭</div>
        <div style={{ fontWeight: 900, fontSize: 26, color: "#E8B84B", letterSpacing: 1 }}>DON ABEL</div>
        <div style={{ color: "#8A8496", fontSize: 13, marginTop: 2 }}>Rock & Food · Puerto Varas</div>
      </div>

      {/* Categorías */}
      <div style={{ padding: "16px 12px 0", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
          {CATEGORIAS.map((cat) => (
            <button key={cat.id} onClick={() => setCatActiva(cat.id)}
              style={{ background: catActiva === cat.id ? "#E8B84B" : "#2A2730", color: catActiva === cat.id ? "#18161A" : "#8A8496", border: "none", borderRadius: 20, padding: "7px 16px", cursor: "pointer", fontWeight: catActiva === cat.id ? 700 : 400, fontSize: 13, whiteSpace: "nowrap" }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 12px 60px" }}>
        {loading && (
          <div style={{ textAlign: "center", color: "#8A8496", padding: 60 }}>Cargando menú...</div>
        )}
        {!loading && productosCat.length === 0 && (
          <div style={{ textAlign: "center", color: "#8A8496", padding: 40 }}>Sin productos en esta categoría</div>
        )}
        {productosCat.map((rec, idx) => (
          <div key={idx} style={{ background: "#2A2730", border: "1px solid #3A3640", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{rec.nombre_producto}</div>
              {rec.ingredientes && rec.ingredientes.length > 0 && (
                <div style={{ color: "#8A8496", fontSize: 12, lineHeight: 1.6 }}>
                  {rec.ingredientes.map((ing) => ing.insumo).join(" · ")}
                </div>
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#E8B84B", whiteSpace: "nowrap" }}>
              {fmt(rec.precio_venta)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 16px 40px", color: "#8A8496", fontSize: 12, borderTop: "1px solid #3A3640" }}>
        <div style={{ marginBottom: 8 }}>📍 Puerto Varas · Chile</div>
        <a href="https://wa.me/56965205046?text=Hola%20Don%20Abel%2C%20quiero%20información"
          style={{ color: "#5BAD7F", textDecoration: "none", fontWeight: 600 }}>
          💬 Contáctanos por WhatsApp
        </a>
      </div>
    </div>
  );
}
