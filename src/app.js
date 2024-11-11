// Esse arquivo server pra centralizar as configs do projeto;
//cors, middlewars.. etc;
import express from "express";
import index from "./Routes/index.js";

const app = express();

app.use(express.json());

//Rotas
app.use('/', index);

export { app };

