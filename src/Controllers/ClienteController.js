import { prisma } from '../prisma.js'

class clienteController {

    //CRUD DO CLIENTE = CREATE, READ, UPDATE AND DELETE =  CRIANDO, BUSCANDO, ALTERANDO E DELETANDO MEU(S) CLIENTE(S).

    async getAllClients(req, res) {

        // GET // Buscar todos os clientes.
        const clientes = await prisma.cliente.findMany({
            orderBy: {
                nome: 'asc',
            },
        });
        return res.json(clientes);
    }

    async getClient(req, res) {

        // GET // Buscar cliente conforme seu ID
        try {
            const { id } = req.params;
            const cliente = await prisma.cliente.findUnique( { where: { id: Number(id) } } )

            if (!cliente) {
                res.status(404).send('Client not found!');
                return; // Pare a execução após o envio da resposta
            }
            
            res.json(cliente)

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    async createClient(req, res) {
        //CADASTRO DE UM CLIENTE /// CREATE

        try {
            const clientes = await prisma.cliente.create({ data: req.body });
            res.status(200).json({ success: 'Cliente criado com sucesso.', cliente: clientes });
        } catch (e) {
            if (e.code === 'P2002') {
                // Erro P2002 é o código para violação de unicidade (por exemplo, e-mail já existente)
                res.status(400).json({ error: 'Cliente já existe. Verifique os dados fornecidos.' });
            } else if (e.code === 'P2003') {
                // Erro P2003 é para chave estrangeira inválida
                res.status(400).json({ error: 'Chave estrangeira inválida. Verifique os relacionamentos.' });
            } else {
                // Outros tipos de erros...
                res.status(500).json({ error: `Erro ao criar usuário: Verifique as informações` });
            }
        }
    }

    async alterClient(req, res) {
        // Alterar informações de um CLIENTE == UPDATE

        try {
            const { id } = req.params;
            let cliente = await prisma.cliente.findUnique( { where: { id: Number(id) } } )
            if (!cliente) {
                res.status(404).send('Cliente não encontrado!');
                return; // Pare a execução após o envio da resposta
            }

            cliente = await prisma.cliente.update({
                where: { id: Number(id) },
                data: req.body,
            })

            res.json(cliente)

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    async deleteClient(req, res) {
        try {
            const { id } = req.params;
            const cliente = await prisma.cliente.findUnique( { where: { id: Number(id) } } )

            if (!cliente) {
                res.status(404).send('Cliente não encontrado!');
                return; // Pare a execução após o envio da resposta
            }
            
            await prisma.cliente.delete( { where: { id: Number(id) } })
            
            return res.json({message: "Cliente deletado."})

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    
}

export { clienteController };
