const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middlewares/authMiddleware");
const permission = require("../middlewares/permissionMiddleware");
const PERMISSIONS = require("../constants/permissions");

// GET PRODUCTS (con stock de la sede del usuario)
router.get(
  "/products",
  auth,
  permission(PERMISSIONS.PRODUCTS_VIEW),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `
        SELECT
          p.id,
          p.name,
          p.price,
          COALESCE(bi.stock, 0) AS stock
        FROM products p
        LEFT JOIN branch_inventory bi
          ON p.id = bi.product_id
        WHERE bi.branch_id = ?
        ORDER BY p.name
        `,
        [req.user.branch_id]
      );

      res.json(rows);
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      res.status(500).json({ error: "Error obteniendo productos" });
    }
  }
);

// CREATE PRODUCT (transaccional: producto + inventario inicial en todas las sedes)
router.post(
  "/products",
  auth,
  permission(PERMISSIONS.PRODUCTS_CREATE),
  async (req, res) => {
    const { name, price, stock = 0 } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        "INSERT INTO products (name, price) VALUES (?, ?)",
        [name, price]
      );

      const productId = result.insertId;

      const [branches] = await conn.query("SELECT id FROM branches");

      for (const branch of branches) {
        await conn.query(
          "INSERT INTO branch_inventory (branch_id, product_id, stock) VALUES (?, ?, ?)",
          [branch.id, productId, stock]
        );
      }

      await conn.commit();

      res.json({ id: productId, name, price, stock });
    } catch (err) {
      await conn.rollback();
      console.error("Error creando producto:", err);
      res.status(500).json({ error: "Error creando producto" });
    } finally {
      conn.release();
    }
  }
);

// UPDATE PRODUCT
router.put(
  "/products/:id",
  auth,
  permission(PERMISSIONS.PRODUCTS_EDIT),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price } = req.body;

      if (!name || !price) {
        return res.status(400).json({ message: "Faltan datos" });
      }

      const [result] = await db.query(
        "UPDATE products SET name = ?, price = ? WHERE id = ?",
        [name, price, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      res.json({ message: "Producto actualizado" });
    } catch (err) {
      console.error("Error actualizando producto:", err);
      res.status(500).json({ error: "Error actualizando producto" });
    }
  }
);

// DELETE PRODUCT (valida existencia, limpia inventario, protege historial)
router.delete(
  "/products/:id",
  auth,
  permission(PERMISSIONS.PRODUCTS_DELETE),
  async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [[product]] = await conn.query(
        "SELECT id FROM products WHERE id = ?",
        [id]
      );

      if (!product) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      await conn.query("DELETE FROM branch_inventory WHERE product_id = ?", [
        id,
      ]);
      await conn.query("DELETE FROM products WHERE id = ?", [id]);

      await conn.commit();

      res.json({ message: "Producto eliminado" });
    } catch (err) {
      await conn.rollback();
      console.error("Error eliminando producto:", err);

      if (
        err.code === "ER_ROW_IS_REFERENCED_2" ||
        err.code === "ER_ROW_IS_REFERENCED"
      ) {
        return res.status(409).json({
          error:
            "No se puede eliminar: el producto tiene ventas o movimientos asociados",
        });
      }

      res.status(500).json({ error: "Error eliminando producto" });
    } finally {
      conn.release();
    }
  }
);

// ACTUALIZAR STOCK (set directo, sede actual)
router.put(
  "/products/:id/stock",
  auth,
  permission(PERMISSIONS.INVENTORY_EDIT),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      if (stock === undefined) {
        return res.status(400).json({ message: "Falta stock" });
      }

      await db.query(
        "UPDATE branch_inventory SET stock = ? WHERE product_id = ? AND branch_id = ?",
        [stock, id, req.user.branch_id]
      );

      res.json({ message: "Stock actualizado" });
    } catch (error) {
      console.error("Error actualizando stock:", error);
      res.status(500).json({ error: "Error actualizando stock" });
    }
  }
);

// SUMAR STOCK (entrada de inventario, transaccional + trazabilidad)
router.put(
  "/products/:id/add-stock",
  auth,
  permission(PERMISSIONS.INVENTORY_EDIT),
  async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Cantidad inválida" });
    }

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(
        "UPDATE branch_inventory SET stock = stock + ? WHERE product_id = ? AND branch_id = ?",
        [quantity, id, req.user.branch_id]
      );

      await conn.query(
        "INSERT INTO inventory_movements (branch_id, product_id, quantity, movement_type) VALUES (?, ?, ?, ?)",
        [req.user.branch_id, id, quantity, "ENTRADA"]
      );

      await conn.commit();

      res.json({ message: "Stock agregado" });
    } catch (error) {
      await conn.rollback();
      console.error("Error agregando stock:", error);
      res.status(500).json({ error: "Error agregando stock" });
    } finally {
      conn.release();
    }
  }
);

module.exports = router;
