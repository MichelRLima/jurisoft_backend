import { Response } from "express";
import updateStatusPrazo from "../../models/prazos/updateStatusPrazo";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class UpdateStatusPrazoController {
  async handle(req: AuthRequest, res: Response) {
    try {
      const { id, status } = req.body;
      const usuarioId = req.user?.sub;
      const prazo = await updateStatusPrazo.execute(
        id,
        status,
        String(usuarioId),
      );
      res.status(200).json(prazo);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new UpdateStatusPrazoController();
