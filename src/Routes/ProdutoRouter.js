import express from 'express';
import auth from '../../middleware/auth.js'
import { produtoController } from "../Controllers/ProdutoController.js";


const ProdutoRouter = express.Router();

const ProdutoController = new produtoController();

ProdutoRouter.get("/produtos", auth(['admin']), ProdutoController.getAllProdutos)

ProdutoRouter.get("/produtos/:id", auth(['admin']), ProdutoController.getProduto)

export { ProdutoRouter };