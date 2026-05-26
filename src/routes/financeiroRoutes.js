const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Rota de movimentações financeiras (extrato)
router.get('/', financeiroController.listarMovimentacoes);
router.post('/', financeiroController.criarMovimentacao);

// Rotas de Contas a Pagar
router.get('/contas-pagar', financeiroController.listarContasPagar);
router.post('/contas-pagar', financeiroController.criarContaPagar);
router.put('/contas-pagar/:id/pagar', financeiroController.pagarConta);

// Rotas de Contas a Receber
router.get('/contas-receber', financeiroController.listarContasReceber);
router.post('/contas-receber', financeiroController.criarContaReceber);
router.put('/contas-receber/:id/receber', financeiroController.receberConta);

// Rota de histórico de estoque
router.get('/movimentacoes-estoque', financeiroController.listarMovimentacoesEstoque);

module.exports = router;
