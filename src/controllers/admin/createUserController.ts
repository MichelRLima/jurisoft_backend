import { Response } from "express";
import createUser from "../../models/admin/createUser";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class CreateUserController {
  async handle(req: AuthRequest, res: Response) {
    const { login, senha, email, permissaoId } = req.body;
    const atorId = req.user?.sub;
    try {
      const response = await createUser.execute(
        login,
        senha,
        email,
        permissaoId,
        String(atorId),
      );
      console.log("usuário criado");
      res.status(201).json(response);
    } catch (error: any) {
      const statusCode = error.status || 500;
      const message = error.message || "Erro interno no servidor.";
      res.status(statusCode).json({ error: message });
    } finally {
    }
  }
}

export default new CreateUserController();
