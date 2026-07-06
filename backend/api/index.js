// Punto de entrada para Vercel Serverless Functions.
// Vercel importa este módulo y llama a la función exportada por cada
// request: no ejecuta app.listen(), así que el servidor Express no
// abre ningún puerto (Vercel lo maneja).
const app = require("../index");

module.exports = app;
