import { Response } from "express";

import editProcesso from "../../models/processos/editProcesso";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class EditProcessoController {
  async handle(req: AuthRequest, res: Response) {
    const { processo } = req.body;
    const usuarioId = req.user?.sub;
    try {
      const response = await editProcesso.execute(processo, String(usuarioId));
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new EditProcessoController();
