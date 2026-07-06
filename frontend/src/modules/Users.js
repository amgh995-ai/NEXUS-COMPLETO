import { useState } from "react";
import { api } from "../api";

function Users({ token, users, branches, permissions, onChanged, styles }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("vendedor");

  const handleCreate = async () => {
    if (!email || !password) {
      return alert("Completa datos");
    }

    try {
      await api.createUser(token, { email, password, role });

      setEmail("");
      setPassword("");
      setRole("vendedor");

      await onChanged();

      alert("Usuario creado 🔥");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateRole = async (id, newRole) => {
    try {
      await api.updateUserRole(token, id, newRole);
      await onChanged();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateBranch = async (id, branchId) => {
    try {
      await api.updateUserBranch(token, id, branchId);
      await onChanged();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar usuario?")) return;

    try {
      await api.deleteUser(token, id);
      await onChanged();
      alert("Usuario eliminado ✅");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      {permissions.includes("users_create") && (
        <div style={styles.card}>
          <h3>Crear usuario</h3>

          <input
            style={styles.input}
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <select
            style={styles.input}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="vendedor">vendedor</option>
            <option value="hornero">hornero</option>
            <option value="despacho">despacho</option>
            <option value="jefe_produccion">jefe_produccion</option>
            <option value="admin">admin</option>
          </select>

          <button style={styles.button} onClick={handleCreate}>
            Crear usuario
          </button>
        </div>
      )}

      {permissions.includes("users_view") && (
        <div style={styles.card}>
          <h3>Usuarios</h3>

          {Array.isArray(users) &&
            users.map((u) => (
              <div key={u.id} style={styles.row}>
                <span>
                  {u.email} - {u.role}
                </span>

                <div style={{ display: "flex", gap: 5 }}>
                  {permissions.includes("users_edit") && (
                    <>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      >
                        <option value="admin">admin</option>
                        <option value="vendedor">vendedor</option>
                        <option value="hornero">hornero</option>
                        <option value="despacho">despacho</option>
                        <option value="jefe_produccion">jefe_produccion</option>
                      </select>

                      <select
                        value={u.branch_id || ""}
                        onChange={(e) => handleUpdateBranch(u.id, e.target.value)}
                      >
                        <option value="">Sin sede</option>

                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  {permissions.includes("users_delete") && (
                    <button onClick={() => handleDelete(u.id)}>❌</button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
}

export default Users;
