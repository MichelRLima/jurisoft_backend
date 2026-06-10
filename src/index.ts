import "dotenv/config";
import express from "express";
import routes from "./routes";
import cors from "cors";
import jwt from "jsonwebtoken";
import http from "http"; // Adicione isto
import { Server } from "socket.io"; // Adicione isto
import { initializeApp } from "./scripts/initialize";
import { startCronJobs } from "./crons";
const app = express();
const server = http.createServer(app); // Criamos o servidor HTTP manualmente
const PORT = process.env.PORT || 3333;

// Configuração do Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Ajuste conforme necessário por segurança
    methods: ["GET", "POST"],
  },
});
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Token não fornecido"));
  }

  try {
    // 1. Corrigimos a tipagem para o formato real que o seu JWT possui
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      sub: string;
      iat: number;
      exp: number;
    };

    // 2. Agora o TypeScript reconhece o 'sub' sem reclamar
    socket.data.userId = decoded.sub;

    next();
  } catch (err) {
    next(new Error("Token inválido"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  if (userId) {
    socket.join(`user_${userId}`); // O usuário entra na sala dele
    console.log(`Usuário ${userId} entrou na sala user_${userId}`);
  }
});
export { io };
app.use(express.json());

app.use(
  cors({
    origin: "*", // frontend rodando aqui
  }),
);
app.get("/", (req, res) => {
  res.send("API está funcionando!");
});

app.use(routes);
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Erro interno no servidor",
    },
  });
});

async function startServer() {
  try {
    await initializeApp();

    // CORREÇÃO: Use 'server.listen' em vez de 'app.listen'
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      startCronJobs();
    });
  } catch (error) {
    console.error("❌ Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
}

startServer();
