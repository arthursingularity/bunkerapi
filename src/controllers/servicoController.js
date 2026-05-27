const { prisma } = require('../config/database');

// 1. CREATE - Cadastrar Serviço
const criarServico = async (req, res) => {
    try {
        const { descricao, produto, preco_custo, preco_venda, status, observacoes, cliente_id } = req.body;
        const empresa_id = req.user.empresa_id;

        if (!descricao) {
            return res.status(400).json({ erro: 'A descrição do serviço é obrigatória.' });
        }
        if (preco_custo === undefined || preco_custo === null) {
            return res.status(400).json({ erro: 'O preço de custo do serviço é obrigatório.' });
        }
        if (preco_venda === undefined || preco_venda === null) {
            return res.status(400).json({ erro: 'O preço de venda do serviço é obrigatório.' });
        }
        if (!cliente_id) {
            return res.status(400).json({ erro: 'O cliente é obrigatório para registrar um serviço.' });
        }

        // Valida se o cliente existe e pertence à mesma empresa
        const clienteExistente = await prisma.clientes.findFirst({
            where: {
                id: parseInt(cliente_id),
                empresa_id
            }
        });

        if (!clienteExistente) {
            return res.status(400).json({ erro: 'Cliente não encontrado ou não pertence a esta empresa.' });
        }

        const novoServico = await prisma.servicos.create({
            data: {
                descricao,
                produto: produto || null,
                preco: parseFloat(preco_venda),
                preco_custo: parseFloat(preco_custo),
                preco_venda: parseFloat(preco_venda),
                status: status || 'Pendente',
                observacoes: observacoes || null,
                cliente_id: parseInt(cliente_id),
                empresa_id
            },
            include: {
                clientes: {
                    select: {
                        id: true,
                        nome_completo: true,
                        telefone: true
                    }
                }
            }
        });

        res.status(201).json({
            mensagem: 'Serviço cadastrado com sucesso!',
            servico: novoServico
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar serviço.' });
    }
};

// 2. READ ALL - Listar Serviços da Empresa (incluindo clientes)
const listarServicos = async (req, res) => {
    const empresa_id = req.user.empresa_id;

    try {
        const servicos = await prisma.servicos.findMany({
            where: { empresa_id },
            include: {
                clientes: {
                    select: {
                        id: true,
                        nome_completo: true,
                        email: true,
                        telefone: true,
                        cpf: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(servicos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao listar serviços.' });
    }
};

// 3. READ ONE - Obter Serviço por ID
const obterServicoPorId = async (req, res) => {
    try {
        const servico = await prisma.servicos.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            },
            include: {
                clientes: {
                    select: {
                        id: true,
                        nome_completo: true,
                        email: true,
                        telefone: true,
                        cpf: true
                    }
                }
            }
        });

        if (!servico) {
            return res.status(404).json({ erro: 'Serviço não encontrado.' });
        }

        res.json(servico);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar serviço.' });
    }
};

// 4. UPDATE - Atualizar Serviço
const atualizarServico = async (req, res) => {
    const { descricao, produto, preco_custo, preco_venda, status, observacoes, cliente_id } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        const servicoExistente = await prisma.servicos.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id
            }
        });

        if (!servicoExistente) {
            return res.status(404).json({ erro: 'Serviço não encontrado.' });
        }

        if (!descricao) {
            return res.status(400).json({ erro: 'A descrição do serviço é obrigatória.' });
        }
        if (preco_custo === undefined || preco_custo === null) {
            return res.status(400).json({ erro: 'O preço de custo é obrigatório.' });
        }
        if (preco_venda === undefined || preco_venda === null) {
            return res.status(400).json({ erro: 'O preço de venda é obrigatório.' });
        }
        if (!cliente_id) {
            return res.status(400).json({ erro: 'O cliente é obrigatório.' });
        }

        // Valida se o cliente existe e pertence à mesma empresa
        const clienteExistente = await prisma.clientes.findFirst({
            where: {
                id: parseInt(cliente_id),
                empresa_id
            }
        });

        if (!clienteExistente) {
            return res.status(400).json({ erro: 'Cliente não encontrado ou não pertence a esta empresa.' });
        }

        const servicoAtualizado = await prisma.servicos.update({
            where: { id: parseInt(req.params.id) },
            data: {
                descricao,
                produto: produto || null,
                preco: parseFloat(preco_venda),
                preco_custo: parseFloat(preco_custo),
                preco_venda: parseFloat(preco_venda),
                status: status || 'Pendente',
                observacoes: observacoes || null,
                cliente_id: parseInt(cliente_id)
            },
            include: {
                clientes: {
                    select: {
                        id: true,
                        nome_completo: true,
                        telefone: true
                    }
                }
            }
        });

        res.json({
            mensagem: 'Serviço atualizado com sucesso!',
            servico: servicoAtualizado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar serviço.' });
    }
};

// 5. DELETE - Excluir Serviço
const deletarServico = async (req, res) => {
    try {
        const servicoExistente = await prisma.servicos.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            }
        });

        if (!servicoExistente) {
            return res.status(404).json({ erro: 'Serviço não encontrado.' });
        }

        await prisma.servicos.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ mensagem: 'Serviço excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao excluir serviço.' });
    }
};

module.exports = {
    criarServico,
    listarServicos,
    obterServicoPorId,
    atualizarServico,
    deletarServico
};
