const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middlewares/authMiddleware");

// HISTORIAL DE MOVIMIENTOS DE INVENTARIO
router.get("/inventory-movements", auth, async (req, res) => {
  try {
    let query = `
      SELECT
        im.id,
        im.quantity,
        im.movement_type,
        im.created_at,
        p.name AS product_name,
        b.name AS branch_name
      FROM inventory_movements im
      JOIN products p ON p.id = im.product_id
      JOIN branches b ON b.id = im.branch_id
    `;

    const params = [];

    // Solo admin ve todas las sedes
    if (req.user.role !== "admin") {
      query += " WHERE im.branch_id = ? ";
      params.push(req.user.branch_id);
    }

    query += " ORDER BY im.created_at DESC ";

    const [rows] = await db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo movimientos:", error);
    res.status(500).json({ error: "Error obteniendo movimientos" });
  }
});

module.exports = router;
