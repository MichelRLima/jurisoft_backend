import { Request, Response } from "express";
import createProcesso from "../../models/processos/createProcesso";

class CreateProcessoController {
  async handle(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    const userIdHeader = req.headers["x-user-id"];
    const usuarioId = Array.isArray(userIdHeader)
      ? userIdHeader[0]
      : userIdHeader;

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
