const CENTRAL_BRANCH_NAME = "Planta Central";

let cachedId = null;

// Devuelve el id de la sede virtual "Planta Central".
// Se cachea en memoria porque no cambia en caliente; si no existe,
// lanza un error explicando que falta correr la migración.
async function getCentralBranchId(conn) {
  if (cachedId) return cachedId;

  const [rows] = await conn.query(
    "SELECT id FROM branches WHERE name = ? LIMIT 1",
    [CENTRAL_BRANCH_NAME]
  );

  if (rows.length === 0) {
    const error = new Error(
      `No existe la sede "${CENTRAL_BRANCH_NAME}". Ejecuta la migración migrations/002_production_modules.sql`
    );
    error.status = 500;
    throw error;
  }

  cachedId = rows[0].id;
  return cachedId;
}

module.exports = { getCentralBranchId, CENTRAL_BRANCH_NAME };
