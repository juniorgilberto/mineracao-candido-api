import express from 'express';
import auth from '../../middleware/auth.js'
import { clienteController } from "../Controllers/ClienteController.js";


const ClienteRouter = express.Router();

const ClienteController = new clienteController();

ClienteRouter.get("/clientes", auth(['admin']), ClienteController.getAllClients)

ClienteRouter.get("/clientes/:id", auth(['admin']), ClienteController.getClient)

ClienteRouter.post("/clientes", auth(['admin']), ClienteController.createClient)

ClienteRouter.put("/clientes/:id", auth(['admin']), ClienteController.alterClient)

ClienteRouter.delete("/clientes/:id", auth(['admin']), ClienteController.deleteClient)

export { ClienteRouter };