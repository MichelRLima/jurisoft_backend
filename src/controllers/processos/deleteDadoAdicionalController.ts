import { Response } from "express";
import deleteDadoAdicional from "../../models/processos/deleteDadoAdicional";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class DeleteDadoAdicionalController {
  async handle(req: AuthRequest, res: Response) {
    const usuarioId = req.user?.sub;
    if (!usuarioId) {
      throw new Error("Usuário não autenticado");
    }
    const { idDadoAdicional } = req.body;

    try {
      const response = await deleteDadoAdicional.execute(
        idDadoAdicional,
        usuarioId,
      );

      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new DeleteDadoAdicionalController();
