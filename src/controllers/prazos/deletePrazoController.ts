import { Response } from "express";
import deletePrazo from "../../models/prazos/deletePrazo";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class DeletePrazoController {
  async handle(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.sub;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não identificado." });
        return;
      }
      const { id } = req.body;
      const result = await deletePrazo.execute(id, String(usuarioId));
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new DeletePrazoController();
