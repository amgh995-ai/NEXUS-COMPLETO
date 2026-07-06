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
      await onChanged();
      alert("Producción registrada en cuarto frío ❄️");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.card}>
      <h3>❄️ Cuarto Frío</h3>

      <select
        style={styles.input}
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      >
        <option value="">Selecciona producto</option>

        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
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
        Registrar producción
      </button>

      <h4>Stock en cuarto frío</h4>

      {coldRoom.length === 0 && <p>Sin stock en cuarto frío</p>}

      {coldRoom.map((row) => (
        <div key={row.product_id} style={styles.row}>
          <span>{row.product_name}</span>
          <span>{row.quantity}</span>
        </div>
      ))}
    </div>
  );
}

export default ColdRoom;
