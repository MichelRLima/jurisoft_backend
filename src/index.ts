import express from "express";
import routes from "./routes";
import cors from "cors";
const app = express();
const PORT = 3333;

app.use(express.json());

app.use(
  cors({
    origin: "*", // frontend rodando aqui
  })
);
app.get("/", (req, res) => {
  res.send("API está funcionando!");
});
app.use(routes);
app.use(cors());
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
