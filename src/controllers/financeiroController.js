const { prisma } = require('../config/database');

// 1. Listar Movimentações Financeiras
const listarMovimentacoes = async (req, res) => {
    try {
        const empresa_id = req.user.empresa_id;
        const movimentacoes = await prisma.movimentacoes_financeiras.findMany({
            where: { empresa_id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(movimentacoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao listar movimentações financeiras.' });
    }
};

// 2. Listar Contas a Pagar
const listarContasPagar = async (req, res) => {
    try {
        const empresa_id = req.user.empresa_id;
        const contas = await prisma.contas_a_pagar.findMany({
            where: { empresa_id },
            orderBy: { data_vencimento: 'asc' }
        });
        res.json(contas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao listar contas a pagar.' });
    }
};

// 3. Criar Conta a Pagar
const criarContaPagar = async (req, res) => {
    try {
        const { descricao, valor, data_vencimento } = req.body;
        const empresa_id = req.user.empresa_id;

        if (!descricao || !valor || !data_vencimento) {
            return res.status(400).json({ erro: 'Descrição, valor e vencimento são obrigatórios.' });
        }

        const novaConta = await prisma.contas_a_pagar.create({
            data: {
                descricao,
                valor: parseFloat(valor),
                data_vencimento: new Date(data_vencimento),
                status: 'Pendente',
                empresa_id
            }
        });

        res.status(201).json(novaConta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar conta a pagar.' });
    }
};

// 4. Pagar Conta (Liquidar)
const pagarConta = async (req, res) => {
    try {
        const { id } = req.params;
        const { forma_pagamento } = req.body;
        const empresa_id = req.user.empresa_id;

        const conta = await prisma.contas_a_pagar.findFirst({
            where: { id: parseInt(id), empresa_id }
        });

        if (!conta) {
            return res.status(404).json({ erro: 'Conta a pagar não encontrada.' });
        }

        if (conta.status === 'Pago') {
            return res.status(400).json({ erro: 'Esta conta já foi paga.' });
        }

        // Executa em transação para garantir o lançamento financeiro
        const resultado = await prisma.$transaction(async (tx) => {
            const contaPaga = await tx.contas_a_pagar.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'Pago',
                    data_pagamento: new Date(),
                    valor_pago: conta.valor,
                    forma_pagamento: forma_pagamento || 'Outro'
                }
            });

            await tx.movimentacoes_financeiras.create({
                data: {
                    tipo: 'saida',
                    categoria: 'Despesa',
                    descricao: `Pagamento: ${conta.descricao}`,
                    valor: conta.valor,
                    forma_pagamento: forma_pagamento || 'Outro',
                    empresa_id,
                    conta_pagar_id: conta.id
                }
            });

            return contaPaga;
        });

        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao liquidar conta a pagar.' });
    }
};

// 5. Listar Contas a Receber
const listarContasReceber = async (req, res) => {
    try {
        const empresa_id = req.user.empresa_id;
        const contas = await prisma.contas_a_receber.findMany({
            where: { empresa_id },
            include: {
                clientes: {
                    select: { nome_completo: true }
                }
            },
            orderBy: { data_vencimento: 'asc' }
        });
        res.json(contas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao listar contas a receber.' });
    }
};

// 6. Criar Conta a Receber
const criarContaReceber = async (req, res) => {
    try {
        const { descricao, valor, data_vencimento, cliente_id } = req.body;
        const empresa_id = req.user.empresa_id;

        if (!descricao || !valor || !data_vencimento) {
            return res.status(400).json({ erro: 'Descrição, valor e vencimento são obrigatórios.' });
        }

        const novaConta = await prisma.contas_a_receber.create({
            data: {
                descricao,
                valor: parseFloat(valor),
                data_vencimento: new Date(data_vencimento),
                status: 'Pendente',
                cliente_id: cliente_id ? parseInt(cliente_id) : null,
                empresa_id
            }
        });

        res.status(201).json(novaConta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar conta a receber.' });
    }
};

// 7. Receber Conta (Liquidar)
const receberConta = async (req, res) => {
    try {
        const { id } = req.params;
        const { forma_pagamento } = req.body;
        const empresa_id = req.user.empresa_id;

        const conta = await prisma.contas_a_receber.findFirst({
            where: { id: parseInt(id), empresa_id }
        });

        if (!conta) {
            return res.status(404).json({ erro: 'Conta a receber não encontrada.' });
        }

        if (conta.status === 'Recebido') {
            return res.status(400).json({ erro: 'Esta conta já foi recebida.' });
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const contaRecebida = await tx.contas_a_receber.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'Recebido',
                    data_recebimento: new Date(),
                    valor_recebido: conta.valor,
                    forma_pagamento: forma_pagamento || 'Outro'
                }
            });

            await tx.movimentacoes_financeiras.create({
                data: {
                    tipo: 'entrada',
                    categoria: 'Receita',
                    descricao: `Recebimento: ${conta.descricao}`,
                    valor: conta.valor,
                    forma_pagamento: forma_pagamento || 'Outro',
                    empresa_id,
                    conta_receber_id: conta.id
                }
            });

            return contaRecebida;
        });

        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao liquidar conta a receber.' });
    }
};

// 8. Listar Movimentações de Estoque
const listarMovimentacoesEstoque = async (req, res) => {
    try {
        const empresa_id = req.user.empresa_id;
        const movimentacoes = await prisma.movimentacoes_estoque.findMany({
            where: {
                variacoes: {
                    produtos: {
                        empresa_id
                    }
                }
            },
            include: {
                variacoes: {
                    include: {
                        produtos: {
                            select: { nome: true, marca: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(movimentacoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao listar movimentações de estoque.' });
    }
};

// 9. Criar Movimentação Manual (Saldo Inicial / Ajustes)
const criarMovimentacao = async (req, res) => {
    try {
        const { tipo, categoria, descricao, valor, forma_pagamento } = req.body;
        const empresa_id = req.user.empresa_id;

        if (!tipo || !categoria || !valor) {
            return res.status(400).json({ erro: 'Tipo, categoria e valor são obrigatórios.' });
        }

        const novaMov = await prisma.movimentacoes_financeiras.create({
            data: {
                tipo,
                categoria,
                descricao,
                valor: parseFloat(valor),
                forma_pagamento: forma_pagamento || 'Outro',
                empresa_id
            }
        });

        res.status(201).json(novaMov);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao lançar movimentação financeira manual.' });
    }
};

module.exports = {
    listarMovimentacoes,
    listarContasPagar,
    criarContaPagar,
    pagarConta,
    listarContasReceber,
    criarContaReceber,
    receberConta,
    listarMovimentacoesEstoque,
    criarMovimentacao
};
