const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protege todas as rotas abaixo exigindo que o lojista esteja logado
router.use(authMiddleware);

router.post('/', usuarioController.criarUsuario);
router.get('/', usuarioController.listarUsuarios);
router.get('/:id', usuarioController.obterUsuarioPorId);
router.put('/:id', usuarioController.atualizarUsuario);
router.delete('/:id', usuarioController.deletarUsuario);

module.exports = router;