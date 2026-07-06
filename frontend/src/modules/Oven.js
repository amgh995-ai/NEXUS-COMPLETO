import { useState } from "react";
import { api } from "../api";

function Oven({ token, coldRoom, ovenHistory, permissions, onChanged, styles }) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  if (!permissions.includes("produce")) return null;

  const handleBake = async () => {
    if (!productId || !quantity || Number(quantity) <= 0) {
      return alert("Selecciona producto y cantidad válida");
    }

    try {
      await api.bakeOven(token, {
        product_id: productId,
        quantity: Number(quantity),
      });

      setQuantity("");
      await onChanged();
      alert("Horneo registrado 🔥");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.card}>
      <h3>🔥 Horneo</h3>

      <select
        style={styles.input}
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      >
        <option value="">Selecciona producto (desde cuarto frío)</option>

        {coldRoom.map((row) => (
          <option key={row.product_id} value={row.product_id}>
            {row.product_name} (disponible: {row.quantity})
          </option>
        ))}
      </select>

      <input
        style={styles.input}
        type="number"
        placeholder="Cantidad a hornear"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <button style={styles.button} onClick={handleBake}>
        Hornear
      </button>

      <h4>Historial de horneo</h4>

      {ovenHistory.length === 0 && <p>Sin horneos registrados</p>}

      {ovenHistory.map((row) => (
        <div key={row.id} style={styles.row}>
          <span>{row.product_name} x{row.quantity}</span>
          <span>{new Date(row.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default Oven;
