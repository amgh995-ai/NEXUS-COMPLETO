const mysql = require("mysql2");

// En serverless (Vercel), las funciones pueden reutilizar el proceso entre
// invocaciones cuando están "calientes". El patrón singleton evita abrir
// un pool nuevo en cada llamada y agota las conexiones disponibles en
// Railway. Si el proceso es nuevo, se crea; si ya existe, se reutiliza.
let pool;

function getPool() {
  if (pool) return pool.promise();

  // Railway expone la URL completa en DATABASE_URL.
  // Localmente puedes usar las variables individuales.
  if (process.env.DATABASE_URL) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 5,   // bajo para serverless (Vercel limita concurrencia)
      queueLimit: 10,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  } else {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "nexus",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool.promise();
}

module.exports = getPool();
