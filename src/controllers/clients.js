// controllers/clients.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * GET /api/clients
 * optional query: ?type=PF|PJ&search=texto
 */
async function listClients(req, res) {
  try {
    const { type, search } = req.query;
    const where = {};
    if (type && (type === 'PF' || type === 'PJ')) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { razaoSocial: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { cnpj: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const clients = await prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { vehicles: true }
    });
    res.json(clients);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function getClient(req, res) {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({ where: { id }, include: { vehicles: true } });
    if (!client) return res.status(404).json({ error: 'client not found' });
    res.json(client);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function createClient(req, res) {
  try {
    const data = req.body;
    // minimal validation
    if (!data.type || !['PF','PJ'].includes(data.type)) return res.status(400).json({ error: 'type PF or PJ required' });
    if (!data.name) return res.status(400).json({ error: 'name required' });

    const client = await prisma.client.create({
      data: {
        type: data.type,
        name: data.name,
        cpf: data.cpf || null,
        razaoSocial: data.razaoSocial || null,
        cnpj: data.cnpj || null,
        ie: data.ie || null,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null
      }
    });
    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ error: 'unique constraint violation', meta: err.meta });
    res.status(500).json({ error: 'server' });
  }
}

async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'client not found' });

    const updated = await prisma.client.update({
      where: { id },
      data: {
        type: data.type || existing.type,
        name: data.name || existing.name,
        cpf: data.cpf !== undefined ? data.cpf : existing.cpf,
        razaoSocial: data.razaoSocial !== undefined ? data.razaoSocial : existing.razaoSocial,
        cnpj: data.cnpj !== undefined ? data.cnpj : existing.cnpj,
        ie: data.ie !== undefined ? data.ie : existing.ie,
        address: data.address !== undefined ? data.address : existing.address,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        email: data.email !== undefined ? data.email : existing.email
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ error: 'unique constraint violation', meta: err.meta });
    res.status(500).json({ error: 'server' });
  }
}

async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    await prisma.client.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

export default { listClients, getClient, createClient, updateClient, deleteClient };
