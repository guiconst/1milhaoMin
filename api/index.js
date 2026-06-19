// ============================================================
// VERCEL SERVERLESS ENTRYPOINT
// Todas as rotas /api/* caem aqui e são tratadas pelo Express app.
// ============================================================
const app = require('./_app');

module.exports = app;
