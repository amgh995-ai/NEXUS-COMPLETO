import { useState } from "react";
import { api } from "../api";

function Dispatch({
  token,
  plantStock,
  dispatchHistory,
  branches,
  permissions,
  onChanged,
  styles,
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [branchId, setBranchId] = useState("");

  if (!permissions.includes("dispatch")) return null;

  const destinationBranches = branches.filter(
    (b) => b.name !== "Planta Central"
  );

  const handleDispatch = async () => {
    if (!productId || !quantity || Number(quantity) <= 0 || !branchId) {
      return alert("Completa producto, cantidad y sede destino");
    }

    try {
      await api.createDispatch(token, {
        product_id: productId,
        quantity: Number(quantity),
        destination_branch_id: branchId,
      });

      setQuantity("");
      await onChanged();
      alert("Despacho registrado 🚚");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.card}>
      <h3>🚚 Despacho</h3>

      <select
        style={styles.input}
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      >
        <option value="">Selecciona producto (stock en planta)</option>

        {plantStock.map((row) => (
          <option key={row.product_id} value={row.product_id}>
            {row.product_name} (disponible: {row.stock})
          </option>
        ))}
      </select>

      <input
        style={styles.input}
        type="number"
        placeholder="Cantidad a despachar"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <select
        style={styles.input}
        value={branchId}
        onChange={(e) => setBranchId(e.target.value)}
      >
        <option value="">Selecciona sede destino</option>

        {destinationBranches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <button style={styles.button} onClick={handleDispatch}>
        Despachar
      </button>

      <h4>Historial de despachos</h4>

      {dispatchHistory.length === 0 && <p>Sin despachos registrados</p>}

      {dispatchHistory.map((row) => (
        <div key={row.id} style={styles.row}>
          <span>
            {row.product_name} x{row.quantity} → {row.destination_branch_name}
          </span>
          <span>{new Date(row.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default Dispatch;
