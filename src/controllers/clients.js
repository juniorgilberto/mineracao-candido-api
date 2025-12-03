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
    if (type && (type === 'PESSOA_FISICA' || type === 'PESSOA_JURIDICA')) where.type = type;
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { razaoSocial: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { cnpj: { contains: search } },
        { telefone:{ contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const clients = await prisma.client.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: { veiculos: true }
    });    
    res.json(clients);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function getClient(req, res) {
  try {
    const id = Number(req.params.id);
    const client = await prisma.client.findUnique({ where: { id }, include: { veiculos: true } });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(client);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function createClient(req, res) {
  try {
    const data = req.body;
    // minimal validation
    if (!data.type || !['PESSOA_FISICA','PESSOA_JURIDICA'].includes(data.type)) return res.status(400).json({ error: 'type PESSOA_FISICA or PESSOA_JURIDICA required' });
    if (!data.nome) return res.status(400).json({ error: 'Por favor preencha o nome.' });

    const client = await prisma.client.create({
      data: {
        type: data.type,
        nome: data.nome,
        cpf: data.cpf || null,
        razaoSocial: data.razaoSocial || null,
        cnpj: data.cnpj || null,
        inscricaoEstadual: data.inscricaoEstadual || null,
        endereco: data.endereco || null,
        telefone: data.telefone || null,
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
    const id = Number(req.params.id);
    const data = req.body;
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'client not found' });

    const updated = await prisma.client.update({
      where: { id },
      data: {
        type: data.type || existing.type,
        nome: data.nome || existing.nome,
        cpf: data.cpf !== undefined ? data.cpf : existing.cpf,
        razaoSocial: data.razaoSocial !== undefined ? data.razaoSocial : existing.razaoSocial,
        cnpj: data.cnpj !== undefined ? data.cnpj : existing.cnpj,
        inscricaoEstadual: data.inscricaoEstadual !== undefined ? data.inscricaoEstadual : existing.inscricaoEstadual,
        endereco: data.endereco !== undefined ? data.endereco : existing.endereco,
        telefone: data.telefone !== undefined ? data.telefone : existing.telefone,
        email: data.email !== undefined ? data.email : existing.email,
        saldo: data.saldo !== undefined ? Number(data.saldo) : existing.saldo
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
    const id = Number(req.params.id);
    await prisma.client.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
}

export default { listClients, getClient, createClient, updateClient, deleteClient };
