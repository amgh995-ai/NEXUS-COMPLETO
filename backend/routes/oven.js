const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middlewares/authMiddleware");
const permission = require("../middlewares/permissionMiddleware");
const PERMISSIONS = require("../constants/permissions");
const { getCentralBranchId } = require("../utils/centralBranch");

// HISTORIAL DE HORNEOS
router.get(
  "/oven",
  auth,
  permission(PERMISSIONS.PRODUCE),
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          o.id,
          o.product_id,
          p.name AS product_name,
          o.quantity,
          o.created_at
        FROM oven o
        JOIN products p ON p.id = o.product_id
        ORDER BY o.created_at DESC
      `);

      res.json(rows);
    } catch (error) {
      console.error("Error obteniendo historial de horneo:", error);
      res.status(500).json({ error: "Error obteniendo historial de horneo" });
    }
  }
);

// HORNEAR: descuenta de cuarto frío y suma al stock de Planta Central
router.post(
  "/oven/bake",
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

      const [[coldRoomRow]] = await conn.query(
        "SELECT quantity FROM cold_room WHERE product_id = ? FOR UPDATE",
        [product_id]
      );

      if (!coldRoomRow || coldRoomRow.quantity < quantity) {
        await conn.rollback();
        return res.status(400).json({
          message: "No hay suficiente cantidad en cuarto frío",
        });
      }

      await conn.query(
        "UPDATE cold_room SET quantity = quantity - ? WHERE product_id = ?",
        [quantity, product_id]
      );

      await conn.query(
        `
        INSERT INTO branch_inventory (branch_id, product_id, stock)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE stock = stock + ?
        `,
        [centralBranchId, product_id, quantity, quantity]
      );

      await conn.query(
        "INSERT INTO oven (product_id, quantity, created_by) VALUES (?, ?, ?)",
        [product_id, quantity, req.user.id]
      );

      await conn.query(
        "INSERT INTO inventory_movements (branch_id, product_id, quantity, movement_type) VALUES (?, ?, ?, ?)",
        [centralBranchId, product_id, quantity, "HORNEO"]
      );

      await conn.commit();

      res.json({ message: "Horneo registrado correctamente" });
    } catch (error) {
      await conn.rollback();
      console.error("Error registrando horneo:", error);
      res.status(500).json({ error: "Error registrando horneo" });
    } finally {
      conn.release();
    }
  }
);

module.exports = router;
