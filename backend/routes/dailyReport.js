const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middlewares/authMiddleware");

router.get("/daily-report", auth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];

    const [products] = await db.query(
      "SELECT id, name FROM products ORDER BY name"
    );

    const [branches] = await db.query(
      "SELECT id, name FROM branches WHERE name != 'Planta Central' ORDER BY name"
    );

    const [movements] = await db.query(
      `SELECT
         im.product_id,
         im.movement_type,
         SUM(im.quantity) AS total
       FROM inventory_movements im
       WHERE DATE(im.created_at) = ?
         AND im.movement_type IN ('PRODUCCION', 'HORNEO')
       GROUP BY im.product_id, im.movement_type`,
      [date]
    );

    const [coldRoomStock] = await db.query(
      "SELECT product_id, COALESCE(quantity, 0) AS quantity FROM cold_room"
    );

    const [stocks] = await db.query(
      `SELECT bi.product_id, bi.branch_id, bi.stock
       FROM branch_inventory bi
       JOIN branches b ON b.id = bi.branch_id
       WHERE b.name != 'Planta Central'`
    );

    const coldRoomMap = {};
    for (const c of coldRoomStock) {
      coldRoomMap[c.product_id] = Number(c.quantity);
    }

    const stockMap = {};
    for (const s of stocks) {
      if (!stockMap[s.product_id]) stockMap[s.product_id] = {};
      stockMap[s.product_id][s.branch_id] = Number(s.stock);
    }

    const movMap = {};
    for (const m of movements) {
      if (!movMap[m.product_id]) movMap[m.product_id] = { produccion: 0, horneo: 0 };
      const type = m.movement_type.toUpperCase();
      if (type === "PRODUCCION") movMap[m.product_id].produccion += Number(m.total);
      if (type === "HORNEO")     movMap[m.product_id].horneo     += Number(m.total);
    }

    const rows = products.map((p) => {
      const mov = movMap[p.id] || { produccion: 0, horneo: 0 };
      const sedeStocks = {};
      for (const b of branches) {
        sedeStocks[b.id] = stockMap[p.id]?.[b.id] ?? 0;
      }
      return {
        product_id:   p.id,
        product_name: p.name,
        produccion:   mov.produccion,
        cuarto_frio:  coldRoomMap[p.id] ?? 0,
        horneo:       mov.horneo,
        sedes:        sedeStocks,
      };
    });

    res.json({ date, branches, rows });
  } catch (error) {
    console.error("Error en reporte diario:", error);
    res.status(500).json({ error: "Error generando reporte diario" });
  }
});

module.exports = router;