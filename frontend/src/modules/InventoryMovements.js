import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

function InventoryMovements({ movements, permissions, styles }) {
  const [filterDate, setFilterDate] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterType, setFilterType] = useState("");

  const safeMovements = useMemo(() => {
  return Array.isArray(movements) ? movements : [];
}, [movements]);

  // Listas de opciones derivadas de los datos reales (sin estado propio
  // que pueda quedar desincronizado: si "movements" cambia, esto se
  // recalcula automáticamente).
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
      const current = map.get(m.product_name) || 0;
      map.set(m.product_name, current + Number(m.quantity));
    }

    return Array.from(map.entries()).map(([product_name, total]) => ({
      product_name,
      total,
    }));
  }, [filtered]);

  const consolidatedByBranch = useMemo(() => {
    const map = new Map();

    for (const m of filtered) {
      const current = map.get(m.branch_name) || 0;
      map.set(m.branch_name, current + Number(m.quantity));
    }

    return Array.from(map.entries()).map(([branch_name, total]) => ({
      branch_name,
      total,
    }));
  }, [filtered]);

  const exportToExcel = () => {
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

    XLSX.writeFile(
      wb,
      `movimientos-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const handlePrint = () => {
    let content = `
      <div style="font-family:Arial;padding:10px">
        <h2>📋 Reporte de Movimientos</h2>
        <table border="1" cellpadding="5" style="width:100%;border-collapse:collapse">
          <tr>
            <th>Fecha</th><th>Producto</th><th>Sede</th><th>Tipo</th><th>Cantidad</th>
          </tr>
    `;

    filtered.forEach((m) => {
      content += `
        <tr>
          <td>${new Date(m.created_at).toLocaleString()}</td>
          <td>${m.product_name}</td>
          <td>${m.branch_name}</td>
          <td>${m.movement_type}</td>
          <td>${m.quantity}</td>
        </tr>
      `;
    });

    content += "</table></div>";

    const win = window.open("", "", "width=700,height=800");
    win.document.write(content);
    win.document.close();
    win.focus();
    win.print();
  };

  if (!permissions.includes("inventory_view")) return null;

  return (
    <div style={styles.card}>
      <h3>📋 Reporte de Movimientos</h3>

      <input
        type="date"
        style={styles.input}
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
      />

      <select
        style={styles.input}
        value={filterProduct}
        onChange={(e) => setFilterProduct(e.target.value)}
      >
        <option value="">Todos los productos</option>

        {productOptions.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        style={styles.input}
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
      >
        <option value="">Todos los movimientos</option>

        {typeOptions.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
        <button style={styles.button} onClick={exportToExcel}>
          Exportar Excel
        </button>

        <button style={styles.button} onClick={handlePrint}>
          Imprimir
        </button>
      </div>

      <h4>Movimientos ({filtered.length})</h4>

      {filtered.map((m) => (
        <div key={m.id} style={styles.row}>
          <span>
            {m.product_name} - {m.movement_type} - {m.quantity}
          </span>
          <span>
            {m.branch_name} - {new Date(m.created_at).toLocaleString()}
          </span>
        </div>
      ))}

      <h4>Consolidado por producto</h4>

      {consolidatedByProduct.map((row) => (
        <div key={row.product_name} style={styles.row}>
          <span>{row.product_name}</span>
          <span>{row.total}</span>
        </div>
      ))}

      <h4>Consolidado por sede</h4>

      {consolidatedByBranch.map((row) => (
        <div key={row.branch_name} style={styles.row}>
          <span>{row.branch_name}</span>
          <span>{row.total}</span>
        </div>
      ))}
    </div>
  );
}

export default InventoryMovements;
