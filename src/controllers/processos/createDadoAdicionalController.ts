import { Response } from "express";
import { AuthRequest } from "../../middlewares/isAuthenticated";
import createDadoAdicional from "../../models/processos/createDadoAdicional";

class CreateDadoAdicionalController {
  async handle(req: AuthRequest, res: Response) {
    const { dadoAdicional } = req.body;
    const usuarioId = req.user?.sub;
    if (!usuarioId) {
      throw new Error("Usuário não identificado.");
    }

    try {
      const response = await createDadoAdicional.execute(
        dadoAdicional,
        usuarioId,
      );

      res.status(201).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new CreateDadoAdicionalController();
