const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Definindo os endpoints da API para Categorias
router.post('/', categoriaController.criarCategoria);
router.get('/', categoriaController.listarCategorias);
router.get('/:id', categoriaController.listarCategoriaById);

module.exports = router;