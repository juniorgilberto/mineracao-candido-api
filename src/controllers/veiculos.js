// controllers/vehicles.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listVeiculos(req, res) {
  try {
    const { clientId, plate, search } = req.query;
    const where = {};
    if (clientId) where.clientId = clientId;
    if (plate) where.plate = { equals: plate.toUpperCase() };
    if (search) where.OR = [{ plate: { contains: search, mode: 'insensitive' } }];
    const rows = await prisma.veiculo.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function getVeiculo(req, res) {
  try {
    const id = Number(req.params.id);
    const veiculo = await prisma.veiculo.findUnique({ where: { id } });
    if (!veiculo) return res.status(404).json({ error: 'veiculo not found' });
    res.json(veiculo);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function createVeiculo(req, res) {
  try {
    const { clientId, placa, metragem } = req.body;
    if (!clientId || !placa) return res.status(400).json({ error: 'clientId and plate required' });
    // ensure client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: 'client not found' });
    const v = await prisma.veiculo.create({
      data: { clientId, placa: placa.trim().toUpperCase(), metragem: metragem || 0 }
    });
    res.status(201).json(v);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

async function updateVeiculo(req, res) {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const existing = await prisma.veiculo.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'veiculo not found' });
    const updated = await prisma.veiculo.update({
      where: { id },
      data: {
        placa: body.placa ? body.placa.trim().toUpperCase() : existing.placa,
        metragem: body.metragem !== undefined ? body.metragem : existing.metragem,
        // allow moving veiculo to another client if provided
        clientId: body.clientId !== undefined ? body.clientId : existing.clientId
      }
    });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function deleteVeiculo(req, res) {
  try {
    const id = req.params.id;
    await prisma.veiculo.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

export default {
  listVeiculos,
  getVeiculo,
  createVeiculo,
  updateVeiculo,
  deleteVeiculo
};
