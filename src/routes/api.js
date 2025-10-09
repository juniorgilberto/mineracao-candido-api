// routes/api.js
import express from "express";
import clients from '../controllers/clients.js';
import materials from '../controllers/materials.js';
import vehicles from '../controllers/vehicles.js';
import orders from '../controllers/orders.js';

const router = express.Router();

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

// orders
router.get('/orders', orders.listOrders);
router.get('/orders/:id', orders.getOrder);
router.post('/orders', orders.createOrder);
router.put('/orders/:id', orders.updateOrder);
router.delete('/orders/:id', orders.deleteOrder);

export default router;
