import { Router, Request, Response } from "express";

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
import createProcessoController from "./controllers/processos/createProcessoController";
import googleListFilesController from "./controllers/googleDrive/googleListFilesController";
import getAllProcessosController from "./controllers/processos/getAllProcessosController";
import findAllUserController from "./controllers/user/findAllUserController";
import deleteProcessoController from "./controllers/processos/deleteProcessoController";
import getDetailsProcessoController from "./controllers/processos/getDetailsProcessoController";
import googleThumbnailController from "./controllers/googleDrive/googleThumbnailController";
import deleteAnexoProcessoController from "./controllers/processos/deleteAnexoProcessoController";

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
routes.get("/auth/google", isAuthenticated, googleAuthController.handle);

/**
 * 2. Callback para onde o Google redireciona
 */
routes.get("/oauth2callback", isAuthenticated, oauth2callbackController.handle);

/**
 * 3. Listagem dos arquivos da sua pasta específica
 */
routes.get("/drive/list", googleListFilesController.handle);

// 4. Rota para CRIAR uma pasta dentro da sua pasta principal
routes.post("/drive/mkdir", googleCreateFolderController.handle);

// Usamos upload.single('file') para dizer que esperamos UM arquivo chamado 'file'
/* routes.post(
  "/drive/upload",
  upload.single("file"),
  googleUploadFileController.handle,
); */

// Rota DELETE passando o ID como parâmetro de rota
routes.delete(
  "/drive/delete/:fileId",
  isAuthenticated,
  googleDeleteFileController.handle,
);

routes.post(
  "/create/processo",
  upload.array("file"),
  createProcessoController.handle,
);

routes.post(
  "/find/processos",
  isAuthenticated,
  getAllProcessosController.handle,
);

routes.post(
  "/delete/processo",
  isAuthenticated,
  deleteProcessoController.handle,
);

routes.post(
  "/find/processoDetails",
  isAuthenticated,
  getDetailsProcessoController.handle,
);

routes.get(
  "/anexo/thumbnail",
  isAuthenticated,
  googleThumbnailController.handle,
);

routes.post(
  "/anexo/delete",
  isAuthenticated,
  deleteAnexoProcessoController.handle,
);

routes.get("/find/allUsers", isAuthenticated, findAllUserController.handle);
export default routes;
