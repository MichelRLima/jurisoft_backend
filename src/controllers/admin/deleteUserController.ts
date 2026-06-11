import { Request, Response } from "express";

import deleteUser from "../../models/admin/deleteUser";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class DeleteUserController {
  async handle(req: AuthRequest, res: Response) {
    const { userId, status } = req.body;
    const atorId = req.user?.sub;
    try {
      const response = await deleteUser.execute(
        userId,
        Boolean(status),
        String(atorId),
      );
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new DeleteUserController();
