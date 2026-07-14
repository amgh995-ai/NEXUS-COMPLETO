const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

// CREAR VENTA
router.post(
  "/sales",
  auth,
  role(["admin", "vendedor"]),
  async (req, res) => {
    const { items, payment_method } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "Carrito vacío" });

    if (!req.user.branch_id)
      return res.status(400).json({ message: "Usuario sin sede asignada" });

    const validMethods = ["efectivo", "transferencia", "tarjeta"];
    if (!payment_method || !validMethods.includes(payment_method))
      return res.status(400).json({ message: "Medio de pago inválido" });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let total = 0;
      const validatedItems = [];

      for (const item of items) {
        const [[row]] = await conn.query(
          `SELECT bi.stock, p.price, p.name
           FROM branch_inventory bi
           JOIN products p ON p.id = bi.product_id
           WHERE bi.product_id = ? AND bi.branch_id = ?
           FOR UPDATE`,
          [item.id, req.user.branch_id]
        );

        if (!row) {
          await conn.rollback();
          return res.status(400).json({ message: `Producto ${item.id} no existe en esta sede` });
        }
        if (row.stock < item.quantity) {
          await conn.rollback();
          return res.status(400).json({ message: `Stock insuficiente para ${row.name}` });
        }

        const price = Number(row.price);
        validatedItems.push({ id: item.id, name: row.name, price, quantity: item.quantity });
        total += price * item.quantity;
      }

      const [saleResult] = await conn.query(
        "INSERT INTO sales (total, branch_id, payment_method) VALUES (?, ?, ?)",
        [total, req.user.branch_id, payment_method]
      );
      const saleId = saleResult.insertId;

      for (const item of validatedItems) {
        await conn.query(
          "INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [saleId, item.id, item.quantity, item.price]
        );
        await conn.query(
          "UPDATE branch_inventory SET stock = stock - ? WHERE product_id = ? AND branch_id = ?",
          [item.quantity, item.id, req.user.branch_id]
        );
        await conn.query(
          "INSERT INTO inventory_movements (branch_id, product_id, quantity, movement_type) VALUES (?, ?, ?, ?)",
          [req.user.branch_id, item.id, item.quantity, "VENTA"]
        );
      }

      await conn.commit();
      res.json({ message: "Venta guardada correctamente", saleId, total });
    } catch (error) {
      await conn.rollback();
      console.error("Error guardando venta:", error);
      res.status(500).json({ error: "Error guardando venta" });
    } finally {
      conn.release();
    }
  }
);

// GET SALES
router.get(
  "/sales",
  auth,
  role(["admin", "vendedor"]),
  async (req, res) => {
    try {
      let query = `
        SELECT
          s.id AS sale_id,
          s.total,
          s.branch_id,
          s.payment_method,
          s.created_at,
          si.id AS item_id,
          si.product_id,
          si.quantity,
          si.price,
          p.name
        FROM sales s
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN products p ON p.id = si.product_id
      `;
      const params = [];
      if (req.user.role !== "admin") {
        query += " WHERE s.branch_id = ? ";
        params.push(req.user.branch_id);
      }
      query += " ORDER BY s.id DESC, si.id ASC ";

      const [rows] = await db.query(query, params);
      const salesMap = new Map();
      for (const row of rows) {
        if (!salesMap.has(row.sale_id)) {
          salesMap.set(row.sale_id, {
            id: row.sale_id,
            total: row.total,
            branch_id: row.branch_id,
            payment_method: row.payment_method,
            created_at: row.created_at,
            items: [],
          });
        }
        if (row.item_id) {
          salesMap.get(row.sale_id).items.push({
            id: row.item_id,
            product_id: row.product_id,
            quantity: row.quantity,
            price: row.price,
            name: row.name,
          });
        }
      }
      res.json(Array.from(salesMap.values()));
    } catch (error) {
      console.error("Error obteniendo ventas:", error);
      res.status(500).json({ error: "Error obteniendo ventas" });
    }
  }
);

module.exports = router;
