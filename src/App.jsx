import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const C = {
  bg: "#18161A", surface: "#221F26", card: "#2A2730", border: "#3A3640",
  mustard: "#E8B84B", mustardDim: "#B8902A", red: "#E05252",
  green: "#5BAD7F", text: "#F2EEF8", muted: "#8A8496", tag: "#332F3C",
};

const PERSONAS = ["Raul", "Pepe", "Alejandro", "Gustavo"];
const FONDOS = ["Efectivo foodtruck", "Efectivo Don Abel", "Tarjeta foodtruck","Tarjeta Don Abel"];
const INSUMOS_BASE = [
  "Palta","Tomate","Pan para completo","Mayonesa","Salchichas",
  "Papas fritas","Tocino","Chucrut","Mostaza","Ketchup",
  "Salsas / aderezos","Aceite","Envases papas fritas",
  "Envases completos","Servilletas / bolsas","Gas / combustible","Limpieza","Otro",
];

const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-CL");
const today = () => new Date().toISOString().slice(0, 10);
const personColor = (name) => ({
  Raul: "#6B9FD4", Pepe: "#E8B84B", Alejandro: "#5BAD7F", Gustavo: "#C97DDB"
}[name] || C.muted);

export default function App() {
  const [gastos, setGastos] = useState([]);
  const [insumos, setInsumos] = useState(INSUMOS_BASE);
  const [view, setView] = useState("nuevo");
  const [persona, setPersona] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fecha: today(), insumo: INSUMOS_BASE[0], insumoCustom: "",
    cantidad: "", unidad: "unidad", fondo: FONDOS[0], proveedor: "", monto: "", nota: "",
  });
  const [nuevoInsumo, setNuevoInsumo] = useState("");
  const [filtro, setFiltro] = useState({ mes: "", insumo: "", persona: "" });
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { cargarGastos(); }, []);

  const cargarGastos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gastos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setGastos(data);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const agregarGasto = async () => {
    if (!persona) { showToast("Selecciona quién registra"); return; }
    const insumofinal = form.insumo === "Otro" ? (form.insumoCustom || "Otro") : form.insumo;
    if (!insumofinal || !form.monto || isNaN(Number(form.monto))) {
      showToast("Completa monto e insumo"); return;
    }
    setSaving(true);
    const nuevo = {
      fecha: form.fecha, insumo: insumofinal,
      cantidad: form.cantidad || null, unidad: form.unidad,
      fondo: form.fondo, proveedor: form.proveedor || null,
      monto: Number(form.monto), persona, nota: form.nota || null,
    };
    const { error } = await supabase.from("gastos").insert([nuevo]);
    if (error) { showToast("Error al guardar"); }
    else {
      showToast("✓ Gasto guardado");
      setForm({ ...form, cantidad: "", proveedor: "", monto: "", nota: "", insumoCustom: "" });
      cargarGastos();
    }
    setSaving(false);
  };

  const eliminar = async (id) => {
    await supabase.from("gastos").delete().eq("id", id);
    setConfirmDelete(null);
    showToast("Registro eliminado");
    cargarGastos();
  };

  const agregarInsumo = () => {
    const n = nuevoInsumo.trim();
    if (!n || insumos.includes(n)) return;
    setInsumos([...insumos.slice(0, -1), n, "Otro"]);
    setNuevoInsumo("");
    showToast(`"${n}" agregado`);
  };

  const gastosFiltrados = gastos.filter((g) => {
    if (filtro.mes && !g.fecha.startsWith(filtro.mes)) return false;
    if (filtro.insumo && g.insumo !== filtro.insumo) return false;
    if (filtro.persona && g.persona !== filtro.persona) return false;
    return true;
  });

  const totalFiltrado = gastosFiltrados.reduce((s, g) => s + g.monto, 0);
  const totalGeneral = gastos.reduce((s, g) => s + g.monto, 0);
  const mesActual = today().slice(0, 7);
  const totalMes = gastos.filter((g) => g.fecha.startsWith(mesActual)).reduce((s, g) => s + g.monto, 0);
  const meses = [...new Set(gastos.map((g) => g.fecha.slice(0, 7)))].sort().reverse();

  const porInsumo = Object.entries(
    gastos.reduce((acc, g) => { acc[g.insumo] = (acc[g.insumo] || 0) + g.monto; return acc; }, {})
  ).map(([n, t]) => ({ n, t })).sort((a, b) => b.t - a.t).slice(0, 10);

  const porPersona = PERSONAS.map((p) => ({
    p, t: gastos.filter((g) => g.persona === p).reduce((s, g) => s + g.monto, 0),
    c: gastos.filter((g) => g.persona === p).length
  })).filter((x) => x.t > 0);

  const porProveedor = Object.entries(
    gastos.filter((g) => g.proveedor).reduce((acc, g) => {
      acc[g.proveedor] = (acc[g.proveedor] || 0) + g.monto; return acc;
    }, {})
  ).map(([n, t]) => ({ n, t })).sort((a, b) => b.t - a.t).slice(0, 6);

  const maxInsumo = porInsumo[0]?.t || 1;
  const maxProv = porProveedor[0]?.t || 1;

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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "foodtruck_gastos.csv";
    a.click();
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
            <div style={{ fontWeight: 700, marginBottom: 8 }}>¿Eliminar registro?</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{confirmDelete.insumo} — {fmt(confirmDelete.monto)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.tag, border: "none", color: C.text, borderRadius: 7, padding: "8px 0", cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDelete.id)} style={{ flex: 1, background: C.red, border: "none", color: "#fff", borderRadius: 7, padding: "8px 0", cursor: "pointer", fontWeight: 700 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🌭</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Don Abel · Gastos</div>
              <div style={{ color: C.muted, fontSize: 11 }}>
                {loading ? "Cargando..." : `${gastos.length} registros · ${fmt(totalGeneral)} total`}
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
          <div style={{ display: "flex", gap: 4 }}>
            {[{ id: "nuevo", label: "+ Nuevo" }, { id: "historial", label: "Historial" }, { id: "resumen", label: "Resumen" }].map((t) => (
              <button key={t.id} onClick={() => setView(t.id)} style={{ background: view === t.id ? C.mustard : "transparent", color: view === t.id ? C.bg : C.muted, border: `1px solid ${view === t.id ? C.mustard : C.border}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: view === t.id ? 700 : 400, fontSize: 13 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 60px" }}>
        {view === "nuevo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Registrar gasto</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Fld label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} style={S.inp} /></Fld>
                <Fld label="Monto ($)"><input type="number" placeholder="0" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} style={S.inp} /></Fld>
                <Fld label="Insumo" full><select value={form.insumo} onChange={(e) => setForm({ ...form, insumo: e.target.value })} style={S.inp}>{insumos.map((i) => <option key={i}>{i}</option>)}</select></Fld>
                {form.insumo === "Otro" && (<Fld label="¿Cuál insumo?" full><input placeholder="Escribe el nombre" value={form.insumoCustom} onChange={(e) => setForm({ ...form, insumoCustom: e.target.value })} style={S.inp} /></Fld>)}
                <Fld label="Cantidad"><input type="number" placeholder="ej: 2" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} style={S.inp} /></Fld>
                <Fld label="Unidad"><select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} style={S.inp}>{["unidad","kg","g","litro","ml","paquete","caja","bolsa"].map((u) => <option key={u}>{u}</option>)}</select></Fld>
                <Fld label="Fondo usado"><select value={form.fondo} onChange={(e) => setForm({ ...form, fondo: e.target.value })} style={S.inp}>{FONDOS.map((f) => <option key={f}>{f}</option>)}</select></Fld>
                <Fld label="Proveedor"><input placeholder="ej: Jumbo, Mayorista" value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} style={S.inp} /></Fld>
                <Fld label="Nota (opcional)" full><input placeholder="ej: precio subió, oferta…" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} style={S.inp} /></Fld>
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
        {view === "historial" && (
          <div>
            <div style={{ ...S.card, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={filtro.mes} onChange={(e) => setFiltro({ ...filtro, mes: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 110 }}><option value="">Todos los meses</option>{meses.map((m) => <option key={m} value={m}>{m}</option>)}</select>
              <select value={filtro.insumo} onChange={(e) => setFiltro({ ...filtro, insumo: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 120 }}><option value="">Todos los insumos</option>{insumos.map((i) => <option key={i}>{i}</option>)}</select>
              <select value={filtro.persona} onChange={(e) => setFiltro({ ...filtro, persona: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 100 }}><option value="">Todos</option>{PERSONAS.map((p) => <option key={p}>{p}</option>)}</select>
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
                    {g.proveedor && <Tag text={g.proveedor} color="#2A3530" textColor={C.green} />}
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
        {view === "resumen" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatCard label="Total acumulado" value={fmt(totalGeneral)} color={C.mustard} />
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
                  <Bar value={x.t} max={Math.max(...porPersona.map(p => p.t))} color={personColor(x.p)} />
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
                  <Bar value={x.n} max={maxInsumo} color={C.mustard} />
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
