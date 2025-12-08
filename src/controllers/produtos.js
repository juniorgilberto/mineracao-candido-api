// controllers/produtos.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * GET /api/materials
 * optional: ?search=texto
 */
async function listProdutos(req, res) {
  try {
    const { search } = req.query;
    
    const where = search ? { nome: { contains: search, mode: 'insensitive' } } : {};    
    const rows = await prisma.produto.findMany({ where, orderBy: { nome: 'asc' } });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

/**
 * GET /api/materials/:id
 */
async function getProduto(req, res) {
  try {
    const id = Number(req.params.id);
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(produto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

/**
 * POST /api/produtos
 * body: { name, pricePerM3 }
 */
async function createProduto(req, res) {
  try {
    const { nome, valor_m3 } = req.body;
    if (!nome || typeof nome !== 'string' || !nome.trim()) return res.status(400).json({ error: 'Nome é necessário' });
    const data = { nome: nome.trim(), valor_m3: valor_m3 !== undefined ? Number(valor_m3) : 0 };
    const produto = await prisma.produto.create({ data });
    res.status(201).json(produto);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ error: 'produto name must be unique', meta: err.meta });
    res.status(500).json({ error: 'server' });
  }
}

/**
 * PUT /api/produtos/:id
 * body: { name?, pricePerM3? }  (full replace / update)
 * Accepts partial update; treats as upsert-like update.
 */
async function updateProduto(req, res) {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const existing = await prisma.produto.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'produto not found' });

    const updated = await prisma.produto.update({
      where: { id },
      data: {
        nome: body.nome !== undefined ? String(body.nome).trim() : existing.nome,
        valor_m3: body.valor_m3 !== undefined ? Number(body.valor_m3) : existing.valor_m3
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ error: 'produto name must be unique', meta: err.meta });
    res.status(500).json({ error: 'server' });
  }
}


/**
 * DELETE /api/produtos/:id
 */
async function deleteProduto(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.produto.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

export default { 
  listProdutos,
  getProduto,
  createProduto,
  updateProduto,
  deleteProduto
};
