import { Response } from "express";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import createPrazo from "../../models/prazos/createPrazo";

class CreatePrazoController {
  async handle(req: AuthRequest, res: Response) {
    const usuarioId = req.user?.sub;

    if (!usuarioId) {
      res.status(401).json({ error: "Usuário não identificado." });
      return;
    }

    const { titulo, descricao, dataPrazo, processoId, tipoPrazo } = req.body;
    try {
      const prazo = await createPrazo.execute(
        titulo,
        descricao,
        dataPrazo,
        processoId,
        tipoPrazo,
        String(usuarioId),
      );
      res.status(201).json(prazo);
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao criar prazo");
    } finally {
    }
  }
}

export default new CreatePrazoController();
