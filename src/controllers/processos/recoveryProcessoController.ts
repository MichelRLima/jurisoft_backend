import { Response } from "express";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import recoveryProcesso from "../../models/processos/recoveryProcesso";

class RecoveryProcessoController {
  async handle(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.sub;
      if (!usuarioId) {
        throw new Error("Usuário não identificado.");
      }
      const { processoId } = req.body;
      const processo = await recoveryProcesso.execute(processoId, usuarioId);
      res.status(201).json(processo);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new RecoveryProcessoController();
