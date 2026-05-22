const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');

// 1. CREATE - Cadastrar um novo funcionário/usuário na mesma empresa
const criarUsuario = async (req, res) => {
    const { nome, email, senha, cargo } = req.body;
    const empresa_id = req.user.empresa_id; // Pega a empresa do dono logado

    try {
        // Verifica se o e-mail já existe em toda a base
        const userExistente = await prisma.usuarios.findUnique({
            where: { email }
        });

        if (userExistente) {
            return res.status(400).json({ erro: 'Este e-mail já está em uso.' });
        }

        // Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Cria o usuário vinculado à empresa
        const novoUsuario = await prisma.usuarios.create({
            data: {
                nome,
                email,
                senha: senhaHash,
                cargo: cargo || 'vendedor',
                ativo: true,
                empresa_id
            },
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true
            }
        });

        // Retorna sem a senha!
        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: novoUsuario
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
    }
};

// 2. READ ALL - Listar todos os usuários da empresa logada (com INNER JOIN para trazer o nome da empresa)
const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.usuarios.findMany({
            where: { empresa_id: req.user.empresa_id },
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
                ativo: true,
                empresa_id: true,
                createdAt: true,
                updatedAt: true,
                img_url: true,
                empresas: {
                    select: {
                        nome_fantasia: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });

        // Achatar o resultado para manter a mesma estrutura de resposta da API
        const resultado = usuarios.map(u => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
            cargo: u.cargo,
            ativo: u.ativo,
            empresa_id: u.empresa_id,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            nome_fantasia: u.empresas?.nome_fantasia,
            img_url: u.img_url
        }));

        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar usuários.' });
    }
};

// 3. READ ONE - Buscar um usuário específico
const obterUsuarioPorId = async (req, res) => {
    try {
        const usuario = await prisma.usuarios.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            },
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
                ativo: true,
                empresa_id: true,
                createdAt: true,
                updatedAt: true,
                img_url: true
            }
        });

        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        res.json(usuario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar usuário.' });
    }
};

// 4. UPDATE - Atualizar dados do usuário (exceto senha)
const atualizarUsuario = async (req, res) => {
    const { nome, email, cargo, ativo, img_url } = req.body;

    try {
        // Verifica se o usuário existe na empresa
        const usuarioExistente = await prisma.usuarios.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            }
        });

        if (!usuarioExistente) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        await prisma.usuarios.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nome,
                email,
                cargo,
                ativo,
                img_url
            }
        });

        res.json({ mensagem: 'Usuário atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
    }
};

// 5. DELETE - Excluir Usuário
const deletarUsuario = async (req, res) => {
    try {
        // Impede que o usuário delete a si mesmo
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(403).json({ erro: 'Você não pode excluir sua própria conta.' });
        }

        const usuarioExistente = await prisma.usuarios.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            }
        });

        if (!usuarioExistente) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        await prisma.usuarios.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ mensagem: 'Usuário excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao excluir usuário.' });
    }
};

module.exports = {
    criarUsuario,
    listarUsuarios,
    obterUsuarioPorId,
    atualizarUsuario,
    deletarUsuario
};