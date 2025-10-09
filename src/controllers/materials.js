// controllers/materials.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/materials
 * optional: ?search=texto
 */
async function listMaterials(req, res) {
  try {
    const { search } = req.query;
    const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
    const rows = await prisma.material.findMany({ where, orderBy: { name: 'asc' } });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

/**
 * GET /api/materials/:id
 */
async function getMaterial(req, res) {
  try {
    const id = Number(req.params.id);
    const m = await prisma.material.findUnique({ where: { id } });
    if (!m) return res.status(404).json({ error: 'material not found' });
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

/**
 * POST /api/materials
 * body: { name, pricePerM3 }
 */
async function createMaterial(req, res) {
  try {
    const { name, pricePerM3 } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name required' });
    const data = { name: name.trim(), pricePerM3: pricePerM3 !== undefined ? Number(pricePerM3) : 0 };
    const m = await prisma.material.create({ data });
    res.status(201).json(m);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ error: 'material name must be unique', meta: err.meta });
    res.status(500).json({ error: 'server' });
  }
}

/**
 * PUT /api/materials/:id
 * body: { name?, pricePerM3? }  (full replace / update)
 * Accepts partial update; treats as upsert-like update.
 */
async function updateMaterial(req, res) {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'material not found' });

    const updated = await prisma.material.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name).trim() : existing.name,
        pricePerM3: body.pricePerM3 !== undefined ? Number(body.pricePerM3) : existing.pricePerM3
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ error: 'material name must be unique', meta: err.meta });
    res.status(500).json({ error: 'server' });
  }
}

/**
 * PATCH /api/materials/:id/price
 * body: { pricePerM3 }  (only price)
 * Convenient endpoint to change price only.
 */
async function patchPrice(req, res) {
  try {
    const id = Number(req.params.id);
    const { pricePerM3 } = req.body;
    if (pricePerM3 === undefined) return res.status(400).json({ error: 'pricePerM3 required' });
    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'material not found' });
    const updated = await prisma.material.update({ where: { id }, data: { pricePerM3: Number(pricePerM3) } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

/**
 * DELETE /api/materials/:id
 */
async function deleteMaterial(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.material.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

module.exports = {
  listMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  patchPrice,
  deleteMaterial
};
