import { Request, Response } from "express";

import findPrazos from "../../models/processos/findPrazos";

class FindAtualizacoesController {
  async handle(req: Request, res: Response) {
    const { processoId } = req.body;
    console.log("------", processoId);

    try {
      const response = await findPrazos.execute(processoId);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new FindAtualizacoesController();
