import { Request, Response } from "express";
import findAnexos from "../../models/processos/findAnexos";

class FindAnexosController {
  async handle(req: Request, res: Response) {
    const { processoId } = req.body;
    try {
      const response = await findAnexos.execute(processoId);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new FindAnexosController();
