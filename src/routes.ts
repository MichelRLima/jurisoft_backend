import { Router, Request, Response } from "express";

const createUserController = require("./controllers/user/createUserController");
const loginUserController = require("./controllers/user/loginUserController");
import { isAuthenticated } from "./middlewares/isAuthenticated";

import multer from "multer";

import updatePerfilController from "./controllers/user/perfil/updatePerfilController";
import createProcessoController from "./controllers/processos/createProcessoController";
import getAllProcessosController from "./controllers/processos/getAllProcessosController";
import findAllUserController from "./controllers/user/findAllUserController";
import deleteProcessoController from "./controllers/processos/deleteProcessoController";
import getDetailsProcessoController from "./controllers/processos/getDetailsProcessoController";
import deleteAnexoProcessoController from "./controllers/processos/deleteAnexoProcessoController";
import editProcessoController from "./controllers/processos/editProcessoController";
import createAnexoController from "./controllers/processos/createAnexoController";
import updateUserController from "./controllers/user/perfil/updateUserController";
import updatePasswordController from "./controllers/user/updatePasswordController";
import ForgotPasswordController from "./controllers/user/ForgotPasswordController";
import forgotResetPasswordController from "./controllers/user/forgotResetPasswordController";
import createClienteController from "./controllers/clientes/createClienteController";
import getClientesController from "./controllers/clientes/getClientesController";
import deleteClienteController from "./controllers/clientes/deleteClienteController";
import getDetailsClienteController from "./controllers/clientes/getDetailsClienteController";
import getProcessosClienteController from "./controllers/clientes/getProcessosClienteController";

const upload = multer({ storage: multer.memoryStorage() });
const routes = Router();

// Rota simples de teste
routes.get("/ping", (req: Request, res: Response) => {
  res.json({ message: "pong 🏓" });
});

// Rota para o usuário digitar o email e receber o código de 4 dígitos
routes.post("/auth/forgotPassword", ForgotPasswordController.handle);

// Rota onde o usuário envia o email, o código recebido e a senha nova
routes.post("/auth/forgotResetPassword", forgotResetPasswordController.handle);

routes.post("/createUser", createUserController.handle);
routes.post("/login", loginUserController.handle);

routes.put("/update/perfil", isAuthenticated, updatePerfilController.handle);
routes.post("/update/user", isAuthenticated, updateUserController.handle);
routes.post(
  "/update/password",
  isAuthenticated,
  updatePasswordController.handle,
);
// --- NOVAS ROTAS DO GOOGLE DRIVE ---

// Usamos upload.single('file') para dizer que esperamos UM arquivo chamado 'file'
/* routes.post(
  "/drive/upload",
  upload.single("file"),
  googleUploadFileController.handle,
); */

routes.post(
  "/create/processo",
  isAuthenticated,
  upload.array("file"),
  createProcessoController.handle,
);
routes.post(
  "/create/anexo",
  upload.array("file"),
  isAuthenticated,
  createAnexoController.handle,
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

routes.post("/edit/processo", isAuthenticated, editProcessoController.handle);

routes.post(
  "/find/processoDetails",
  isAuthenticated,
  getDetailsProcessoController.handle,
);

routes.post(
  "/anexo/delete",
  isAuthenticated,
  deleteAnexoProcessoController.handle,
);

routes.get("/find/allUsers", isAuthenticated, findAllUserController.handle);

/* CLIENTE */
routes.post("/create/cliente", isAuthenticated, createClienteController.handle);
routes.get("/find/clientes", isAuthenticated, getClientesController.handle);
routes.post("/delete/cliente", isAuthenticated, deleteClienteController.handle);
routes.post(
  "/find/clienteDetails",
  isAuthenticated,
  getDetailsClienteController.handle,
);
routes.post(
  "/find/processos/cliente",
  isAuthenticated,
  getProcessosClienteController.handle,
);
export default routes;
