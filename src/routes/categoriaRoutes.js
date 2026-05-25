const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Definindo os endpoints da API para Categorias
router.post('/', categoriaController.criarCategoria);
router.get('/', categoriaController.listarCategorias);
router.delete('/nome', categoriaController.deletarCategoriasPorNome);
router.delete('/codigo/:codigo', categoriaController.deletarCategoriasPorCodigo);
router.get('/:id', categoriaController.listarCategoriaById);
router.delete('/:id', categoriaController.deletarCategoria);

module.exports = router;