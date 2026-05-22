const { prisma } = require('../config/database');

// 1. CREATE - Cadastrar Produto (com variações)
const criarProduto = async (req, res) => {
    const { nome, marca, codigo, variacoes } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        // Cria o produto junto com suas variações em uma única operação
        const novoProduto = await prisma.produtos.create({
            data: {
                nome,
                marca: marca || null,
                codigo: codigo || null,
                ativo: true,
                empresa_id,
                variacoes: {
                    create: variacoes && variacoes.length > 0
                        ? variacoes.map(v => ({
                            tamanho: v.tamanho,
                            cor: v.cor,
                            qtd_estoque: v.qtd_estoque || 0,
                            preco_custo: v.preco_custo,
                            preco_venda: v.preco_venda
                        }))
                        : []
                }
            },
            include: {
                variacoes: {
                    select: {
                        id: true,
                        tamanho: true,
                        cor: true,
                        qtd_estoque: true,
                        preco_custo: true,
                        preco_venda: true
                    }
                }
            }
        });

        res.status(201).json({
            mensagem: 'Produto e estoque cadastrados com sucesso!',
            produto: novoProduto
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar produto.' });
    }
};

// 2. READ ALL - Listar todos os produtos da empresa (com variações)
const listarProdutos = async (req, res) => {
    try {
        const produtos = await prisma.produtos.findMany({
            where: { empresa_id: req.user.empresa_id },
            include: {
                variacoes: {
                    select: {
                        id: true,
                        tamanho: true,
                        cor: true,
                        qtd_estoque: true,
                        preco_custo: true,
                        preco_venda: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.json(produtos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar produtos.' });
    }
};

// 3. READ ONE - Buscar um produto específico (com variações)
const obterProdutoPorId = async (req, res) => {
    try {
        const produto = await prisma.produtos.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            },
            include: {
                variacoes: {
                    select: {
                        id: true,
                        tamanho: true,
                        cor: true,
                        qtd_estoque: true,
                        preco_custo: true,
                        preco_venda: true
                    }
                }
            }
        });

        if (!produto) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        res.json(produto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar produto.' });
    }
};

// 4. UPDATE - Atualizar Produto e Estoque
const atualizarProduto = async (req, res) => {
    const { nome, marca, codigo, ativo, variacoes } = req.body;

    try {
        // Verifica se o produto existe na empresa
        const produtoExistente = await prisma.produtos.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            }
        });

        if (!produtoExistente) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        // Atualiza o produto e, se enviou variações, deleta as antigas e recria
        await prisma.$transaction(async (tx) => {
            // Atualiza os dados base do produto
            await tx.produtos.update({
                where: { id: parseInt(req.params.id) },
                data: {
                    nome,
                    marca,
                    codigo,
                    ativo
                }
            });

            // Se enviou as variações de novo, apagamos as antigas e recriamos as novas
            if (variacoes) {
                await tx.variacoes.deleteMany({
                    where: { produto_id: parseInt(req.params.id) }
                });

                if (variacoes.length > 0) {
                    await tx.variacoes.createMany({
                        data: variacoes.map(v => ({
                            tamanho: v.tamanho,
                            cor: v.cor,
                            qtd_estoque: v.qtd_estoque || 0,
                            preco_custo: v.preco_custo,
                            preco_venda: v.preco_venda,
                            produto_id: parseInt(req.params.id)
                        }))
                    });
                }
            }
        });

        res.json({ mensagem: 'Produto updated com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar produto.' });
    }
};

// 5. DELETE - Excluir Produto (CASCADE apaga variações)
const deletarProduto = async (req, res) => {
    try {
        const produtoExistente = await prisma.produtos.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            }
        });

        if (!produtoExistente) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        await prisma.produtos.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ mensagem: 'Produto excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao excluir produto.' });
    }
};

module.exports = {
    criarProduto,
    listarProdutos,
    obterProdutoPorId,
    atualizarProduto,
    deletarProduto
};