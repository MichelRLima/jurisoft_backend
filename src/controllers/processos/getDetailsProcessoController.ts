import { Response } from "express";
import getDetailsProcesso from "../../models/processos/getDetailsProcesso";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class GetDetailsProcessoController {
  async handle(req: AuthRequest, res: Response) {
    const { processoId } = req.body;
    const usuarioId = req.user?.sub;
    try {
      const response = await getDetailsProcesso.execute(
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

export default new GetDetailsProcessoController();
