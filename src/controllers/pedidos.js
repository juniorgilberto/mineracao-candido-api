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
    const {
      from,
      to,
      searchCliente,
      searchPlaca,
      searchProduto,
      searchMetragem,
      searchStatus,
    } = req.query;
    const where = {};
    const offset = "-04:00"; // Fuso de Cuiabá

    if (from && to) {
      where.createdAt = {
        gte: new Date(`${from}T00:00:00.000${offset}`), // Início do dia em Cuiabá
        lte: new Date(`${to}T23:59:59.999${offset}`), // Fim do dia em Cuiabá
      };
    }

    if (searchCliente) {
      where.client = {
        nome: {
          contains: searchCliente,
          mode: "insensitive",
        },
      };
    }
    if (searchMetragem) {
      // Converte a string da URL para número antes de enviar ao Prisma
      const metragemNum = parseFloat(searchMetragem);

      if (!isNaN(metragemNum)) {
        where.metragem = metragemNum;
        // Nota: Campos numéricos não aceitam 'contains' ou 'mode: insensitive'
      }
    }

    if (searchPlaca) {
      const busca = searchPlaca.toLowerCase();

      if (busca.includes("sem") || busca.includes("placa")) {
        where.OR = [
          {
            veiculo: {
              placa: { contains: searchPlaca, mode: "insensitive" },
            },
          },
          {
            veiculoId: null, // Isso traz os pedidos onde não há veículo vinculado
          },
        ];
      } else {
        // Busca normal apenas na tabela de veículos
        where.veiculo = {
          placa: { contains: searchPlaca, mode: "insensitive" },
        };
      }
    }

    if (searchProduto) {
      where.produto = {
        nome: {
          contains: searchProduto,
          mode: "insensitive",
        },
      };
    }
    if (searchStatus) {
      where.status = searchStatus
    }

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
      if (!existing) throw new Error("NOT_FOUND"); // Usar throw dentro da tx é mais limpo

      // 1. Lógica de cálculo de Preço e Metragem (Mantida a sua lógica original)
      let produtoValor =
        body.produto_valor !== undefined
          ? Number(body.produto_valor)
          : existing.produto_valor;
      if (body.produtoId && body.produto_valor === undefined) {
        const produto = await tx.produto.findUnique({
          where: { id: body.produtoId },
        });
        if (produto) produtoValor = Number(produto.valor_m3 || 0);
      }

      let metragem =
        body.metragem !== undefined
          ? Number(body.metragem)
          : Number(existing.metragem || 0);
      if (body.veiculoId && body.metragem === undefined) {
        const veiculo = await tx.veiculo.findUnique({
          where: { id: body.veiculoId },
        });
        if (veiculo) metragem = Number(veiculo.metragem || 0);
      }

      const valorTotal = metragem * produtoValor;

      // 2. Update do pedido
      const updated = await tx.pedido.update({
        where: { id },
        data: {
          clientId: body.clientId ?? existing.clientId,
          produtoId: body.produtoId ?? existing.produtoId,
          produto_valor: produtoValor,
          veiculoId: body.veiculoId ?? existing.veiculoId,
          metragem: metragem,
          valor_total: valorTotal,
          fechamentoId:
            body.fechamentoId !== undefined
              ? body.fechamentoId
              : existing.fechamentoId,
          status: body.status ?? existing.status,
        },
      });

      // 3. LÓGICA DE RECALCULO DE FECHAMENTO (Otimizada)
      const fechamentoAntigo = existing.fechamentoId;
      const fechamentoNovo = updated.fechamentoId;

      // Se mudou de fechamento, atualiza o antigo
      if (fechamentoAntigo && fechamentoAntigo !== fechamentoNovo) {
        await atualizarTotalFechamento(tx, fechamentoAntigo);
      }

      // Se está em um fechamento (novo ou o mesmo), atualiza o total
      if (fechamentoNovo) {
        await atualizarTotalFechamento(tx, fechamentoNovo);
      }

      return updated;
    });

    res.json(result);
  } catch (err) {
    if (err.message === "NOT_FOUND")
      return res.status(404).json({ error: "Pedido não encontrado" });
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

async function atualizarTotalFechamento(tx, fechamentoId) {
  const aggregate = await tx.pedido.aggregate({
    where: { fechamentoId: fechamentoId },
    _sum: { valor_total: true },
  });

  await tx.fechamento.update({
    where: { id: fechamentoId },
    data: { total: Number(aggregate._sum.valor_total || 0) },
  });
}

async function deletePedido(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res
        .status(400)
        .json({ error: "ID inválido", recebido: req.params.id });
    }
    // 1. Buscar o pedido para saber o valor e o fechamento vinculado
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      select: { valor_total: true, fechamentoId: true },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // 2. Executar a exclusão e a atualização em uma transação
    const operations = [prisma.pedido.delete({ where: { id } })];

    if (pedido.fechamentoId) {
      operations.push(
        prisma.fechamento.update({
          where: { id: pedido.fechamentoId },
          data: {
            total: {
              decrement: pedido.valor_total,
            },
          },
        }),
      );
    }

    await prisma.$transaction(operations);
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
