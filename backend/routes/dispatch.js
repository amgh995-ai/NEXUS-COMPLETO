const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middlewares/authMiddleware");
const permission = require("../middlewares/permissionMiddleware");
const PERMISSIONS = require("../constants/permissions");
const { getCentralBranchId } = require("../utils/centralBranch");

// STOCK DISPONIBLE EN PLANTA CENTRAL PARA DESPACHAR
router.get(
  "/dispatch/plant-stock",
  auth,
  permission(PERMISSIONS.DISPATCH),
  async (req, res) => {
    try {
      const centralBranchId = await getCentralBranchId(db);

      const [rows] = await db.query(
        `
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          COALESCE(bi.stock, 0) AS stock
        FROM products p
        LEFT JOIN branch_inventory bi
          ON bi.product_id = p.id AND bi.branch_id = ?
        ORDER BY p.name
        `,
        [centralBranchId]
      );

      res.json(rows);
    } catch (error) {
      console.error("Error obteniendo stock de planta:", error);
      res.status(500).json({ error: "Error obteniendo stock de planta" });
    }
  }
);

// HISTORIAL DE DESPACHOS
router.get(
  "/dispatch",
  auth,
  permission(PERMISSIONS.DISPATCH),
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          d.id,
          d.product_id,
          p.name AS product_name,
          d.quantity,
          d.destination_branch_id,
          b.name AS destination_branch_name,
          d.created_at
        FROM dispatch d
        JOIN products p ON p.id = d.product_id
        JOIN branches b ON b.id = d.destination_branch_id
        ORDER BY d.created_at DESC
      `);

      res.json(rows);
    } catch (error) {
      console.error("Error obteniendo historial de despacho:", error);
      res
        .status(500)
        .json({ error: "Error obteniendo historial de despacho" });
    }
  }
);

// DESPACHAR: descuenta de Planta Central y suma a la sede destino
router.post(
  "/dispatch",
  auth,
  permission(PERMISSIONS.DISPATCH),
  async (req, res) => {
    const { product_id, quantity, destination_branch_id } = req.body;

    if (!product_id || !quantity || quantity <= 0 || !destination_branch_id) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const centralBranchId = await getCentralBranchId(conn);

      if (Number(destination_branch_id) === Number(centralBranchId)) {
        await conn.rollback();
        return res.status(400).json({
          message: "La sede destino no puede ser la Planta Central",
        });
      }

      const [[centralStock]] = await conn.query(
        "SELECT stock FROM branch_inventory WHERE branch_id = ? AND product_id = ? FOR UPDATE",
        [centralBranchId, product_id]
      );

      if (!centralStock || centralStock.stock < quantity) {
        await conn.rollback();
        return res.status(400).json({
          message: "No hay suficiente stock en Planta Central",
        });
      }

      await conn.query(
        "UPDATE branch_inventory SET stock = stock - ? WHERE branch_id = ? AND product_id = ?",
        [quantity, centralBranchId, product_id]
      );

      await conn.query(
        `
        INSERT INTO branch_inventory (branch_id, product_id, stock)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE stock = stock + ?
        `,
        [destination_branch_id, product_id, quantity, quantity]
      );

      await conn.query(
        "INSERT INTO dispatch (product_id, quantity, destination_branch_id, created_by) VALUES (?, ?, ?, ?)",
        [product_id, quantity, destination_branch_id, req.user.id]
      );

      await conn.query(
        "INSERT INTO inventory_movements (branch_id, product_id, quantity, movement_type) VALUES (?, ?, ?, ?)",
        [centralBranchId, product_id, quantity, "DESPACHO_SALIDA"]
      );

      await conn.query(
        "INSERT INTO inventory_movements (branch_id, product_id, quantity, movement_type) VALUES (?, ?, ?, ?)",
        [destination_branch_id, product_id, quantity, "DESPACHO_ENTRADA"]
      );

      await conn.commit();

      res.json({ message: "Despacho registrado correctamente" });
    } catch (error) {
      await conn.rollback();
      console.error("Error registrando despacho:", error);
      res.status(500).json({ error: "Error registrando despacho" });
    } finally {
      conn.release();
    }
  }
);

module.exports = router;
