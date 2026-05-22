const { prisma } = require('../config/database');

// 1. CREATE - Criar uma nova empresa
const criarEmpresa = async (req, res) => {
    try {
        const { nome_fantasia, razao_social, cnpj } = req.body;

        const novaEmpresa = await prisma.empresas.create({
            data: {
                nome_fantasia,
                razao_social: razao_social || null,
                cnpj: cnpj || null,
                ativo: true
            }
        });

        res.status(201).json({
            mensagem: 'Empresa cadastrada com sucesso!',
            empresa: novaEmpresa
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar empresa.' });
    }
};

// 2. READ ALL - Listar todas as empresas
const listarEmpresas = async (req, res) => {
    try {
        const empresas = await prisma.empresas.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(empresas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar empresas.' });
    }
};

// 3. READ ONE - Buscar apenas uma empresa pelo ID
const obterEmpresaPorId = async (req, res) => {
    try {
        const empresa = await prisma.empresas.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!empresa) {
            return res.status(404).json({ erro: 'Empresa não encontrada.' });
        }

        res.json(empresa);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar empresa.' });
    }
};

// 4. UPDATE - Atualizar os dados de uma empresa
const atualizarEmpresa = async (req, res) => {
    try {
        const { nome_fantasia, razao_social, cnpj, ativo } = req.body;

        const empresaExistente = await prisma.empresas.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!empresaExistente) {
            return res.status(404).json({ erro: 'Empresa não encontrada.' });
        }

        const empresaAtualizada = await prisma.empresas.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nome_fantasia,
                razao_social,
                cnpj,
                ativo
            }
        });

        res.json({
            mensagem: 'Empresa atualizada com sucesso!',
            empresa: empresaAtualizada
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar empresa.' });
    }
};

// 5. DELETE - Excluir uma empresa
const deletarEmpresa = async (req, res) => {
    try {
        const empresaExistente = await prisma.empresas.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!empresaExistente) {
            return res.status(404).json({ erro: 'Empresa não encontrada.' });
        }

        await prisma.empresas.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ mensagem: 'Empresa deletada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao deletar empresa.' });
    }
};

module.exports = {
    criarEmpresa,
    listarEmpresas,
    obterEmpresaPorId,
    atualizarEmpresa,
    deletarEmpresa
};