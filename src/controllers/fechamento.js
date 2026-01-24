// controllers/produtos.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * GET /api/materials
 * optional: ?search=texto
 */
async function listFechamentos(req, res) {
  try {
    const { search } = req.query;

    const where = search
      ? { nome: { contains: search, mode: "insensitive" } }
      : {};
    const rows = await prisma.fechamento.findMany({
      where,
      include: {
        client: true,
        pedidos: { include: { produto: true, veiculo: true } },
      },
      orderBy: {
        id: "asc", // ou 'desc' se quiser os mais novos primeiro
      },
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

/**
 * GET /api/materials/:id
 */
async function getFechamento(req, res) {
  try {
    const id = Number(req.params.id);
    const fechamento = await prisma.fechamento.findUnique({
      where: { id },
      include: {
        client: true,
        pedidos: { include: { produto: true, veiculo: true } },
      },
    });
    if (!fechamento)
      return res.status(404).json({ error: "fechamento não encontrado." });
    res.json(fechamento);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

/**
 */
async function createFechamento(req, res) {
  try {
    const { clientId, descricao, pedidosIds } = req.body;

    const pedidos = await prisma.pedido.findMany({
      where: { id: { in: req.body.pedidosIds } },
      select: { id: true, valor_total: true },
    });
    if (pedidos.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhum pedido encontrado para os IDs fornecidos." });
    }

    const total = pedidos.reduce((sum, p) => sum + Number(p.valor_total), 0);

    const result = await prisma.$transaction(async (tx) => {
      // Cria o fechamento
      const fechamento = await tx.fechamento.create({
        data: {
          descricao,
          total,
          clientId,
          pedidos: {
            connect: pedidos.map((p) => ({ id: p.id })),
          },
        },
      });

      // Atualiza o status de todos os pedidos envolvidos
      await tx.pedido.updateMany({
        where: {
          id: { in: pedidosIds },
        },
        data: {
          status: "EM_FECHAMENTO",
        },
      });

      return fechamento;
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    if (err.code === "P2002")
      return res
        .status(400)
        .json({ error: "fechamento name must be unique", meta: err.meta });
    res.status(500).json({ error: "server" });
  }
}

async function updateFechamento(req, res) {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const existing = await prisma.fechamento.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ error: "fechamento not found" });

    const updated = await prisma.fechamento.update({
      where: { id },
      data: {
        descricao:
          body.descricao !== undefined
            ? String(body.descricao).trim()
            : existing.descricao,
        valor_m3:
          body.valor_m3 !== undefined
            ? Number(body.valor_m3)
            : existing.valor_m3,
        status:
          body.status !== undefined ? String(body.status) : existing.status,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === "P2002")
      return res
        .status(400)
        .json({ error: "fechamento name must be unique", meta: err.meta });
    res.status(500).json({ error: "server" });
  }
}

/**
 * DELETE /api/fechamentos/:id
 */
async function deleteFechamento(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.fechamento.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

async function finalizarFechamento(req, res) {
  const id = Number(req.params.id);

  try {
    await prisma.$transaction([
      // 1. Atualiza o status do Fechamento para PAGO
      prisma.fechamento.update({
        where: { id },
        data: { status: "PAGO" },
      }),

      // 2. Atualiza TODOS os pedidos vinculados a este fechamento para PAGO
      prisma.pedido.updateMany({
        where: { fechamentoId: id },
        data: { status: "PAGO" },
      }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao finalizar fechamento e pedidos" });
  }
}

export default {
  listFechamentos,
  getFechamento,
  createFechamento,
  updateFechamento,
  deleteFechamento,
  finalizarFechamento,
};
