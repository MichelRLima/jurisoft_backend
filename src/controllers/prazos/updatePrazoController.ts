import { Response } from "express";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import updatePrazo from "../../models/prazos/updatePrazo";

class UpdatePrazoController {
  async handle(req: AuthRequest, res: Response) {
    const usuarioId = req.user?.sub;

    if (!usuarioId) {
      res.status(401).json({ error: "Usuário não identificado." });
      return;
    }

    try {
      const { id, titulo, descricao, dataPrazo, tipoPrazo } = req.body;

      const response = await updatePrazo.execute(
        id,
        titulo,
        descricao,
        dataPrazo,
        tipoPrazo,
        usuarioId,
      );

      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao atualizar prazo");
    } finally {
    }
  }
}
export default new UpdatePrazoController();
