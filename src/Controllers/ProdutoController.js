import { prisma } from '../prisma.js'

class produtoController {

    //CRUD DO produto = CREATE, READ, UPDATE AND DELETE =  CRIANDO, BUSCANDO, ALTERANDO E DELETANDO MEU(S) produto(S).

    async getAllProdutos(req, res) {

        // GET // Buscar todos os produtos.
        const produtos = await prisma.produto.findMany();
        return res.json(produtos);
    }

    async getProduto(req, res) {

        // GET // Buscar produto conforme seu ID
        try {
            const { id } = req.params;
            const produto = await prisma.produto.findUnique( { where: { id: Number(id) } } )

            if (!produto) {
                res.status(404).send('Produto not found!');
                return; // Pare a execução após o envio da resposta
            }
            
            res.json(produto)

        } catch (e) {
            res.status(500).send('Server error');
        }
    }    
}

export { produtoController };
