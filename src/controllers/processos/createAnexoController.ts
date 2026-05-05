import { Request, Response } from "express";
import createAnexo from "../../models/processos/createAnexo";

class CreateAnexoController {
  async handle(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    let processoId = req.body.processoId;
    try {
      processoId = JSON.parse(processoId);
      const response = await createAnexo.execute(processoId, files);
      res.status(201).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new CreateAnexoController();
