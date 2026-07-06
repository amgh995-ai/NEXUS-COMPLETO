const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

const auth = require("../middlewares/authMiddleware");
const permission = require("../middlewares/permissionMiddleware");
const PERMISSIONS = require("../constants/permissions");

// GET USERS
router.get(
  "/users",
  auth,
  permission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT id, email, role, branch_id
        FROM usuarios
        ORDER BY email
      `);

      res.json(rows);
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      res.status(500).json({ error: "Error obteniendo usuarios" });
    }
  }
);

// CREATE USER
router.post(
  "/users",
  auth,
  permission(PERMISSIONS.USERS_CREATE),
  async (req, res) => {
    try {
      const { email, password, role: userRole } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Faltan datos" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await db.query(
        "INSERT INTO usuarios (email, password, role) VALUES (?, ?, ?)",
        [email, hashedPassword, userRole || "vendedor"]
      );

      res.json({
        id: result.insertId,
        email,
        role: userRole || "vendedor",
      });
    } catch (error) {
      console.error("Error creando usuario:", error);
      res.status(500).json({ error: "Error creando usuario" });
    }
  }
);

// UPDATE ROLE
router.put(
  "/users/:id",
  auth,
  permission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role: newRole } = req.body;

      if (!newRole) {
        return res.status(400).json({ message: "Falta rol" });
      }

      await db.query("UPDATE usuarios SET role = ? WHERE id = ?", [
        newRole,
        id,
      ]);

      res.json({ message: "Rol actualizado" });
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      res.status(500).json({ error: "Error actualizando usuario" });
    }
  }
);

// DELETE USER
router.delete(
  "/users/:id",
  auth,
  permission(PERMISSIONS.USERS_DELETE),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db.query("DELETE FROM usuarios WHERE id = ?", [id]);

      res.json({ message: "Usuario eliminado" });
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      res.status(500).json({ error: "Error eliminando usuario" });
    }
  }
);

// CAMBIAR SEDE DE USUARIO
router.put(
  "/users/:id/branch",
  auth,
  permission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { branch_id } = req.body;

      await db.query("UPDATE usuarios SET branch_id = ? WHERE id = ?", [
        branch_id,
        req.params.id,
      ]);

      res.json({ message: "Sede actualizada correctamente" });
    } catch (error) {
      console.error("Error actualizando sede de usuario:", error);
      res.status(500).json({ error: "Error actualizando sede" });
    }
  }
);

module.exports = router;
