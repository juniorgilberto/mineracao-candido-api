import express from 'express';
import auth from '../../middleware/auth.js'
import { usuarioController } from "../Controllers/UsuarioController.js";


const UsuarioRouter = express.Router();

const UsuarioController = new usuarioController();

UsuarioRouter.get("/usuarios", auth(['admin']), UsuarioController.getAllUsuarios)

UsuarioRouter.get("/usuarios/:id", auth(['admin']), UsuarioController.getUsuario)

UsuarioRouter.post("/usuarios", auth(['admin']), UsuarioController.createUsuario)

UsuarioRouter.put("/usuarios/:id", auth(['admin']), UsuarioController.alterUsuario)

UsuarioRouter.delete("/usuarios/:id", auth(['admin']), UsuarioController.deleteUsuario)

UsuarioRouter.post("/login", UsuarioController.login);

export { UsuarioRouter };