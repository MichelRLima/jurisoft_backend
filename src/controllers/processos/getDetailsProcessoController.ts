import { Request, Response } from "express";
import getDetailsProcesso from "../../models/processos/getDetailsProcesso";

class GetDetailsProcessoController {
  async handle(req: Request, res: Response) {
    const { processoId } = req.body;
    try {
      const response = await getDetailsProcesso.execute(processoId);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new GetDetailsProcessoController();
