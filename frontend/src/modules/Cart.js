import { useState } from "react";

const PAYMENT_METHODS = [
  { value: "efectivo",       label: "💵 Efectivo" },
  { value: "transferencia",  label: "📲 Transferencia" },
  { value: "tarjeta",        label: "💳 Tarjeta" },
];

function Cart({ cart, permissions, onIncrease, onDecrease, onRemove, onCheckout, styles }) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashReceived, setCashReceived] = useState("");

  if (!permissions.includes("create_sales")) return null;

  const total = cart.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const change = paymentMethod === "efectivo" && cashReceived
    ? Number(cashReceived) - total
    : null;

  const handleCheckout = () => {
    if (!paymentMethod) return alert("Selecciona un medio de pago ⚠️");
    if (paymentMethod === "efectivo") {
      const cash = Number(cashReceived);
      if (!cashReceived || cash < total)
        return alert(`El efectivo recibido ($${cash.toLocaleString()}) es menor al total ($${total.toLocaleString()}) ⚠️`);
    }
    onCheckout(paymentMethod);
    setPaymentMethod("");
    setCashReceived("");
  };

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 16 }}>🛒 Carrito</h3>

      {cart.length === 0 && (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
          No hay productos en el carrito
        </p>
      )}

      {cart.map((p) => (
        <div key={p.id} style={{
          ...styles.row,
          background: "#0f172a",
          borderRadius: 8,
          border: "1px solid #334155",
          padding: "10px 14px",
          marginBottom: 8,
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              ${Number(p.price).toLocaleString()} × {p.quantity} = <strong style={{ color: "#22c55e" }}>${(p.price * p.quantity).toLocaleString()}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onDecrease(p)} style={btnSmall}>➖</button>
            <button onClick={() => onIncrease(p)} style={btnSmall}>➕</button>
            <button onClick={() => onRemove(p.id)} style={{ ...btnSmall, background: "#7f1d1d" }}>✕</button>
          </div>
        </div>
      ))}

      {cart.length > 0 && (
        <>
          <div style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "14px 16px",
            margin: "14px 0",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#22c55e", marginBottom: 14 }}>
              Total: ${Number(total).toLocaleString()}
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Medio de pago
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => { setPaymentMethod(m.value); setCashReceived(""); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: paymentMethod === m.value ? "2px solid #3b82f6" : "1px solid #475569",
                    background: paymentMethod === m.value ? "#1e3a5f" : "#1e293b",
                    color: paymentMethod === m.value ? "#93c5fd" : "#cbd5e1",
                    cursor: "pointer",
                    fontWeight: paymentMethod === m.value ? 700 : 400,
                    fontSize: 13,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === "efectivo" && (
              <div>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Efectivo recibido
                </p>
                <input
                  type="number"
                  placeholder={`Mínimo $${total.toLocaleString()}`}
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  style={{ ...styles.input, marginBottom: 8 }}
                />
                {change !== null && (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: change >= 0 ? "#052e16" : "#450a0a",
                    border: `1px solid ${change >= 0 ? "#166534" : "#991b1b"}`,
                    color: change >= 0 ? "#4ade80" : "#f87171",
                    fontWeight: 700,
                    fontSize: 16,
                  }}>
                    {change >= 0
                      ? `Vuelto: $${change.toLocaleString()}`
                      : `Faltan: $${Math.abs(change).toLocaleString()}`}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            style={{
              ...styles.button,
              width: "100%",
              padding: "12px",
              fontSize: 15,
              fontWeight: 700,
              opacity: !paymentMethod ? 0.5 : 1,
            }}
            onClick={handleCheckout}
          >
            Finalizar venta {paymentMethod ? `— ${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}` : ""}
          </button>
        </>
      )}
    </div>
  );
}

const btnSmall = {
  padding: "5px 10px",
  border: "1px solid #475569",
  borderRadius: 6,
  background: "#1e293b",
  color: "#cbd5e1",
  cursor: "pointer",
  fontSize: 13,
};

export default Cart;
