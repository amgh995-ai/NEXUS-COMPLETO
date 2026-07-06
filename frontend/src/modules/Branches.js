import { useState } from "react";

function Branches({ branches, canCreate, onCreate, styles }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const handleCreate = async () => {
    await onCreate({ name, address });
    setName("");
    setAddress("");
  };

  return (
    <div style={styles.card}>
      <h3>🏢 Sedes</h3>

      {Array.isArray(branches) &&
        branches.map((b) => (
          <div key={b.id} style={styles.row}>
            <span>
              {b.name} - {b.address}
            </span>
          </div>
        ))}

      {canCreate && (
        <>
          <input
            style={styles.input}
            placeholder="Nombre sede"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Dirección"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button style={styles.button} onClick={handleCreate}>
            Crear sede
          </button>
        </>
      )}
    </div>
  );
}

export default Branches;
