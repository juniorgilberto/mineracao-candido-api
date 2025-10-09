// routes/api.js
const express = require('express');
const router = express.Router();

const clients = require('../controllers/clients');
const materials = require('../controllers/materials');
const vehicles = require('../controllers/vehicles');
const orders = require('../controllers/orders');
const prices = require('../controllers/prices');

// clients
router.get('/clients', clients.listClients);
router.get('/clients/:id', clients.getClient);
router.post('/clients', clients.createClient);
router.put('/clients/:id', clients.updateClient);
router.delete('/clients/:id', clients.deleteClient);

// materials
router.get('/materials', materials.listMaterials);
router.get('/materials/:id', materials.getMaterial);
router.post('/materials', materials.createMaterial);
router.put('/materials/:id', materials.updateMaterial);
router.patch('/materials/:id/price', materials.patchPrice);
router.delete('/materials/:id', materials.deleteMaterial);

// vehicles
router.get('/vehicles', vehicles.listVehicles);
router.get('/vehicles/:id', vehicles.getVehicle);
router.post('/vehicles', vehicles.createVehicle);
router.put('/vehicles/:id', vehicles.updateVehicle);
router.delete('/vehicles/:id', vehicles.deleteVehicle);

// prices (alias to materials list/update)
router.get('/prices', prices.listPrices);
router.put('/prices/:id', prices.updatePrice);

// orders
router.get('/orders', orders.listOrders);
router.get('/orders/:id', orders.getOrder);
router.post('/orders', orders.createOrder);
router.put('/orders/:id', orders.updateOrder);
router.delete('/orders/:id', orders.deleteOrder);

module.exports = router;
