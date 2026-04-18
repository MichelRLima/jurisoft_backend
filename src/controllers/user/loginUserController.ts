import { Request, Response } from "express";
import { UserRequest } from "../../middlewares/auth/UserRequest";
import loginUser from "../../models/user/loginUser";
import checkPerfil from "../../models/user/perfil/checkPerfil";
import checkUsuario from "../../models/user/checkUsuario";

module.exports = {
  async handle(req: Request, res: Response) {
    const { email, senha } = req.body;
    try {
      const loginData = await loginUser.execute(email, senha);

      const { perfil, perfilAlreadyExists } = (await checkPerfil.execute(
        loginData.refreshToken.usuarioId,
      )) || { perfil: null, perfilAlreadyExists: false };

      const usuario = await checkUsuario.execute(
        loginData.refreshToken.usuarioId,
      );

      // Criamos um novo objeto com tudo dentro
      const fullResponse = {
        ...loginData,
        perfil,
        usuario,
        perfilAlreadyExists,
      };

      return res.status(201).json(fullResponse);
    } catch (error: any) {
      const statusCode = error.status || 500;
      const message = error.message || "Erro interno no servidor.";
      return res.status(statusCode).json({ error: message });
    } finally {
    }
  },
};
