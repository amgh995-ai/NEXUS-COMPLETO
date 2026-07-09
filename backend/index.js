require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const usersRoutes = require("./routes/users");
const branchesRoutes = require("./routes/branches");
const inventoryMovementsRoutes = require("./routes/inventoryMovementsRoutes");
const coldRoomRoutes = require("./routes/coldRoom");
const ovenRoutes = require("./routes/oven");
const dispatchRoutes = require("./routes/dispatch");

const app = express();

// FRONTEND_URL puede contener varias URLs separadas por coma.
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
  : [];

allowedOrigins.push("http://localhost:3000");

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", productsRoutes);
app.use("/api", salesRoutes);
app.use("/api", usersRoutes);
app.use("/api", branchesRoutes);
app.use("/api", inventoryMovementsRoutes);
app.use("/api", coldRoomRoutes);
app.use("/api", ovenRoutes);
app.use("/api", dispatchRoutes);

app.get("/", (req, res) => {
  res.send("API Nexus funcionando 🚀");
});

// Solo abre puerto en desarrollo local; Vercel lo gestiona al importar el módulo.
if (require.main === module) {
  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`Nexus backend corriendo en puerto ${PORT}`);
  });
}

module.exports = app;
