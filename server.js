// ============================================================
// DESAFIO 1 MILHÃO DE MINUTOS — SERVIDOR LOCAL (DEV)
// Em produção (Vercel) quem é usado é api/index.js,
// que importa o mesmo app a partir de api/_app.js.
// ============================================================
const app = require('./api/_app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📚 Desafio 1 Milhão de Minutos — Backend API\n`);
});
