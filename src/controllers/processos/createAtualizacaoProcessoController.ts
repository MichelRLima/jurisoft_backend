import { Response } from "express";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import createAtualizacaoProcesso from "../../models/processos/createAtualizacaoProcesso";

class CreateAtualizacaoProcessoController {
  async handle(req: AuthRequest, res: Response) {
    const { processoId, conteudo, statusProcesso } = req.body;
    const usuarioId = req.user?.sub;
    try {
      const response = await createAtualizacaoProcesso.execute(
        String(usuarioId),
        processoId,
        conteudo,
        statusProcesso,
      );
      res.status(200).json(response);
    } catch {}
  }
}

export default new CreateAtualizacaoProcessoController();
