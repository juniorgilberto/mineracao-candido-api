import express from 'express';
import auth from '../../middleware/auth.js'
import { pedidoController } from "../Controllers/PedidoController.js";


const PedidoRouter = express.Router();

const PedidoController = new pedidoController();

PedidoRouter.get("/pedidos", auth(['admin']), PedidoController.getAllPedidos)

PedidoRouter.get("/pedidos/:id", auth(['admin']), PedidoController.getPedido)

PedidoRouter.post("/pedidos", auth(['admin']), PedidoController.createPedido)

PedidoRouter.put("/pedidos/:id", auth(['admin']), PedidoController.alterPedido)

PedidoRouter.delete("/pedidos/:id", auth(['admin']), PedidoController.deletePedido)

export { PedidoRouter };