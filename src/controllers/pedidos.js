// controllers/orders.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * GET /api/orders
 * filters: ?from=YYYY-MM-DD&to=YYYY-MM-DD&material=nomeOuId&search=&clientId=&vehiclePlate=
 * returns list ordered desc by datetime
 */
async function listPedidos(req, res) {
  try {
    const { from, to, searchCliente, searchPlaca, searchProduto } = req.query;
    const where = {};
    if (from) where.data_do_pedido = { gte: new Date(from + "T00:00:00") };
    if (to)
      where.data_do_pedido = Object.assign(where.data_do_pedido || {}, {
        lte: new Date(to + "T23:59:59"),
      });

    if (searchCliente) {
      where.client = {
        nome: {
          contains: searchCliente,
          mode: "insensitive",
        },
      };
    }

    if (searchPlaca) {
      where.veiculo = {
        placa: {
          contains: searchPlaca,
          mode: "insensitive",
        },
      };
    }

    if (searchProduto) {
      where.produto = {
        nome: {
          contains: searchProduto,
          mode: "insensitive",
        },
      };
    }

    // Because of relations and possible material name filter, fallback to simple SQL via prisma.findMany with basic filters:
    const pedidos = await prisma.pedido.findMany({
      where,
      include: { veiculo: true, client: true, produto: true },
    });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

async function listPedidosAgrupados(req, res) {
  try {
    const { from, to, searchCliente, searchPlaca, searchProduto } = req.query;
    const where = {};
    if (from) where.data_do_pedido = { gte: new Date(from + "T00:00:00") };
    if (to)
      where.data_do_pedido = Object.assign(where.data_do_pedido || {}, {
        lte: new Date(to + "T23:59:59"),
      });

    if (searchCliente) {
      where.client = {
        nome: {
          contains: searchCliente,
          mode: "insensitive",
        },
      };
    }

    if (searchPlaca) {
      where.veiculo = {
        placa: {
          contains: searchPlaca,
          mode: "insensitive",
        },
      };
    }

    if (searchProduto) {
      where.produto = {
        nome: {
          contains: searchProduto,
          mode: "insensitive",
        },
      };
    }
    const pedidos = await prisma.pedido.findMany({
      where,
      include: { veiculo: true, client: true, produto: true },
    });

    const clientes = {};

    pedidos.forEach((pedido) => {
      const placa = pedido.veiculo?.placa || "SEM PLACA";
      if (!clientes[pedido.clientId]) {
        clientes[pedido.clientId] = {
          nome: pedido.client.nome,
          clienteId: pedido.clientId,

          detalhes: {},
        };
      }

      const chave = `${placa}-${pedido.produto.id}-${Number(
        pedido.metragem,
      )}-${pedido.produto_valor}`;
      if (!clientes[pedido.clientId].detalhes[chave]) {
        clientes[pedido.clientId].detalhes[chave] = {
          produtoId: pedido.produtoId,
          veiculoId: pedido.veiculoId,
          placa: placa,
          produto: pedido.produto.nome,
          produtoValor: Number(pedido.produto_valor),
          metragem: Number(pedido.metragem),
          viagens: 0,
        };
      }
      clientes[pedido.clientId].detalhes[chave].viagens++;
    });

    res.json(Object.values(clientes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

/**
 * GET /api/pedidos/:id
 */
async function getPedido(req, res) {
  try {
    const id = Number(req.params.id);
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { produto: true, veiculo: true, client: true },
    });
    if (!pedido) return res.status(404).json({ error: "pedido not found" });
    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

async function createPedido(req, res) {
  const t = await prisma
    .$transaction(async (prismaTx) => {
      try {
        const body = req.body;
        if (!body.produtoId)
          return res.status(400).json({ error: "É necessárioID do produto" });

        // fetch material
        let produto;
        if (body.produtoId)
          produto = await prismaTx.produto.findUnique({
            where: { id: Number(body.produtoId) },
          });
        else
          produto = await prismaTx.produto.findFirst({
            where: { nome: { equals: produto.nome, mode: "insensitive" } },
          });
        if (!produto)
          return res.status(404).json({ error: "Produto não encontrado" });

        // determine price
        const produtoValor =
          body.produto_valor !== undefined
            ? Number(body.produto_valor)
            : Number(produto.valor_m3 || 0);

        // vehicle data
        let veiculoMetragem =
          body.metragem !== undefined ? Number(body.metragem) : null;
        if (body.veiculoId) {
          const veiculo = await prismaTx.veiculo.findUnique({
            where: { id: body.veiculoId },
          });
          if (!veiculo)
            return res.status(404).json({ error: "Veículo não encontrado" });
          if (veiculoMetragem === null)
            veiculoMetragem = Number(veiculo.metragem || 0);
        }
        if (veiculoMetragem === null)
          veiculoMetragem = Number(body.metragem || 0);

        const valorTotal =
          Number(veiculoMetragem || 0) * Number(produtoValor || 0);

        const created = await prismaTx.pedido.create({
          data: {
            clientId: body.clientId || null,
            produtoId: produto.id,
            produto_valor: produtoValor,
            metragem: veiculoMetragem,
            veiculoId: body.veiculoId || null,
            valor_total: valorTotal,
            status: body.status,
          },
        });

        io.emit("pedido_atualizado", {
          mensagem: "Um novo pedido foi criado!",
          data: new Date(),
        });
        return res.status(201).json(created);
      } catch (err) {
        console.error(err);
        // propagate error
        throw err;
      }
    })
    .catch((e) => {
      // errors already logged above
      if (e && e.status) return; // response sent
      return res.status(500).json({ error: "server" });
    });
}

/**
 * PUT /api/pedidos/:id
 * body can contain any of: clientId, clientName, vehicleId, vehiclePlate, materialId, materialPrice, vehicleMetragem, datetime
 * Will recalc totalValue depending on provided values.
 */
async function updatePedido(req, res) {
  try {
    const id = Number(req.params.id);
    const body = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.pedido.findUnique({ where: { id } });
      if (!existing)
        return res.status(404).json({ error: "Pedido não encontrado" });

      const fechamentoAntigo = existing.fechamentoId;
      // produto
      let produtoValor = existing.produto_valor;

      if (body.produtoId) {
        const produto = await tx.produto.findUnique({
          where: { id: body.produtoId },
        });
        if (!produto)
          return res.status(404).json({ error: "Produto não encontrado" });
        if (body.produto_valor === undefined)
          produtoValor = Number(produto.valor_m3 || 0);
      }

      if (body.produto_valor !== undefined)
        produtoValor = Number(body.produto_valor || 0);

      // metragem
      let metragem = Number(existing.metragem || 0);

      if (body.veiculoId) {
        const veiculo = await tx.veiculo.findUnique({
          where: { id: body.veiculoId },
        });
        if (!veiculo)
          return res.status(404).json({ error: "Veículo não encontrado" });
        if (body.metragem === undefined)
          metragem = Number(veiculo.metragem || 0);
      }

      if (body.metragem !== undefined) metragem = Number(body.metragem || 0);

      const valorTotal = Number(metragem || 0) * Number(produtoValor || 0);

      // update pedido
      const updated = await tx.pedido.update({
        where: { id },
        data: {
          clientId:
            body.clientId !== undefined ? body.clientId : existing.clientId,
          produtoId:
            body.produtoId !== undefined ? body.produtoId : existing.produtoId,
          produto_valor: produtoValor,
          veiculoId:
            body.veiculoId !== undefined ? body.veiculoId : existing.veiculoId,
          metragem: metragem,
          valor_total: valorTotal,
          fechamentoId:
            body.fechamentoId !== undefined
              ? body.fechamentoId
              : existing.fechamentoId,
          status: body.status !== undefined ? body.status : existing.status,
        },
      });

      const fechamentoNovo = updated.fechamentoId;

      if (fechamentoAntigo && fechamentoAntigo !== fechamentoNovo) {
        // recalcula fechamento antigo
        const sumOld = await tx.pedido.aggregate({
          where: { fechamentoId: fechamentoAntigo },
          _sum: { valor_total: true },
        });

        const totalOld = Number(sumOld._sum.valor_total || 0);

        await tx.fechamento.update({
          where: { id: fechamentoAntigo },
          data: { total: totalOld },
        });
      }

      if (fechamentoNovo) {
        // recalcula fechamento novo
        const sumNew = await tx.pedido.aggregate({
          where: { fechamentoId: fechamentoNovo },
          _sum: { valor_total: true },
        });
        const totalNew = Number(sumNew._sum.valor_total || 0);
        await tx.fechamento.update({
          where: { id: fechamentoNovo },
          data: { total: totalNew },
        });
      }

      return updated;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

async function deletePedido(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.pedido.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

export default {
  listPedidos,
  getPedido,
  createPedido,
  updatePedido,
  deletePedido,
  listPedidosAgrupados,
};
