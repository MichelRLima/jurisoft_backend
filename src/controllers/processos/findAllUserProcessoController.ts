import { Request, Response } from "express";

import findAllUserProcesso from "../../models/processos/findAllUserProcesso";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class FindAllUserProcessoController {
  async handle(req: AuthRequest, res: Response) {
    const usuarioId = req.user?.sub;

    if (!usuarioId) {
      res.status(401).json({ error: "Usuário não identificado." });
      return;
    }
    try {
      const response = await findAllUserProcesso.execute(usuarioId);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new FindAllUserProcessoController();
