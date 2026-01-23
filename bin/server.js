import { app } from "../src/app.js";
import { Server } from "socket.io";
import http from "http";


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:9000", // Porta padrão do Quasar
    methods: ["GET", "POST"]
  }
});

// 3. Escutar conexões
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Usuário desconectado');
  });
});
const port = normalizaPort(process.env.PORT || '3000');

function normalizaPort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
            return port;
        }
    return false;
}

app.get('/', (req, res) => {
  res.send('Welcome to the REST API of Mineração Candido!');
});

server.listen(port, function () {
    console.log(`app listening on port ${port}`)
})

