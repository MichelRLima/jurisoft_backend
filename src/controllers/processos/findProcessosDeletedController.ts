import { Response } from "express";
import findProcessosDeleted from "../../models/processos/findProcessosDeleted";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import logger from "../../utils/logger/logger";

class FindProcessosDeletedController {
  async handle(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.sub;

      if (!usuarioId) {
        throw new Error("Usuário não identificado.");
      }

      const response = await findProcessosDeleted.execute(usuarioId);

      res.status(200).json(response);
    } catch (error) {
      logger.error("Erro no FindProcessosDeletedController:", error);
      throw error;
    }
  }
}

export default new FindProcessosDeletedController();
