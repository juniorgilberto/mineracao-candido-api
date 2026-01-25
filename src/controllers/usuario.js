import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function listUsuarios(req, res) {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { usuario: { contains: search, mode: "insensitive" } },
        { role: { contains: search } },
      ];
    }
    const usuarios = await prisma.user.findMany({
      where,
      orderBy: { nome: "asc" },
    });
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

async function getUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    const usuario = await prisma.user.findUnique({ where: { id } });
    if (!usuario) return res.status(404).json({ error: "usuario not found" });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

async function createUsuario(req, res) {
  try {
    const data = req.body;
    // minimal validation
    if (!data.nome) return res.status(400).json({ error: "Nome é necessário" });

    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        usuario: data.usuario,
        role: data.role,
        senha: data.senha,
      },
    });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    if (err.code === "P2002")
      return res
        .status(400)
        .json({ error: "unique constraint violation", meta: err.meta });
    res.status(500).json({ error: "server" });
  }
}

async function updateUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "user not found" });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        nome: data.nome || existing.nome,
        usuario: data.usuario || existing.usuario,
        role: data.role || existing.role,
        senha: data.senha || existing.senha,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === "P2002")
      return res
        .status(400)
        .json({ error: "unique constraint violation", meta: err.meta });
    res.status(500).json({ error: "server" });
  }
}

async function deleteUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

async function login(req, res) {
  try {
    const { usuario, senha, lembrarMe } = req.body;
    if (!usuario || !senha)
      return res.status(400).json({ error: "Credenciais inválidas" });

    const user = await prisma.user.findUnique({
      where: { usuario },
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    if (user.senha !== senha)
      return res.status(401).json({ error: "Senha incorreta" });

    const tempoExpiracao = lembrarMe ? "30d" : "1h";

    const tokenGerado = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: tempoExpiracao },
    );
    res.status(200).json({
      token: tokenGerado, // Aqui vai o de 1h OU o de 30d
      nome: user.nome,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server" });
  }
}

export default {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  login,
};
