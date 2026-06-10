import { Response } from "express";
import deleteAnexoProcesso from "../../models/processos/deleteAnexoProcesso";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class DeleteAnexoProcessoController {
  async handle(req: AuthRequest, res: Response) {
    const { anexoId } = req.body;
    const usuarioId = req.user?.sub;

    if (!usuarioId) {
      res.status(401).json({ error: "Usuário não identificado." });
      return;
    }

    try {
      const response = await deleteAnexoProcesso.execute(anexoId, usuarioId);

      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new DeleteAnexoProcessoController();
