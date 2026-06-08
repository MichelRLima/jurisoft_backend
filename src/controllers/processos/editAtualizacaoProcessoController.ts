import { Response } from "express";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import createAtualizacaoProcesso from "../../models/processos/createAtualizacaoProcesso";
import editAtualizacaoProcesso from "../../models/processos/editAtualizacaoProcesso";

class EditAtualizacaoProcessoController {
  async handle(req: AuthRequest, res: Response) {
    const { conteudo, id } = req.body;
    const usuarioId = req.user?.sub;
    try {
      const response = await editAtualizacaoProcesso.execute(
        String(usuarioId),
        id,
        conteudo,
      );

      res.status(200).json(response);
    } catch {}
  }
}

export default new EditAtualizacaoProcessoController();
