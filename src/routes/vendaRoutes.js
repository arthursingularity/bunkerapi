const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas de vendas passam a ser protegidas pelo authMiddleware
router.use(authMiddleware);

router.post('/', vendaController.registrarVenda);
router.get('/', vendaController.listarVendas);
router.delete('/:id', vendaController.excluirVenda);

module.exports = router;
