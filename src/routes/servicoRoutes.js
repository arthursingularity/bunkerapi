const express = require('express');
const router = express.Router();
const servicoController = require('../controllers/servicoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota pública para acessar a nota fiscal de garantia
router.get('/public-garantia/:id', servicoController.obterGarantiaPublica);

router.use(authMiddleware);

// Definindo os endpoints da API para Serviços
router.post('/', servicoController.criarServico);
router.get('/', servicoController.listarServicos);
router.get('/:id', servicoController.obterServicoPorId);
router.put('/:id', servicoController.atualizarServico);
router.delete('/:id', servicoController.deletarServico);

module.exports = router;
