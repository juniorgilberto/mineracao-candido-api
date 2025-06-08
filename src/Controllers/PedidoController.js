import { prisma } from "../prisma.js";

class pedidoController {
  //CRUD DO PEDIDO = CREATE, READ, UPDATE AND DELETE =  CRIANDO, BUSCANDO, ALTERANDO E DELETANDO MEU(S) PEDIDO(S).

  async getAllPedidos(req, res) {
    try {
      const {
        data,
        dataInicio,
        dataFim,
        clienteId,
        clienteNome,
        produtoId,
        produtoNome,
        status,
        veiculo,
        metragem,
        viagens,
      } = req.query;

      const where = {};

      // Filtros por data
      const dataFiltro = {};
      if (data) {
        dataFiltro.gte = new Date(`${data}T00:00:00.000Z`);
        dataFiltro.lte = new Date(`${data}T23:59:59.999Z`);
      }
      if (dataInicio) {
        dataFiltro.gte = new Date(`${dataInicio}T00:00:00.000Z`);
      }
      if (dataFim) {
        dataFiltro.lte = new Date(`${dataFim}T23:59:59.999Z`);
      }
      if (Object.keys(dataFiltro).length) {
        where.data = dataFiltro;
      }

      // Cliente por ID
      if (clienteId) {
        where.clienteId = Number(clienteId);
      }

      // Cliente por nome
      if (clienteNome) {
        where.cliente = {
          nome: {
            contains: clienteNome,
            mode: "insensitive",
          },
        };
      }

      // Produto por ID
      if (produtoId) {
        where.produtoId = Number(produtoId);
      }

      // Produto por nome
      if (produtoNome) {
        where.produto = {
          nome: {
            contains: produtoNome,
            mode: "insensitive",
          },
        };
      }

      // Status
      if (status) {
        where.status = {
          contains: status,
          mode: "insensitive",
        };
      }

      // Veículo
      if (veiculo) {
        where.veiculo = {
          contains: veiculo,
          mode: "insensitive",
        };
      }

      // Metragem
      if (metragem) {
        where.metragem = parseFloat(metragem);
      }

      // Viagens
      if (viagens) {
        where.viagens = parseInt(viagens);
      }

      const pedidos = await prisma.pedido.findMany({
        where,
        include: {
          cliente: true,
          produto: true,
        },
        orderBy: {
          data: "asc",
        },
      });

      res.json(pedidos);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      res.status(500).json({ erro: "Erro ao buscar pedidos." });
    }
  }

  async getPedido(req, res) {
    // GET // Buscar pedido conforme seu ID
    try {
      const { id } = req.params;
      const pedido = await prisma.pedido.findUnique({
        where: { id: Number(id) },
      });

      if (!pedido) {
        res.status(404).send("Pedido not found!");
        return; // Pare a execução após o envio da resposta
      }

      res.json(pedido);
    } catch (e) {
      res.status(500).send("Server error");
    }
  }

  async createPedido(req, res) {
    //CADASTRO DE UM PEDIDO /// CREATE

    try {
      const pedidos = await prisma.pedido.create({ data: req.body });
      res
        .status(200)
        .json({ success: "Pedido criado com sucesso.", pedido: pedidos });
    } catch (e) {
      if (e.code === "P2002") {
        // Erro P2002 é o código para violação de unicidade (por exemplo, e-mail já existente)
        res
          .status(400)
          .json({ error: "Pedido já existe. Verifique os dados fornecidos." });
      } else if (e.code === "P2003") {
        // Erro P2003 é para chave estrangeira inválida
        res.status(400).json({
          error: "Chave estrangeira inválida. Verifique os relacionamentos.",
        });
      } else {
        // Outros tipos de erros...
        res
          .status(500)
          .json({ error: `Erro ao criar pedido: Verifique as informações` });
      }
    }
  }

  async alterPedido(req, res) {
    // Alterar informações de um pedido == UPDATE

    try {
      const { id } = req.params;
      let pedido = await prisma.pedido.findUnique({
        where: { id: Number(id) },
      });
      if (!pedido) {
        res.status(404).send("Pedido não encontrado!");
        return; // Pare a execução após o envio da resposta
      }

      pedido = await prisma.pedido.update({
        where: { id: Number(id) },
        data: req.body,
      });

      res.json(pedido);
    } catch (e) {
      res.status(500).send("Server error");
    }
  }

  async deletePedido(req, res) {
    try {
      const { id } = req.params;
      const pedido = await prisma.pedido.findUnique({
        where: { id: Number(id) },
      });

      if (!pedido) {
        res.status(404).send("Pedido não encontrado!");
        return; // Pare a execução após o envio da resposta
      }

      await prisma.pedido.delete({ where: { id: Number(id) } });

      return res.json({ message: "Pedido deletado." });
    } catch (e) {
      res.status(500).send("Server error");
    }
  }
}

export { pedidoController };
