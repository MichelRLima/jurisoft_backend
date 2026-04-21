import { Request, Response } from "express";
import findAllUser from "../../models/user/findAllUser";

class FindAllUserController {
  async handle(req: Request, res: Response) {
    const usuarioId = req.headers["x-user-id"] as string;
    try {
      const response = await findAllUser.execute(usuarioId);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new FindAllUserController();
