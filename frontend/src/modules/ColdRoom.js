import { useState } from "react";
import { api } from "../api";

function ColdRoom({ token, products, coldRoom, permissions, onChanged, styles }) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  if (!permissions.includes("produce")) return null;

  const handleRegister = async () => {
    if (!productId || !quantity || Number(quantity) <= 0) {
      return alert("Selecciona producto y cantidad válida");
    }
    try {
      await api.registerProduction(token, {
        product_id: productId,
        quantity: Number(quantity),
      });
      setQuantity("");
      setProductId("");
      await onChanged();
      alert("Producción registrada en cuarto frío ❄️");
    } catch (error) {
      alert(error.message);
    }
  };

  const totalEnFrio = coldRoom.reduce((acc, r) => acc + Number(r.quantity), 0);

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 16 }}>❄️ Cuarto Frío</h3>

      <div style={{
        background: "#0f172a",
        border: "1px solid #334155",
        borderRadius: 8,
        padding: "14px 16px",
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
          Registrar producción
        </p>

        <select
          style={styles.input}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">Selecciona producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input
          style={styles.input}
          type="number"
          placeholder="Cantidad producida"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <button style={styles.button} onClick={handleRegister}>
          + Registrar producción
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ color: "#94a3b8" }}>Stock en cuarto frío</h4>
        <span style={{
          background: "#0c4a6e",
          color: "#7dd3fc",
          borderRadius: 20,
          padding: "3px 12px",
          fontSize: 12,
          fontWeight: 700,
        }}>
          Total: {totalEnFrio}
        </span>
      </div>

      {coldRoom.length === 0
        ? <p style={{ color: "#64748b", textAlign: "center", padding: "20px 0" }}>Sin productos registrados</p>
        : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>Producto</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Disponible para hornear</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {coldRoom.map((row) => {
                const qty = Number(row.quantity);
                return (
                  <tr key={row.product_id}>
                    <td style={tdStyle}>{row.product_name}</td>
                    <td style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontWeight: 700,
                      fontSize: 15,
                      color: qty > 0 ? "#4ade80" : "#475569",
                    }}>
                      {qty}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{
                        padding: "2px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: qty > 0 ? "#052e16" : "#1e293b",
                        color: qty > 0 ? "#4ade80" : "#475569",
                      }}>
                        {qty > 0 ? "Listo para hornear" : "Sin stock"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
    </div>
  );
}

const thStyle = {
  padding: "8px 12px",
  background: "#0f172a",
  color: "#64748b",
  fontWeight: 600,
  textAlign: "left",
  borderBottom: "1px solid #334155",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".05em",
};

const tdStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #1e293b",
  color: "#cbd5e1",
};

export default ColdRoom;