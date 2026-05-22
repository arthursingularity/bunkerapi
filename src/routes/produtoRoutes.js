const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const authMiddleware = require('../middlewares/authMiddleware'); // Vamos criar isso abaixo!

// Todas as rotas de produtos passam a ser protegidas pelo authMiddleware
router.use(authMiddleware);

router.post('/', produtoController.criarProduto);
router.get('/', produtoController.listarProdutos);
router.get('/:id', produtoController.obterProdutoPorId);
router.put('/:id', produtoController.atualizarProduto);
router.delete('/:id', produtoController.deletarProduto);

module.exports = router;