// controllers/vehicles.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listVehicles(req, res) {
  try {
    const { clientId, plate, search } = req.query;
    const where = {};
    if (clientId) where.clientId = clientId;
    if (plate) where.plate = { equals: plate.toUpperCase() };
    if (search) where.OR = [{ plate: { contains: search, mode: 'insensitive' } }];
    const rows = await prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function getVehicle(req, res) {
  try {
    const v = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!v) return res.status(404).json({ error: 'vehicle not found' });
    res.json(v);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function createVehicle(req, res) {
  try {
    const { clientId, plate, metragem } = req.body;
    if (!clientId || !plate) return res.status(400).json({ error: 'clientId and plate required' });
    // ensure client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: 'client not found' });
    const v = await prisma.vehicle.create({
      data: { clientId, plate: plate.trim().toUpperCase(), metragem: metragem || 0 }
    });
    res.status(201).json(v);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

async function updateVehicle(req, res) {
  try {
    const id = req.params.id;
    const body = req.body;
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'vehicle not found' });
    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        plate: body.plate ? body.plate.trim().toUpperCase() : existing.plate,
        metragem: body.metragem !== undefined ? body.metragem : existing.metragem,
        // allow moving vehicle to another client if provided
        clientId: body.clientId !== undefined ? body.clientId : existing.clientId
      }
    });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function deleteVehicle(req, res) {
  try {
    const id = req.params.id;
    await prisma.vehicle.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

export default { listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle };
