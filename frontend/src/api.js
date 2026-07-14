import { useMemo, useState } from "react";
import { api } from "../api";
import * as XLSX from "xlsx";

function InventoryMovements({ token, movements, permissions, styles }) {
  const today = new Date().toISOString().split("T")[0];
  const [filterDate, setFilterDate]       = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterType, setFilterType]       = useState("");
  const [tab, setTab]                     = useState("movimientos"); // 'movimientos' | 'diario'
  const [reportDate, setReportDate]       = useState(today);
  const [report, setReport]               = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const safeMovements = useMemo(
    () => (Array.isArray(movements) ? movements : []),
    [movements]
  );

  const productOptions = useMemo(() => {
    const names = new Set(safeMovements.map((m) => m.product_name));
    return Array.from(names).sort();
  }, [safeMovements]);

  const typeOptions = useMemo(() => {
    const types = new Set(safeMovements.map((m) => m.movement_type));
    return Array.from(types).sort();
  }, [safeMovements]);

  const filtered = useMemo(() => {
    return safeMovements.filter((m) => {
      if (filterDate) {
        const movDate = new Date(m.created_at).toISOString().split("T")[0];
        if (movDate !== filterDate) return false;
      }
      if (filterProduct && m.product_name !== filterProduct) return false;
      if (filterType && m.movement_type !== filterType) return false;
      return true;
    });
  }, [safeMovements, filterDate, filterProduct, filterType]);

  const consolidatedByProduct = useMemo(() => {
    const map = new Map();
    for (const m of filtered) {
      map.set(m.product_name, (map.get(m.product_name) || 0) + Number(m.quantity));
    }
    return Array.from(map.entries()).map(([product_name, total]) => ({ product_name, total }));
  }, [filtered]);

  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const data = await api.getDailyReport(token, reportDate);
      setReport(data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const exportMovimientos = () => {
    const data = filtered.map((m) => ({
      Fecha: new Date(m.created_at).toLocaleString(),
      Producto: m.product_name,
      Sede: m.branch_name,
      Tipo: m.movement_type,
      Cantidad: m.quantity,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, `movimientos-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportReporte = () => {
    if (!report) return;
    const data = report.rows.map((r) => {
      const row = {
        Producto: r.product_name,
        Producción: r.produccion,
        "Cuarto Frío": r.cuarto_frio,
        Horneado: r.horneo,
      };
      for (const b of report.branches) {
        row[b.name] = r.sedes[b.id] ?? 0;
      }
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Diario");
    XLSX.writeFile(wb, `reporte-diario-${reportDate}.xlsx`);
  };

  const printReport = () => {
    if (!report) return;
    const cols = ["Producción", "Cuarto Frío", "Horneado", ...report.branches.map(b => b.name)];
    let html = `<html><head><style>
      body{font-family:Arial;font-size:12px;padding:16px}
      h2{margin-bottom:8px}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ccc;padding:6px 10px;text-align:center}
      th{background:#f1f5f9;font-weight:bold}
      td:first-child{text-align:left}
      .zero{color:#aaa}
    </style></head><body>
    <h2>Reporte Diario — ${report.date}</h2>
    <table><thead><tr><th>Producto</th>${cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>`;
    for (const r of report.rows) {
      html += `<tr><td>${r.product_name}</td>
        <td class="${r.produccion===0?"zero":""}">${r.produccion}</td>
        <td class="${r.cuarto_frio===0?"zero":""}">${r.cuarto_frio}</td>
        <td class="${r.horneo===0?"zero":""}">${r.horneo}</td>
        ${report.branches.map(b=>`<td class="${(r.sedes[b.id]??0)===0?"zero":""}">${r.sedes[b.id]??0}</td>`).join("")}
      </tr>`;
    }
    html += "</tbody></table></body></html>";
    const w = window.open("","","width=900,height=600");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  if (!permissions.includes("inventory_view")) return null;

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 16 }}>📋 Reportes de Inventario</h3>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["movimientos","📜 Movimientos"],["diario","📊 Reporte Diario"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
            background: tab === key ? "#3b82f6" : "#334155",
            color: tab === key ? "#fff" : "#94a3b8",
          }}>{label}</button>
        ))}
      </div>

      {/* ── TAB MOVIMIENTOS ── */}
      {tab === "movimientos" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            <input type="date" style={styles.input} value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)} />
            <select style={styles.input} value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}>
              <option value="">Todos los productos</option>
              {productOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <select style={styles.input} value={filterType}
              onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Todos los tipos</option>
              {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button style={styles.button} onClick={exportMovimientos}>⬇ Excel</button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tblStyle}>
              <thead>
                <tr>
                  {["Fecha","Producto","Sede","Tipo","Cantidad"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={5} style={{ ...tdStyle, color: "#64748b", textAlign: "center" }}>Sin movimientos</td></tr>
                  : filtered.map((m) => (
                    <tr key={m.id}>
                      <td style={tdStyle}>{new Date(m.created_at).toLocaleString()}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{m.product_name}</td>
                      <td style={tdStyle}>{m.branch_name}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: typeColor(m.movement_type).bg,
                          color: typeColor(m.movement_type).text,
                        }}>{m.movement_type}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{m.quantity}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {consolidatedByProduct.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 10, color: "#94a3b8" }}>Consolidado por producto</h4>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Producto</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedByProduct.map((r) => (
                    <tr key={r.product_name}>
                      <td style={tdStyle}>{r.product_name}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "#4ade80" }}>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── TAB REPORTE DIARIO ── */}
      {tab === "diario" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
            <input type="date" value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              style={{ ...styles.input, width: "auto", marginBottom: 0 }} />
            <button style={styles.button} onClick={loadReport} disabled={loadingReport}>
              {loadingReport ? "Cargando..." : "🔍 Generar reporte"}
            </button>
            {report && (
              <>
                <button style={{ ...styles.button, background: "#1d4ed8" }} onClick={exportReporte}>⬇ Excel</button>
                <button style={{ ...styles.button, background: "#475569" }} onClick={printReport}>🖨 Imprimir</button>
              </>
            )}
          </div>

          {!report && !loadingReport && (
            <p style={{ color: "#64748b", textAlign: "center", padding: "30px 0" }}>
              Selecciona una fecha y haz clic en "Generar reporte"
            </p>
          )}

          {report && (
            <div style={{ overflowX: "auto" }}>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                Reporte del {report.date} — {report.rows.length} productos
              </p>
              <table style={tblStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: "left", minWidth: 140 }}>Producto</th>
                    <th style={{ ...thStyle, background: "#1e3a5f", color: "#93c5fd" }}>Producción</th>
                    <th style={{ ...thStyle, background: "#0c4a6e", color: "#7dd3fc" }}>Cuarto Frío</th>
                    <th style={{ ...thStyle, background: "#7c2d12", color: "#fdba74" }}>Horneado</th>
                    {report.branches.map((b) => (
                      <th key={b.id} style={{ ...thStyle, background: "#1e1b4b", color: "#a5b4fc" }}>
                        {b.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r) => {
                    const allZero = r.produccion === 0 && r.cuarto_frio === 0 && r.horneo === 0
                      && report.branches.every(b => (r.sedes[b.id] ?? 0) === 0);
                    return (
                      <tr key={r.product_id} style={{ opacity: allZero ? 0.45 : 1 }}>
                        <td style={{ ...tdStyle, textAlign: "left", fontWeight: 600 }}>
                          {r.product_name}
                        </td>
                        <td style={numCell(r.produccion)}>{r.produccion}</td>
                        <td style={numCell(r.cuarto_frio)}>{r.cuarto_frio}</td>
                        <td style={numCell(r.horneo)}>{r.horneo}</td>
                        {report.branches.map((b) => {
                          const val = r.sedes[b.id] ?? 0;
                          return <td key={b.id} style={numCell(val)}>{val}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function typeColor(type) {
  const t = (type || "").toUpperCase();
  if (t === "VENTA")            return { bg: "#450a0a", text: "#fca5a5" };
  if (t === "HORNEO")           return { bg: "#431407", text: "#fdba74" };
  if (t === "PRODUCCION")       return { bg: "#052e16", text: "#4ade80" };
  if (t === "DESPACHO_SALIDA")  return { bg: "#1e1b4b", text: "#a5b4fc" };
  if (t === "DESPACHO_ENTRADA") return { bg: "#0c4a6e", text: "#7dd3fc" };
  return { bg: "#1e293b", text: "#94a3b8" };
}

function numCell(val) {
  return {
    ...tdStyle,
    textAlign: "right",
    fontWeight: val > 0 ? 700 : 400,
    color: val > 0 ? "#f1f5f9" : "#475569",
  };
}

const tblStyle = {
  width: "100%", borderCollapse: "collapse", fontSize: 13,
};
const thStyle = {
  padding: "8px 12px", background: "#0f172a", color: "#94a3b8",
  fontWeight: 600, textAlign: "center", borderBottom: "1px solid #334155",
  whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "8px 12px", borderBottom: "1px solid #1e293b",
  color: "#cbd5e1", textAlign: "center",
};

export default InventoryMovements;
