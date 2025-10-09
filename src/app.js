// Esse arquivo server pra centralizar as configs do projeto;
//cors, middlewars.. etc;
import express from "express";
import cors from 'cors'
import api from "./routes/api";

const app = express();

app.use(express.json());
app.use(cors());

//Rotas
app.use('/api', api);

export { app };

