import { useState } from "react";
import { api } from "../api";

function Products({ token, products, permissions, onChanged, onAddToCart, styles }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editId, setEditId] = useState(null);
  const [stockAdd, setStockAdd] = useState({});

  const resetForm = () => { setEditId(null); setName(""); setPrice(""); setStock(""); };

  const handleSave = async () => {
    if (!name.trim() || !price) return alert("Completa los campos ⚠️");
    try {
      const payload = { name: name.trim(), price: Number(price), stock: Number(stock || 0) };
      if (editId) await api.updateProduct(token, editId, payload);
      else        await api.createProduct(token, payload);
      resetForm();
      await onChanged();
      alert(editId ? "Producto actualizado ✅" : "Producto creado ✅");
    } catch (error) { alert(error.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    try { await api.deleteProduct(token, id); await onChanged(); }
    catch (error) { alert(error.message); }
  };

  const handleEdit = (p) => { setName(p.name || ""); setPrice(p.price || ""); setStock(p.stock || 0); setEditId(p.id); };

  const handleAddStock = async (id) => {
    const qty = Number(stockAdd[id]);
    if (!qty || qty <= 0) return alert("Cantidad inválida");
    try {
      await api.addStock(token, id, qty);
      setStockAdd(prev => ({ ...prev, [id]: "" }));
      await onChanged();
    } catch (error) { alert(error.message); }
  };

  return (
    <>
      {permissions.includes("products_create") && (
        <div style={styles.card}>
          <h3 style={{ marginBottom: 14 }}>{editId ? "✏️ Editar producto" : "➕ Nuevo producto"}</h3>
          <input style={styles.input} placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={styles.input} type="number" placeholder="Precio" value={price} onChange={(e) => setPrice(e.target.value)} />
          <input style={styles.input} type="number" placeholder="Stock inicial" value={stock} onChange={(e) => setStock(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.button} onClick={handleSave}>{editId ? "Actualizar" : "Crear"}</button>
            {editId && <button style={{ ...styles.button, background: "#475569" }} onClick={resetForm}>Cancelar</button>}
          </div>
        </div>
      )}

      {permissions.includes("products_view") && (
        <div style={styles.card}>
          <h3 style={{ marginBottom: 14 }}>📦 Productos</h3>
          {!Array.isArray(products) || products.length === 0
            ? <p style={{ color: "#94a3b8" }}>Sin productos registrados</p>
            : products.map((p) => (
              <div key={p.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                marginBottom: 8,
                background: "#0f172a",
                borderRadius: 8,
                border: `1px solid ${Number(p.stock) === 0 ? "#7f1d1d" : "#334155"}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    ${Number(p.price).toLocaleString()}
                    {" · "}
                    <span style={{ color: Number(p.stock) === 0 ? "#f87171" : "#4ade80", fontWeight: 600 }}>
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button onClick={() => onAddToCart(p)} title="Agregar al carrito"
                    style={{ ...btnSmall, background: "#1e3a5f", color: "#93c5fd" }}>
                    🛒
                  </button>

                  {permissions.includes("products_edit") && (
                    <button onClick={() => handleEdit(p)} title="Editar" style={btnSmall}>✏️</button>
                  )}

                  {permissions.includes("products_delete") && (
                    <button onClick={() => handleDelete(p.id)} title="Eliminar"
                      style={{ ...btnSmall, background: "#7f1d1d", color: "#fca5a5" }}>✕</button>
                  )}

                  {permissions.includes("inventory_edit") && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        type="number"
                        placeholder="+qty"
                        value={stockAdd[p.id] || ""}
                        onChange={(e) => setStockAdd(prev => ({ ...prev, [p.id]: e.target.value }))}
                        style={{ width: 64, padding: "5px 8px", background: "#1e293b", border: "1px solid #475569", borderRadius: 6, color: "#fff", fontSize: 12 }}
                      />
                      <button onClick={() => handleAddStock(p.id)} style={{ ...btnSmall, background: "#14532d", color: "#86efac" }}>
                        📦+
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
}

const btnSmall = {
  padding: "5px 10px", border: "1px solid #475569", borderRadius: 6,
  background: "#1e293b", color: "#cbd5e1", cursor: "pointer", fontSize: 13,
};

export default Products;
