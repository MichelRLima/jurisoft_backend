import { Request, Response } from "express";
import getAllProcessos from "../../models/processos/getAllProcessos";

class GetAllProcessosController {
  async handle(req: Request, res: Response) {
    try {
      const response = await getAllProcessos.execute();
      res.status(200).json(response);
    } catch {}
  }
}

export default new GetAllProcessosController();
