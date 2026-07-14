const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middlewares/authMiddleware");
const permission = require("../middlewares/permissionMiddleware");
const PERMISSIONS = require("../constants/permissions");
const { getCentralBranchId } = require("../utils/centralBranch");

router.get(
  "/cold-room",
  auth,
  permission(PERMISSIONS.PRODUCE),
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          p.id          AS product_id,
          p.name        AS product_name,
          COALESCE(cr.quantity, 0) AS quantity,
          cr.updated_at
        FROM products p
        LEFT JOIN cold_room cr ON cr.product_id = p.id
        ORDER BY p.name
      `);
      res.json(rows);
    } catch (error) {
      console.error("Error obteniendo cuarto frío:", error);
      res.status(500).json({ error: "Error obteniendo cuarto frío" });
    }
  }
);

router.post(
  "/cold-room/production",
  auth,
  permission(PERMISSIONS.PRODUCE),
  async (req, res) => {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const centralBranchId = await getCentralBranchId(conn);

      await conn.query(
        `INSERT INTO cold_room (product_id, quantity)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
        [product_id, quantity, quantity]
      );

      await conn.query(
        "INSERT INTO inventory_movements (branch_id, product_id, quantity, movement_type) VALUES (?, ?, ?, ?)",
        [centralBranchId, product_id, quantity, "PRODUCCION"]
      );

      await conn.commit();
      res.json({ message: "Producción registrada en cuarto frío" });
    } catch (error) {
      await conn.rollback();
      console.error("Error registrando producción:", error);
      res.status(500).json({ error: "Error registrando producción" });
    } finally {
      conn.release();
    }
  }
);

module.exports = router;