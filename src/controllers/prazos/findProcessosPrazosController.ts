import { Response } from "express";
import findProcessosPrazos from "../../models/prazos/findProcessosPrazos";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class FindProcessosPrazosController {
  async handle(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.sub;
      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não identificado." });
      }
      const processos = await findProcessosPrazos.execute(String(usuarioId));
      res.status(200).json(processos);
    } catch (error) {
      console.error("Erro ao buscar prazos do cliente", error);
      throw error;
    }
  }
}

export default new FindProcessosPrazosController();
