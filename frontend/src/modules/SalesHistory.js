import { useState } from "react";
import * as XLSX from "xlsx";

function SalesHistory({ sales, permissions, styles }) {
  const [filterDate, setFilterDate] = useState("");

  if (!permissions.includes("view_sales")) return null;

  const today = new Date().toISOString().split("T")[0];

  const filteredSales = sales.filter((s) => {
    const saleDate = new Date(s.created_at).toISOString().split("T")[0];
    return saleDate === (filterDate || today);
  });

  const printTicket = (sale) => {
    let content = `
      <div style="font-family:Arial;padding:10px">
        <h2>🧾 Nexus</h2>
        <hr/>
        <p>Venta #${sale.id}</p>
    `;

    if (Array.isArray(sale.items)) {
      sale.items.forEach((item) => {
        content += `
          <p>
            ${item.name} x ${item.quantity}
            = $${item.price * item.quantity}
          </p>
        `;
      });
    }

    content += `
        <hr/>
        <h3>Total: $${sale.total}</h3>
      </div>
    `;

    const win = window.open("", "", "width=350,height=600");
    win.document.write(content);
    win.document.close();
    win.focus();
    win.print();
  };

  const exportToExcel = () => {
    const data = filteredSales.map((sale) => ({
      ID: sale.id,
      Total: sale.total,
      Fecha: new Date(sale.created_at).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Ventas");

    XLSX.writeFile(
      wb,
      `ventas-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  return (
    <div style={styles.card}>
      <h3>Historial</h3>

      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        style={styles.input}
      />

      <button style={styles.button} onClick={exportToExcel}>
        Exportar Excel
      </button>

      {filteredSales.map((s) => (
        <div key={s.id} style={styles.card}>
          <strong>
            Venta #{s.id} - ${Number(s.total).toLocaleString()}
          </strong>

          {Array.isArray(s.items) &&
            s.items.map((item, index) => (
              <div key={item.id || index}>
                {item.name} x{item.quantity}
              </div>
            ))}

          <button onClick={() => printTicket(s)}>🧾</button>
        </div>
      ))}
    </div>
  );
}

export default SalesHistory;
