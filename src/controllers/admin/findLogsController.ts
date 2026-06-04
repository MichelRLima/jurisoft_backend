import { Request, Response } from "express";

import findLogs from "../../models/admin/findLogs";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class FindLogsController {
  async handle(req: AuthRequest, res: Response) {
    const usuarioId = req.user?.sub;
    try {
      const response = await findLogs.execute(String(usuarioId));
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new FindLogsController();
