import { Request, Response } from "express";
import deleteProcesso from "../../models/processos/deleteProcesso";

class DeleteProcessoController {
  async handle(req: Request, res: Response) {
    const { processoId } = req.body;
    try {
      const response = await deleteProcesso.execute(processoId);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new DeleteProcessoController();
