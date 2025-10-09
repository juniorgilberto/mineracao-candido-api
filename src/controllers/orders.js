// controllers/orders.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/orders
 * filters: ?from=YYYY-MM-DD&to=YYYY-MM-DD&material=nomeOuId&search=&clientId=&vehiclePlate=
 * returns list ordered desc by datetime
 */
async function listOrders(req, res) {
  try {
    const { from, to, material, search, clientId, vehiclePlate } = req.query;
    const where = {};
    if (from) where.datetime = { gte: new Date(from + 'T00:00:00Z') };
    if (to) where.datetime = Object.assign(where.datetime || {}, { lte: new Date(to + 'T23:59:59Z') });
    if (material) {
      // allow numeric id or name
      if (!isNaN(Number(material))) where.materialId = Number(material);
      else {
        // join by name: we need material name -> materialId. Simpler: search by material string
        where.material = { name: { contains: material, mode: 'insensitive' } };
      }
    }
    if (clientId) where.clientId = clientId;
    if (vehiclePlate) where.vehiclePlate = { equals: vehiclePlate.trim().toUpperCase() };
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { vehiclePlate: { contains: search, mode: 'insensitive' } },
        { material: { some: { name: { contains: search, mode: 'insensitive' } } } } // fallback; rarely used
      ];
    }

    // Because of relations and possible material name filter, fallback to simple SQL via prisma.findMany with basic filters:
    const orders = await prisma.order.findMany({
      where,
      orderBy: { datetime: 'desc' },
      include: { material: true }
    });
    res.json(orders);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

/**
 * GET /api/orders/:id
 */
async function getOrder(req, res) {
  try {
    const id = Number(req.params.id);
    const o = await prisma.order.findUnique({ where: { id }, include: { material: true } });
    if (!o) return res.status(404).json({ error: 'order not found' });
    res.json(o);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

/**
 * POST /api/orders
 * body: { clientId, clientName, vehicleId?, vehiclePlate?, materialId, materialPrice? , vehicleMetragem? , datetime? }
 * - if vehicleId provided, prefer its plate and metragem as defaults (but allow override)
 * - if materialPrice not provided, use material.pricePerM3
 * - totalValue = vehicleMetragem * materialPrice
 */
async function createOrder(req, res) {
  const t = await prisma.$transaction(async (prismaTx) => {
    try {
      const body = req.body;
      if (!body.materialId && !body.materialName) return res.status(400).json({ error: 'materialId required' });
      // fetch material
      let material;
      if (body.materialId) material = await prismaTx.material.findUnique({ where: { id: Number(body.materialId) } });
      else material = await prismaTx.material.findFirst({ where: { name: { equals: body.materialName, mode: 'insensitive' } } });
      if (!material) return res.status(404).json({ error: 'material not found' });

      // determine price
      const materialPrice = body.materialPrice !== undefined ? Number(body.materialPrice) : Number(material.pricePerM3 || 0);

      // vehicle data
      let vehiclePlate = (body.vehiclePlate || '').trim().toUpperCase();
      let vehicleMetragem = body.vehicleMetragem !== undefined ? Number(body.vehicleMetragem) : null;
      if (body.vehicleId) {
        const v = await prismaTx.vehicle.findUnique({ where: { id: body.vehicleId } });
        if (!v) return res.status(404).json({ error: 'vehicle not found' });
        vehiclePlate = v.plate;
        if (vehicleMetragem === null) vehicleMetragem = Number(v.metragem || 0);
      }
      if (vehicleMetragem === null) vehicleMetragem = Number(body.m3 || 0);

      const clientName = body.clientName || null;

      const totalValue = Number(vehicleMetragem || 0) * Number(materialPrice || 0);

      const created = await prismaTx.order.create({
        data: {
          clientId: body.clientId || null,
          clientName,
          materialId: material.id,
          materialPrice,
          vehicleMetragem,
          vehiclePlate: vehiclePlate || '',
          totalValue,
          datetime: body.datetime ? new Date(body.datetime) : undefined
        }
      });
      return res.status(201).json(created);
    } catch (err) {
      console.error(err);
      // propagate error
      throw err;
    }
  }).catch(e => {
    // errors already logged above
    if (e && e.status) return; // response sent
    return res.status(500).json({ error: 'server' });
  });
}

/**
 * PUT /api/orders/:id
 * body can contain any of: clientId, clientName, vehicleId, vehiclePlate, materialId, materialPrice, vehicleMetragem, datetime
 * Will recalc totalValue depending on provided values.
 */
async function updateOrder(req, res) {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'order not found' });

    // determine materialPrice to use
    let materialPrice = existing.materialPrice;
    let materialId = existing.materialId;
    if (body.materialId && body.materialId !== existing.materialId) {
      const mat = await prisma.material.findUnique({ where: { id: Number(body.materialId) } });
      if (!mat) return res.status(404).json({ error: 'material not found' });
      materialId = mat.id;
      materialPrice = body.materialPrice !== undefined ? Number(body.materialPrice) : Number(mat.pricePerM3 || 0);
    } else if (body.materialPrice !== undefined) {
      materialPrice = Number(body.materialPrice);
    }

    // determine vehiclePlate & metragem
    let vehiclePlate = existing.vehiclePlate;
    let vehicleMetragem = Number(existing.vehicleMetragem || 0);
    if (body.vehicleId) {
      const v = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
      if (!v) return res.status(404).json({ error: 'vehicle not found' });
      vehiclePlate = v.plate;
      if (body.vehicleMetragem === undefined) vehicleMetragem = Number(v.metragem || 0);
    }
    if (body.vehiclePlate !== undefined) vehiclePlate = (body.vehiclePlate || '').trim().toUpperCase();
    if (body.vehicleMetragem !== undefined) vehicleMetragem = Number(body.vehicleMetragem || 0);

    const totalValue = Number(vehicleMetragem || 0) * Number(materialPrice || 0);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        clientId: body.clientId !== undefined ? body.clientId : existing.clientId,
        clientName: body.clientName !== undefined ? body.clientName : existing.clientName,
        materialId,
        materialPrice,
        vehicleMetragem,
        vehiclePlate,
        totalValue,
        datetime: body.datetime ? new Date(body.datetime) : existing.datetime
      }
    });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

async function deleteOrder(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.order.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server' }); }
}

module.exports = { listOrders, getOrder, createOrder, updateOrder, deleteOrder };
