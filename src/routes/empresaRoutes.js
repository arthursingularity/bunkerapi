const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');

// Definindo os endpoints da API para Empresas
router.post('/', empresaController.criarEmpresa);           // POST /api/empresas
router.get('/', empresaController.listarEmpresas);          // GET /api/empresas
router.get('/:id', empresaController.obterEmpresaPorId);    // GET /api/empresas/1
router.put('/:id', empresaController.atualizarEmpresa);     // PUT /api/empresas/1
router.delete('/:id', empresaController.deletarEmpresa);    // DELETE /api/empresas/1

module.exports = router;