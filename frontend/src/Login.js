import { useState } from "react";
import { api } from "./api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Completa todos los campos ⚠️");
      return;
    }

    setLoading(true);

    try {
      const data = await api.login(email, password);

      if (data.token) {
        onLogin(data.token, data.user);
      } else {
        alert("No llegó token ❌");
      }
    } catch (error) {
      alert(error.message || "Error en login ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>🔐 Iniciar sesión</h2>

        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          id="password"
          name="password"
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleLogin} disabled={loading} style={styles.button}>
          {loading ? "Entrando..." : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#121212",
  },

  card: {
    background: "#1e1e1e",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
    width: "300px",
    textAlign: "center",
    color: "#fff",
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#2a2a2a",
    color: "#fff",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "10px",
    background: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Login;
