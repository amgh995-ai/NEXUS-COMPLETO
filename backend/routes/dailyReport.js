const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/authMiddleware");

// REPORTE DIARIO
// Devuelve una tabla cruzada: filas = productos, columnas = PRODUCCION +
// CUARTO_FRIO + HORNEO + cada sede con sus cantidades del día.
// Todos los productos aparecen aunque no tengan movimientos (LEFT JOIN).
router.get("/daily-report", auth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];

    // Todos los productos
    const [products] = await db.query(
      "SELECT id, name FROM products ORDER BY name"
    );

    // Todas las sedes reales (excluye Planta Central)
    const [branches] = await db.query(
      "SELECT id, name FROM branches WHERE name != 'Planta Central' ORDER BY name"
    );

    // Movimientos del día agrupados por producto, tipo y sede
    const [movements] = await db.query(
      `SELECT
         im.product_id,
         im.movement_type,
         im.branch_id,
         b.name AS branch_name,
         SUM(im.quantity) AS total
       FROM inventory_movements im
       JOIN branches b ON b.id = im.branch_id
       WHERE DATE(im.created_at) = ?
       GROUP BY im.product_id, im.movement_type, im.branch_id`,
      [date]
    );

    // Stock actual por producto en cada sede
    const [stocks] = await db.query(
      `SELECT bi.product_id, bi.branch_id, bi.stock
       FROM branch_inventory bi
       JOIN branches b ON b.id = bi.branch_id
       WHERE b.name != 'Planta Central'`
    );

    // Construir mapa: productId → { produccion, cuarto_frio, horneo, sedes:{branchId: qty} }
    const movMap = {};
    for (const m of movements) {
      if (!movMap[m.product_id]) movMap[m.product_id] = { produccion: 0, cuarto_frio: 0, horneo: 0, sedes: {} };
      const type = m.movement_type.toUpperCase();
      if (type === "PRODUCCION")      movMap[m.product_id].produccion  += Number(m.total);
      if (type === "HORNEO")          movMap[m.product_id].horneo       += Number(m.total);
      // DESPACHO_ENTRADA cuenta como llegada a cada sede
      if (type === "DESPACHO_ENTRADA") {
        movMap[m.product_id].sedes[m.branch_id] = (movMap[m.product_id].sedes[m.branch_id] || 0) + Number(m.total);
      }
      // VENTA resta del stock de la sede (se muestra como negativo para identificar)
      if (type === "VENTA") {
        movMap[m.product_id].sedes[m.branch_id] = (movMap[m.product_id].sedes[m.branch_id] || 0);
      }
    }

    // Stock map: productId → branchId → stock
    const stockMap = {};
    for (const s of stocks) {
      if (!stockMap[s.product_id]) stockMap[s.product_id] = {};
      stockMap[s.product_id][s.branch_id] = Number(s.stock);
    }

    // Armar filas
    const rows = products.map((p) => {
      const mov = movMap[p.id] || { produccion: 0, cuarto_frio: 0, horneo: 0, sedes: {} };
      const sedeStocks = {};
      for (const b of branches) {
        sedeStocks[b.id] = stockMap[p.id]?.[b.id] ?? 0;
      }

      return {
        product_id: p.id,
        product_name: p.name,
        produccion: mov.produccion,
        cuarto_frio: mov.cuarto_frio,
        horneo: mov.horneo,
        sedes: sedeStocks,
      };
    });

    res.json({ date, branches, rows });
  } catch (error) {
    console.error("Error en reporte diario:", error);
    res.status(500).json({ error: "Error generando reporte diario" });
  }
});

module.exports = router;
