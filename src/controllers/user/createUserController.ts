import { Request, Response } from "express";
import { UserRequest } from "../../middlewares/auth/UserRequest";
import { log } from "node:console";
const { createUser } = require("../../models/user/createUser");

module.exports = {
  async handle(req: Request, res: Response) {
    const { login, senha, email, permissaoId } = req.body;
    try {
      const response = await createUser.execute(
        login,
        senha,
        email,
        permissaoId,
      );
      console.log("usuário criado");
      return res.status(201).json(response);
    } catch (error: any) {
      const statusCode = error.status || 500;
      const message = error.message || "Erro interno no servidor.";
      return res.status(statusCode).json({ error: message });
    } finally {
    }
  },
};
