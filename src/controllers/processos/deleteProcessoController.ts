import { Response } from "express";
import deleteProcesso from "../../models/processos/deleteProcesso";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class DeleteProcessoController {
  async handle(req: AuthRequest, res: Response) {
    const { processoId } = req.body;
    const usuarioId = req.user?.sub;
    try {
      const response = await deleteProcesso.execute(
        processoId,
        String(usuarioId),
      );
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new DeleteProcessoController();
