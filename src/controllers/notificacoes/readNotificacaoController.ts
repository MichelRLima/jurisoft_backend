import { Response } from "express";
import { AuthRequest } from "../../middlewares/isAuthenticated";

import readNotificacao from "../../models/notificacoes/readNotificacao";

class FindNotificacoesController {
  async handle(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.sub;
      const notificacoes = await readNotificacao.execute(String(usuarioId));
      res.status(200).json(notificacoes);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new FindNotificacoesController();
