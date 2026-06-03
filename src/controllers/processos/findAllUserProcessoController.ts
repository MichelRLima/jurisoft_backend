import { Request, Response } from "express";

import findAllUserProcesso from "../../models/processos/findAllUserProcesso";

class FindAllUserProcessoController {
  async handle(req: Request, res: Response) {
    const userIdHeader = req.headers["x-user-id"];
    const usuarioId = Array.isArray(userIdHeader)
      ? userIdHeader[0]
      : userIdHeader;

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
