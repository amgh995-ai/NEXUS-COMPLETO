import { useState } from "react";
import { api } from "../api";

function Products({ token, products, permissions, onChanged, onAddToCart, styles }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editId, setEditId] = useState(null);

  const [stockAdd, setStockAdd] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setPrice("");
    setStock("");
  };

  const handleSave = async () => {
    if (!name.trim() || !price) {
      return alert("Completa los campos ⚠️");
    }

    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock || 0),
      };

      if (editId) {
        await api.updateProduct(token, editId, payload);
      } else {
        await api.createProduct(token, payload);
      }

      resetForm();
      await onChanged();

      alert(editId ? "Producto actualizado ✅" : "Producto creado ✅");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;

    try {
      await api.deleteProduct(token, id);
      await onChanged();
      alert("Producto eliminado ✅");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (product) => {
    setName(product.name || "");
    setPrice(product.price || "");
    setStock(product.stock || 0);
    setEditId(product.id);
  };

  const handleAddStock = async () => {
    if (!selectedProduct || !stockAdd) {
      return alert("Selecciona producto y cantidad");
    }

    try {
      await api.addStock(token, selectedProduct, Number(stockAdd));
      setStockAdd("");
      setSelectedProduct(null);
      await onChanged();
      alert("Stock actualizado 📦");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      {permissions.includes("products_create") && (
        <div style={styles.card}>
          <h3>Productos</h3>

          <input
            style={styles.input}
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            style={styles.input}
            type="number"
            placeholder="Precio"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            style={styles.input}
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />

          <button style={styles.button} onClick={handleSave}>
            {editId ? "Actualizar" : "Crear"}
          </button>
        </div>
      )}

      {permissions.includes("products_view") && (
        <div style={styles.card}>
          <h3>Productos</h3>

          {Array.isArray(products) &&
            products.map((p) => (
              <div key={p.id} style={styles.row}>
                <span>
                  {p.name} - ${Number(p.price).toLocaleString()}
                  {" | "}
                  Stock: {p.stock}
                </span>

                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => onAddToCart(p)}>🛒</button>

                  {permissions.includes("products_edit") && (
                    <button onClick={() => handleEdit(p)}>✏️</button>
                  )}

                  {permissions.includes("products_delete") && (
                    <button onClick={() => handleDelete(p.id)}>❌</button>
                  )}

                  {permissions.includes("inventory_edit") && (
                    <>
                      <input
                        type="number"
                        placeholder="+"
                        value={selectedProduct === p.id ? stockAdd : ""}
                        onChange={(e) => {
                          setSelectedProduct(p.id);
                          setStockAdd(e.target.value);
                        }}
                        style={{ width: 60 }}
                      />

                      <button onClick={handleAddStock}>📦+</button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
}

export default Products;
