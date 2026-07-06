const express = require("express");
const router = express.Router();

const db = require("../db");
const auth = require("../middlewares/authMiddleware");

// LISTAR SEDES
router.get("/branches", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM branches
      ORDER BY name
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo sedes:", error);
    res.status(500).json({ error: "Error obteniendo sedes" });
  }
});

// CREAR SEDE (solo admin)
router.post("/branches", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "No autorizado para crear sedes",
      });
    }

    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Nombre requerido" });
    }

    const [result] = await db.query(
      "INSERT INTO branches (name, address) VALUES (?, ?)",
      [name, address || ""]
    );

    res.json({ id: result.insertId, message: "Sede creada" });
  } catch (error) {
    console.error("Error creando sede:", error);
    res.status(500).json({ error: "Error creando sede" });
  }
});

module.exports = router;
