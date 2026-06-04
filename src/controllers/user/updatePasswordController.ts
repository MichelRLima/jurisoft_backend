import { Response } from "express";

import updatePassWord from "../../models/user/updatePassWord";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class UpdateUserController {
  async handle(req: AuthRequest, res: Response) {
    const { password, newPassword } = req.body;
    const usuarioId = req.user?.sub;

    try {
      console.log(usuarioId);
      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não identificado." });
        return;
      }
      const response = await updatePassWord.execute(
        usuarioId,
        password,
        newPassword,
      );
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new UpdateUserController();
