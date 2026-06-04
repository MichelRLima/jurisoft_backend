import { Response } from "express";
import updateUser from "../../models/admin/updateUser";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class UpdateUserController {
  async handle(req: AuthRequest, res: Response) {
    const { userId, login, email, telefone, nome, sobrenome, permissaoId } =
      req.body;
    const atorId = req.user?.sub;
    try {
      const response = await updateUser.execute(
        userId,
        login,
        email,
        telefone,
        nome,
        sobrenome,
        permissaoId,
        String(atorId),
      );
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new UpdateUserController();
