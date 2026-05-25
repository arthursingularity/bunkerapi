const { prisma } = require('../config/database');

// 1. CREATE - Cadastrar Cliente
const criarCliente = async (req, res) => {
    try {
        const { nome_completo, email, cpf, telefone } = req.body;
        const empresa_id = req.user.empresa_id;

        if (!nome_completo) {
            return res.status(400).json({ erro: 'O nome completo é obrigatório.' });
        }

        // Validação básica se já existe email ou CPF cadastrado para a empresa (se informados)
        if (email) {
            const clienteExistenteEmail = await prisma.clientes.findFirst({
                where: { email }
            });
            if (clienteExistenteEmail) {
                return res.status(400).json({ erro: 'Já existe um cliente cadastrado com este e-mail.' });
            }
        }

        if (cpf) {
            const cleanCpf = cpf.replace(/\D/g, '');
            if (cleanCpf.length > 11) {
                return res.status(400).json({ erro: 'CPF deve conter no máximo 11 dígitos numéricos.' });
            }
            const clienteExistenteCpf = await prisma.clientes.findFirst({
                where: { cpf: cleanCpf }
            });
            if (clienteExistenteCpf) {
                return res.status(400).json({ erro: 'Já existe um cliente cadastrado com este CPF.' });
            }
        }

        const cleanTelefone = telefone ? telefone.replace(/\D/g, '') : null;

        const novoCliente = await prisma.clientes.create({
            data: {
                nome_completo,
                email: email || null,
                cpf: cpf ? cpf.replace(/\D/g, '') : null,
                telefone: cleanTelefone,
                empresa_id
            }
        });

        res.status(201).json({
            mensagem: 'Cliente cadastrado com sucesso!',
            cliente: novoCliente
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar cliente.' });
    }
};

// 2. READ ALL - Listar Clientes da Empresa
const listarClientes = async (req, res) => {
    const empresa_id = req.user.empresa_id;

    try {
        const clientes = await prisma.clientes.findMany({
            where: { empresa_id },
            include: {
                _count: {
                    select: {
                        servicos: true,
                        vendas: true
                    }
                }
            },
            orderBy: { nome_completo: 'asc' }
        });

        res.json(clientes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao listar clientes.' });
    }
};

// 3. READ ONE - Obter Cliente por ID
const obterClientePorId = async (req, res) => {
    try {
        const cliente = await prisma.clientes.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            }
        });

        if (!cliente) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }

        res.json(cliente);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar cliente.' });
    }
};

// 4. UPDATE - Atualizar Cliente
const atualizarCliente = async (req, res) => {
    const { nome_completo, email, cpf, telefone } = req.body;

    try {
        const clienteExistente = await prisma.clientes.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            }
        });

        if (!clienteExistente) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }

        if (!nome_completo) {
            return res.status(400).json({ erro: 'O nome completo é obrigatório.' });
        }

        // Validação de e-mail duplicado em outros clientes
        if (email && email !== clienteExistente.email) {
            const outroClienteEmail = await prisma.clientes.findFirst({
                where: { email, id: { not: parseInt(req.params.id) } }
            });
            if (outroClienteEmail) {
                return res.status(400).json({ erro: 'Já existe outro cliente cadastrado com este e-mail.' });
            }
        }

        // Validação de CPF duplicado em outros clientes
        if (cpf) {
            const cleanCpf = cpf.replace(/\D/g, '');
            if (cleanCpf !== clienteExistente.cpf) {
                const outroClienteCpf = await prisma.clientes.findFirst({
                    where: { cpf: cleanCpf, id: { not: parseInt(req.params.id) } }
                });
                if (outroClienteCpf) {
                    return res.status(400).json({ erro: 'Já existe outro cliente cadastrado com este CPF.' });
                }
            }
        }

        const cleanTelefone = telefone ? telefone.replace(/\D/g, '') : null;

        const clienteAtualizado = await prisma.clientes.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nome_completo,
                email: email || null,
                cpf: cpf ? cpf.replace(/\D/g, '') : null,
                telefone: cleanTelefone
            }
        });

        res.json({
            mensagem: 'Cliente atualizado com sucesso!',
            cliente: clienteAtualizado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar cliente.' });
    }
};

// 5. DELETE - Excluir Cliente
const deletarCliente = async (req, res) => {
    try {
        const clienteExistente = await prisma.clientes.findFirst({
            where: {
                id: parseInt(req.params.id),
                empresa_id: req.user.empresa_id
            }
        });

        if (!clienteExistente) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }

        await prisma.clientes.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ mensagem: 'Cliente excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao excluir cliente.' });
    }
};

module.exports = {
    criarCliente,
    listarClientes,
    obterClientePorId,
    atualizarCliente,
    deletarCliente
};
