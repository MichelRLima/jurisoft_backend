import { Response } from "express";
import findAllPrazos from "../../models/prazos/findAllPrazos";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class FindAllPrazosController {
  async handle(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.sub;
      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não identificado." });
      }
      const prazos = await findAllPrazos.execute(String(usuarioId));
      res.status(200).json(prazos);
    } catch (error) {
      console.error("Erro ao buscar prazos do cliente", error);
      throw error;
    } finally {
    }
  }
}

export default new FindAllPrazosController();
