import { Response } from "express";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import findAllNotificacoes from "../../models/notificacoes/findAllNotificacoes";

class FindAllNotificacoesController {
  async handle(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.sub;
      const notificacoes = await findAllNotificacoes.execute(String(usuarioId));
      res.status(200).json(notificacoes);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new FindAllNotificacoesController();
