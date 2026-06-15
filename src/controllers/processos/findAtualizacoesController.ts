import { Request, Response } from "express";

import findAtualizacoes from "../../models/processos/findAtualizacoes";

class FindAtualizacoesController {
  async handle(req: Request, res: Response) {
    const { processoId } = req.body;
    try {
      const response = await findAtualizacoes.execute(processoId);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new FindAtualizacoesController();
