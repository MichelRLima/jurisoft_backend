import { Router, Request, Response } from "express";

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
import editClienteController from "./controllers/clientes/editClienteController";
import findPermissaoController from "./controllers/user/findPermissaoController";
import deleteUserController from "./controllers/admin/deleteUserController";
import findAllUserProcessoController from "./controllers/processos/findAllUserProcessoController";
import createUserController from "./controllers/admin/createUserController";
import { ensurePermission } from "./middlewares/hasPermission";
import findLogsController from "./controllers/admin/findLogsController";
import updateUserAdminController from "./controllers/admin/updateUserAdminController";
import refreshTokenUserController from "./controllers/user/refreshTokenUserController";
import createAtualizacaoProcessoController from "./controllers/processos/createAtualizacaoProcessoController";
import editAtualiazacaoProcessoController from "./controllers/processos/editAtualizacaoProcessoController";
import findNotificacoesController from "./controllers/notificacoes/findNotificacoesController";
import readNotificacaoController from "./controllers/notificacoes/readNotificacaoController";
import findAllNotificacoesController from "./controllers/notificacoes/findAllNotificacoesController";
import createPrazoController from "./controllers/prazos/createPrazoController";
import findProcessosPrazosController from "./controllers/prazos/findProcessosPrazosController";
import findAllPrazosController from "./controllers/prazos/findAllPrazosController";
import deletePrazoController from "./controllers/prazos/deletePrazoController";
import updatePrazoController from "./controllers/prazos/updatePrazoController";

const upload = multer({ storage: multer.memoryStorage() });
const routes = Router();

// Rota simples de teste
routes.get("/ping", (req: Request, res: Response) => {
  res.json({ message: "pong 🏓" });
});

// Rota para o usuário digitar o email e receber o código de 4 dígitos
routes.post("/auth/forgotPassword", ForgotPasswordController.handle);
routes.post("/refreshToken", refreshTokenUserController.handle);
// Rota onde o usuário envia o email, o código recebido e a senha nova
routes.post("/auth/forgotResetPassword", forgotResetPasswordController.handle);

routes.post("/login", loginUserController.handle);

routes.put("/update/perfil", isAuthenticated, updatePerfilController.handle);
routes.post("/update/user", isAuthenticated, updateUserController.handle);
routes.post(
  "/update/password",
  isAuthenticated,
  updatePasswordController.handle,
);

routes.post(
  "/create/processo",
  isAuthenticated,
  upload.array("file"),
  createProcessoController.handle,
);

routes.post(
  "/create/atualizacaoProcesso",
  isAuthenticated,
  createAtualizacaoProcessoController.handle,
);

routes.post(
  "/edit/atualizacaoProcesso",
  isAuthenticated,
  editAtualiazacaoProcessoController.handle,
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
  ensurePermission(["DEV", "ADV"]),
  deleteProcessoController.handle,
);

routes.post(
  "/find/logs",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  findLogsController.handle,
);

routes.post(
  "/edit/processo",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  editProcessoController.handle,
);

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

routes.get(
  "/find/allUsers",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  findAllUserController.handle,
);
routes.post(
  "/createUser",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  createUserController.handle,
);
routes.post(
  "/delete/user",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  deleteUserController.handle,
);

routes.post(
  "/update/admin/user",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  updateUserAdminController.handle,
);

routes.get(
  "/find/processo/allUsers",
  isAuthenticated,
  findAllUserProcessoController.handle,
);

routes.get("/find/permissoes", isAuthenticated, findPermissaoController.handle);

/* NOTIFICAÇÕES */
routes.post(
  "/find/notificacoes",
  isAuthenticated,
  findNotificacoesController.handle,
);
routes.post(
  "/find/allNotificacoes",
  isAuthenticated,
  findAllNotificacoesController.handle,
);

routes.post(
  "/update/notificacao/read",
  isAuthenticated,
  readNotificacaoController.handle,
);

/* PRAZOS */

routes.post("/create/prazo", isAuthenticated, createPrazoController.handle);
routes.post(
  "/find/processos/prazos",
  isAuthenticated,
  findProcessosPrazosController.handle,
);

routes.post("/find/prazos", isAuthenticated, findAllPrazosController.handle);
routes.post("/delete/prazo", isAuthenticated, deletePrazoController.handle);
routes.post("/update/prazo", isAuthenticated, updatePrazoController.handle);

/* CLIENTE */
routes.post(
  "/create/cliente",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  createClienteController.handle,
);
routes.post(
  "/edit/cliente",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  editClienteController.handle,
);
routes.get("/find/clientes", isAuthenticated, getClientesController.handle);
routes.post(
  "/delete/cliente",
  isAuthenticated,
  ensurePermission(["DEV", "ADV"]),
  deleteClienteController.handle,
);
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
