import { Request, Response } from "express";

import editProcesso from "../../models/processos/editProcesso";

class EditProcessoController {
  async handle(req: Request, res: Response) {
    const { processo } = req.body;
    try {
      const response = await editProcesso.execute(processo);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new EditProcessoController();
