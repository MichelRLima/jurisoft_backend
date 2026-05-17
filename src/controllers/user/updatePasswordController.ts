import { Request, Response } from "express";

import updatePassWord from "../../models/user/updatePassWord";

class UpdateUserController {
  async handle(req: Request, res: Response) {
    const { password, newPassword } = req.body;
    const userIdHeader = req.headers["x-user-id"];
    const usuarioId = Array.isArray(userIdHeader)
      ? userIdHeader[0]
      : userIdHeader;

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
