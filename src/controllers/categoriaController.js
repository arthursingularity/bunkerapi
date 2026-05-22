const { prisma } = require('../config/database');

const criarCategoria = async (req, res) => {
    try {
        const { nome, produto_codigo } = req.body;
        const empresa_id = req.user.empresa_id;

        const novaCategoria = await prisma.categorias.create({
            data: {
                empresa_id,
                nome,
                produto_codigo
            }
        });

        res.status(201).json({
            mensagem: 'Categoria cadastrada com sucesso!',
            categoria: novaCategoria
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar categoria.' });
    }
};

const listarCategorias = async (req, res) => {
    const empresa_id = req.user.empresa_id;

    try {
        const categorias = await prisma.categorias.findMany({
            where: { empresa_id },
            select: {
                id: true,
                nome: true,
                produto_codigo: true,
                empresas: {
                    select: {
                        nome_fantasia: true
                    }
                },
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const resultado = categorias.map(cat => ({
            id: cat.id,
            nome: cat.nome,
            produto_codigo: cat.produto_codigo,
            empresa_nome: cat.empresas?.nome_fantasia,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt
        }));

        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao listar categorias.' });
    }
}

const listarCategoriaById = async (req, res) => {
    try {
        const categoria = await prisma.categorias.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            },
            include: {
                empresas: {
                    select: {
                        nome_fantasia: true
                    }
                }
            }
        })
        if (!categoria) {
            return res.status(404).json({ erro: 'Categoria não encontrada.' });
        }
        res.json(categoria);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar categoria.' });
    }
}

module.exports = {
    criarCategoria,
    listarCategorias,
    listarCategoriaById
};