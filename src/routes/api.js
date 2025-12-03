// routes/api.js
import express from "express";
import clients from '../controllers/clients.js';
import produtos from '../controllers/produtos.js';
import veiculos from '../controllers/veiculos.js';
import pedidos from '../controllers/pedidos.js';
import usuario from '../controllers/usuario.js';
import fechamento from "../controllers/fechamento.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// clients
router.get('/clients', clients.listClients);
router.get('/clients/:id', clients.getClient);
router.post('/clients', clients.createClient);
router.put('/clients/:id', clients.updateClient);
router.delete('/clients/:id', auth, clients.deleteClient);

// materials
router.get('/produtos', produtos.listProdutos);
router.get('/produtos/:id', produtos.getProduto);
router.post('/produtos', auth, produtos.createProduto);
router.put('/produtos/:id', produtos.updateProduto);
router.delete('/produtos/:id', auth, produtos.deleteProduto);

// vehicles
router.get('/veiculos', veiculos.listVeiculos);
router.get('/veiculos/:id', veiculos.getVeiculo);
router.post('/veiculos', veiculos.createVeiculo);
router.put('/veiculos/:id', veiculos.updateVeiculo);
router.delete('/veiculos/:id', veiculos.deleteVeiculo);

// orders
router.get('/pedidos', pedidos.listPedidos);
router.get('/pedidos/:id', pedidos.getPedido);
router.post('/pedidos', pedidos.createPedido);
router.put('/pedidos/:id', pedidos.updatePedido);
router.delete('/pedidos/:id', pedidos.deletePedido);

//usuario

router.get('/usuarios', usuario.listUsuarios);
router.get('/usuarios/:id', usuario.getUsuario);
router.post('/usuarios', auth, usuario.createUsuario);
router.put('/usuarios/:id', auth, usuario.updateUsuario);
router.delete('/usuarios/:id', auth, usuario.deleteUsuario);
router.post('/login', usuario.login);

router.get('/fechamentos', fechamento.listFechamentos);
router.get('/fechamentos/:id', fechamento.getFechamento);
router.post('/fechamentos', auth, fechamento.createFechamento);
router.put('/fechamentos/:id', auth, fechamento.updateFechamento);
router.delete('/fechamentos/:id', auth, fechamento.deleteFechamento);

export default router;
