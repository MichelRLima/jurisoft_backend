import { Response } from "express";
import createProcesso from "../../models/processos/createProcesso";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import { log } from "console";

class CreateProcessoController {
  async handle(req: AuthRequest, res: Response) {
    const files = req.files as Express.Multer.File[];
    const usuarioId = req.user?.sub;

    if (!usuarioId) {
      res.status(401).json({ error: "Usuário não identificado." });
      return;
    }
    let processo = req.body.processo;
    try {
      processo = JSON.parse(processo);

      const response = await createProcesso.execute({
        processo,
        files,
        usuarioId,
      });
      res.status(201).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new CreateProcessoController();
