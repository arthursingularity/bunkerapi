const { prisma } = require('../config/database');

const registrarVenda = async (req, res) => {
    const { cliente_id, forma_pagamento, itens } = req.body;
    const empresa_id = req.user.empresa_id;
    const usuario_id = req.user.id; // Injetado pelo authMiddleware

    if (!forma_pagamento) {
        return res.status(400).json({ erro: 'A forma de pagamento é obrigatória.' });
    }

    if (!itens || itens.length === 0) {
        return res.status(400).json({ erro: 'A venda precisa conter pelo menos um item.' });
    }

    try {
        // Transação Prisma para garantir atomicidade
        const resultado = await prisma.$transaction(async (tx) => {
            let totalVenda = 0;
            const produtosVendasData = [];

            // 1. Validar e baixar estoque de cada variação vendida
            for (const item of itens) {
                const { variacao_id, quantidade } = item;

                if (!variacao_id || !quantidade || quantidade <= 0) {
                    throw new Error('Formato de item inválido. Informe o ID da variação e a quantidade.');
                }

                // Buscar variação
                const variacao = await tx.variacoes.findFirst({
                    where: { id: parseInt(variacao_id) }
                });

                if (!variacao) {
                    throw new Error(`Variação de ID ${variacao_id} não encontrada no sistema.`);
                }

                // Verificar se há estoque disponível
                if (variacao.qtd_estoque < quantidade) {
                    throw new Error(`Estoque insuficiente para o item. Estoque disponível: ${variacao.qtd_estoque} unidades.`);
                }

                const precoUnitario = parseFloat(variacao.preco_venda);
                const subtotal = precoUnitario * quantidade;
                totalVenda += subtotal;

                // Salvar dados da relação
                produtosVendasData.push({
                    variacao_id: parseInt(variacao_id),
                    quantidade: parseInt(quantidade),
                    preco_unitario: precoUnitario
                });

                // Decrementar o estoque da variação correspondente
                await tx.variacoes.update({
                    where: { id: parseInt(variacao_id) },
                    data: {
                        qtd_estoque: {
                            decrement: parseInt(quantidade)
                        }
                    }
                });
            }

            // 2. Registrar a venda
            const novaVenda = await tx.vendas.create({
                data: {
                    cliente_id: cliente_id ? parseInt(cliente_id) : null,
                    usuario_id: parseInt(usuario_id),
                    empresa_id: parseInt(empresa_id),
                    valor_total: totalVenda,
                    forma_pagamento,
                    status: 'concluida',
                    produtos_vendas: {
                        create: produtosVendasData.map(p => ({
                            variacao_id: p.variacao_id,
                            quantidade: p.quantidade,
                            preco_unitario: p.preco_unitario
                        }))
                    }
                },
                include: {
                    produtos_vendas: {
                        include: {
                            variacoes: {
                                include: {
                                    produtos: true
                                }
                            }
                        }
                    }
                }
            });

            return novaVenda;
        });

        res.status(201).json({
            mensagem: 'Venda registrada com sucesso!',
            venda: resultado
        });

    } catch (error) {
        console.error('Erro ao registrar venda:', error.message);
        res.status(400).json({ erro: error.message || 'Erro de processamento da venda.' });
    }
};

const listarVendas = async (req, res) => {
    const empresa_id = req.user.empresa_id;

    try {
        const vendas = await prisma.vendas.findMany({
            where: {
                empresa_id: parseInt(empresa_id)
            },
            include: {
                produtos_vendas: {
                    include: {
                        variacoes: {
                            include: {
                                produtos: true
                            }
                        }
                    }
                },
                clientes: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(vendas);
    } catch (error) {
        console.error('Erro ao listar vendas:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar histórico de vendas.' });
    }
};

const excluirVenda = async (req, res) => {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    try {
        await prisma.$transaction(async (tx) => {
            // Buscar a venda e seus itens para devolver ao estoque
            const venda = await tx.vendas.findFirst({
                where: {
                    id: parseInt(id),
                    empresa_id: parseInt(empresa_id)
                },
                include: {
                    produtos_vendas: true
                }
            });

            if (!venda) {
                throw new Error('Venda não encontrada ou não pertence à sua empresa.');
            }

            // Devolver itens ao estoque
            for (const item of venda.produtos_vendas) {
                await tx.variacoes.update({
                    where: { id: item.variacao_id },
                    data: {
                        qtd_estoque: {
                            increment: item.quantidade
                        }
                    }
                });
            }

            // Excluir a venda (deleta em cascata produtos_vendas devido a onDelete: Cascade no prisma)
            await tx.vendas.delete({
                where: { id: parseInt(id) }
            });
        });

        res.json({ mensagem: 'Venda cancelada e produtos devolvidos ao estoque com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir venda:', error.message);
        res.status(400).json({ erro: error.message || 'Erro ao cancelar a venda.' });
    }
};

module.exports = {
    registrarVenda,
    listarVendas,
    excluirVenda
};
