// Esse arquivo server pra centralizar as configs do projeto;
//cors, middlewars.. etc;
import express from "express";
import cors from 'cors'
import api from "./routes/api.js";

const app = express();

app.use(express.json());
app.use(cors());

//Rotas
BigInt.prototype.toJSON = function () {
  return Number(this)
}
app.use('/', api);

export { app };

