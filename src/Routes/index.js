import express from "express";
import { ClienteRouter } from './ClienteRouter.js'
import { VeiculoRouter } from "./VeiculoRouter.js";
import { ProdutoRouter } from "./ProdutoRouter.js";
import { UsuarioRouter } from './UsuarioRouter.js'
import { PedidoRouter } from './PedidoRouter.js'

const router = express.Router();


router.use("/", ClienteRouter)

router.use("/", VeiculoRouter)

router.use("/", ProdutoRouter)

router.use("/", PedidoRouter)

router.use("/", UsuarioRouter)

export default router;
