import express from 'express';
import auth from '../../middleware/auth.js'
import { veiculoController } from "../Controllers/VeiculoController.js";


const VeiculoRouter = express.Router();

const VeiculoController = new veiculoController();

VeiculoRouter.get("/veiculos", auth(['admin']), VeiculoController.getAllVeiculos)

VeiculoRouter.get("/veiculos/:id", auth(['admin']), VeiculoController.getVeiculos)

VeiculoRouter.post("/veiculos", auth(['admin']), VeiculoController.createVeiculo)

VeiculoRouter.put("/veiculos/:id", auth(['admin']), VeiculoController.alterVeiculo)

VeiculoRouter.delete("/veiculos/:id", auth(['admin']), VeiculoController.deleteVeiculo)

export { VeiculoRouter };