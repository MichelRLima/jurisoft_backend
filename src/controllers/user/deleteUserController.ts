import { Request, Response } from "express";

import deleteUser from "../../models/user/deleteUser";

class DeleteUserController {
  async handle(req: Request, res: Response) {
    const { userId } = req.body;
    try {
      const response = await deleteUser.execute(userId);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new DeleteUserController();
