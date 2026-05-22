require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { prisma } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const vendaRoutes = require('./routes/vendaRoutes');

const app = express();

// Middlewares essenciais
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Permite que a URL da Vercel faça chamadas à API
  credentials: true
}));
app.use(express.json()); // Permite receber dados no formato JSON (ex: formulários)

app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/vendas', vendaRoutes);

// Rota de teste padrão
app.get('/', (req, res) => {
  res.json({ mensagem: 'API do sistema da Loja de Roupas rodando perfeitamente!' });
});

// Função para iniciar o servidor apenas se o banco conectar com sucesso
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Testa a conexão com o PostgreSQL via Prisma
    await prisma.$connect();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');

    // Inicia o servidor Express
    app.listen(PORT, () => {
      console.log(`Back-end rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
  }
}

// Executa a função
startServer();