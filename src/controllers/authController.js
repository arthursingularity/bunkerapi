const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

const registrar = async (req, res) => {
    const { nome, email, senha, cargo } = req.body;

    try {
        // 1. Verifica se o e-mail já existe
        const userExistente = await prisma.usuarios.findUnique({
            where: { email }
        });

        if (userExistente) {
            return res.status(400).json({ erro: 'Este e-mail já está em uso.' });
        }

        // 2. Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // 3. Cria o usuário no banco de dados
        const novoUsuario = await prisma.usuarios.create({
            data: {
                nome,
                email,
                senha: senhaHash,
                cargo: cargo || 'vendedor',
                ativo: true
            },
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true
            }
        });

        // 4. Responde com sucesso (sem devolver a senha criptografada)
        res.status(201).json({
            mensagem: 'Usuário criado com sucesso!',
            usuario: novoUsuario
        });

    } catch (error) {
        console.error("ERRO NO REGISTRO:", error);
        res.status(500).json({ erro: 'Erro interno ao criar usuário.' });
    }
};

const login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        // 1. Buscar o usuário no banco de dados
        const user = await prisma.usuarios.findUnique({
            where: { email },
            select: {
                id: true,
                nome: true,
                email: true,
                senha: true,
                cargo: true,
                empresa_id: true,
                img_url: true
            }
        });

        // 2. Se o usuário não existir
        if (!user) {
            return res.status(401).json({ erro: 'E-mail não cadastrado.' });
        }

        // 3. Comparar a senha
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }

        // 4. Gerar o Token JWT
        const token = jwt.sign(
            {
                id: user.id,
                cargo: user.cargo,
                empresa_id: user.empresa_id
            },
            process.env.JWT_SECRET || 'segredo_padrao',
            { expiresIn: '1d' }
        );

        // 5. Devolver sucesso!
        res.json({
            id: user.id,
            nome: user.nome,
            email: user.email,
            cargo: user.cargo,
            empresa_id: user.empresa_id,
            img_url: user.img_url,
            token: token
        });

    } catch (error) {
        console.error("ERRO NO LOGIN:", error);
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
};

module.exports = {
    login,
    registrar
};