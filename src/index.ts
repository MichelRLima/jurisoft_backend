import express from "express";
import routes from "./routes";
import cors from "cors";
import { initializeApp } from "./scripts/initialize";
const app = express();
const PORT = process.env.PORT || 3333;

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
app.use(cors());
async function startServer() {
  try {
    // Roda o script de inicialização ANTES do servidor subir
    await initializeApp();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Falha ao iniciar o servidor:", error);
    process.exit(1); // Fecha o processo se a inicialização falhar
  }
}

startServer();
