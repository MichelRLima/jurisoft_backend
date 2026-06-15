import { Request, Response } from "express";
import findArmazenamento from "../../models/admin/findArmazenamento";

class FindArmazenamentoController {
  async handle(req: Request, res: Response) {
    try {
      const result = await findArmazenamento.execute();
      res.status(200).json(result);
    } catch (error) {
      console.error("Error ao buscar armazenamento:", error);
      throw error;
    }
  }
}

export default new FindArmazenamentoController();
