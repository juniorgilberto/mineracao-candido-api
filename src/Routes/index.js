import express from "express";
import { ClienteRouter } from './ClienteRouter'

const router = express.Router();
router.use("/", ClienteRouter)

export default router;
