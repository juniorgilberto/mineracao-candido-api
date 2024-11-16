import { prisma } from '../prisma.js'

class veiculoController {

    //CRUD DO CLIENTE = CREATE, READ, UPDATE AND DELETE =  CRIANDO, BUSCANDO, ALTERANDO E DELETANDO MEU(S) CLIENTE(S).

    async getAllVeiculos(req, res) {

        // GET // Buscar todos os clientes.
        const clientes = await prisma.veiculo.findMany();
        return res.json(clientes);
    }

    async getVeiculos(req, res) {

        // GET // Buscar cliente conforme seu ID
        try {
            const { id } = req.params;
            const veiculo = await prisma.veiculo.findUnique( { where: { id: Number(id) } } )

            if (!veiculo) {
                res.status(404).send('Veiculo not found!');
                return; // Pare a execução após o envio da resposta
            }
            
            res.json(veiculo)

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    async createVeiculo(req, res) {
        //CADASTRO DE UM Veiculo /// CREATE

        try {
            const veiculos = await prisma.veiculo.create({ data: req.body });
            res.status(200).json({ success: 'Veiculo criado com sucesso.', cliente: clientes });
        } catch (e) {
            if (e.code === 'P2002') {
                // Erro P2002 é o código para violação de unicidade (por exemplo, e-mail já existente)
                res.status(400).json({ error: 'Veiculo já existe. Verifique os dados fornecidos.' });
            } else if (e.code === 'P2003') {
                // Erro P2003 é para chave estrangeira inválida
                res.status(400).json({ error: 'Chave estrangeira inválida. Verifique os relacionamentos.' });
            } else {
                // Outros tipos de erros...
                res.status(500).json({ error: `Erro ao criar usuário: Verifique as informações` });
            }
        }
    }

    async alterVeiculo(req, res) {
        // Alterar informações de um CLIENTE == UPDATE

        try {
            const { id } = req.params;
            let veiculo = await prisma.veiculo.findUnique( { where: { id: Number(id) } } )
            if (!veiculo) {
                res.status(404).send('Veiculo não encontrado!');
                return; // Pare a execução após o envio da resposta
            }

            veiculo = await prisma.veiculo.update({
                where: { id: Number(id) },
                data: req.body,
            })

            res.json(veiculo)

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    async deleteVeiculo(req, res) {
        try {
            const { id } = req.params;
            const veiculo = await prisma.veiculo.findUnique( { where: { id: Number(id) } } )

            if (!veiculo) {
                res.status(404).send('Veiculo não encontrado!');
                return; // Pare a execução após o envio da resposta
            }
            
            await prisma.veiculo.delete( { where: { id: Number(id) } })
            
            return res.json({message: "Veículo deletado."})

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    
}

export { veiculoController };
