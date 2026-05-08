import { Request, Response } from "express";
import updateUser from "../../../models/user/perfil/updateUser";

class UpdateUserController {
  async handle(req: Request, res: Response) {
    const { userId, foto, nome, sobrenome, email, telefone } = req.body;
    try {
      const response = await updateUser.execute(
        userId,
        foto,
        nome,
        sobrenome,
        email,
        telefone,
      );
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new UpdateUserController();
