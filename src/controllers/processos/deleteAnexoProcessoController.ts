import { Request, Response } from "express";
import deleteAnexoProcesso from "../../models/processos/deleteAnexoProcesso";

class DeleteAnexoProcessoController {
  async handle(req: Request, res: Response) {
    const { anexoId } = req.body;
    try {
      const response = await deleteAnexoProcesso.execute(anexoId);

      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new DeleteAnexoProcessoController();
