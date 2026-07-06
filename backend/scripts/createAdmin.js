// Bootstrap: crea el primer usuario admin de Nexus.
// Uso: node scripts/createAdmin.js correo@ejemplo.com tuContraseña
require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("../db");

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log("Uso: node scripts/createAdmin.js <email> <password>");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    "INSERT INTO usuarios (email, password, role) VALUES (?, ?, ?)",
    [email, hashedPassword, "admin"]
  );

  console.log(`Admin de Nexus creado: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
