function Cart({ cart, permissions, onIncrease, onDecrease, onRemove, onCheckout, styles }) {
  if (!permissions.includes("create_sales")) return null;

  const total = cart.reduce((acc, p) => acc + p.price * p.quantity, 0);

  return (
    <div style={styles.card}>
      <h3>Carrito</h3>

      {cart.length === 0 && <p>No hay productos en el carrito</p>}

      {cart.map((p) => (
        <div key={p.id} style={styles.row}>
          <span>
            {p.name} x{p.quantity}
            {" - $"}
            {p.price * p.quantity}
          </span>

          <div>
            <button onClick={() => onDecrease(p)}>➖</button>
            <button onClick={() => onIncrease(p)}>➕</button>
            <button onClick={() => onRemove(p.id)}>❌</button>
          </div>
        </div>
      ))}

      <h2>Total: ${Number(total).toLocaleString()}</h2>

      <button style={styles.button} onClick={onCheckout}>
        Finalizar venta
      </button>
    </div>
  );
}

export default Cart;
