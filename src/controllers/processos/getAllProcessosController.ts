import { Request, Response } from "express";
import getAllProcessos from "../../models/processos/getAllProcessos";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class GetAllProcessosController {
  async handle(req: AuthRequest, res: Response) {
    const usuarioId = req.user?.sub;
    try {
      const response = await getAllProcessos.execute(String(usuarioId));
      res.status(200).json(response);
    } catch {}
  }
}

export default new GetAllProcessosController();
