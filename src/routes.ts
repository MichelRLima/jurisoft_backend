import { Router, Request, Response } from "express";
import { google } from "googleapis";
import fs from "fs"; // 1. ADICIONAR ESTA LINHA
import path from "path"; // 2. ADICIONAR ESTA LINHA
import {
  oauth2Client,
  DRIVE_SCOPES,
} from "./services/googleDriveService/googleDriveService";
const TOKEN_PATH = path.join(process.cwd(), "token.json"); // 3. ADICIONAR ESTA LINHA
const createUserController = require("./controllers/user/createUserController");
const loginUserController = require("./controllers/user/loginUserController");
import { isAuthenticated } from "./middlewares/isAuthenticated";
import googleAuthController from "./controllers/googleDrive/googleAuthController";
import oauth2callbackController from "./controllers/googleDrive/oauth2callbackController";
import googleCreateFolderController from "./controllers/googleDrive/googleCreateFolderController";
import googleUploadFileController from "./controllers/googleDrive/googleUploadFileController";
import multer from "multer";
import googleDeleteFileController from "./controllers/googleDrive/googleDeleteFileController";
import updatePerfilController from "./controllers/user/perfil/updatePerfilController";

const upload = multer({ storage: multer.memoryStorage() });
const routes = Router();

// Rota simples de teste
routes.get("/ping", isAuthenticated, (req: Request, res: Response) => {
  res.json({ message: "pong 🏓" });
});

routes.post("/createUser", createUserController.handle);
routes.post("/login", loginUserController.handle);

routes.put("/update/perfil", isAuthenticated, updatePerfilController.handle);

// --- NOVAS ROTAS DO GOOGLE DRIVE ---

/**
 * 1. Inicia o fluxo de autenticação
 * Acesse: http://localhost:3333/auth/google
 */
routes.get("/auth/google", googleAuthController.handle);

/**
 * 2. Callback para onde o Google redireciona
 */
routes.get("/oauth2callback", oauth2callbackController.handle);

/**
 * 3. Listagem dos arquivos da sua pasta específica
 */
routes.get("/drive/list", async (req: Request, res: Response) => {
  try {
    // 5. ADICIONAR ESTA LÓGICA PARA LER O ARQUIVO SE A MEMÓRIA ESTIVER VAZIA:
    if (!oauth2Client.credentials.access_token && fs.existsSync(TOKEN_PATH)) {
      const savedToken = fs.readFileSync(TOKEN_PATH, "utf-8");
      oauth2Client.setCredentials(JSON.parse(savedToken));
    }

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const FOLDER_ID = "1N3mHm0GtfkV-gySkr6QlPKKmu1lNwq1-";

    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, size)",
      pageSize: 20,
    });

    res.json({ folder: FOLDER_ID, files: response.data.files });
  } catch (error: any) {
    res.status(401).json({ error: "Necessário autenticar" });
  }
});

// 4. Rota para CRIAR uma pasta dentro da sua pasta principal
routes.post("/drive/mkdir", googleCreateFolderController.handle);

// Usamos upload.single('file') para dizer que esperamos UM arquivo chamado 'file'
routes.post(
  "/drive/upload",
  upload.single("file"),
  googleUploadFileController.handle,
);

// Rota DELETE passando o ID como parâmetro de rota
routes.delete("/drive/delete/:fileId", googleDeleteFileController.handle);

export default routes;
