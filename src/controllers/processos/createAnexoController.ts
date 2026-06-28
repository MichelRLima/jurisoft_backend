import { Response } from "express";
import createAnexo from "../../models/processos/createAnexo";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class CreateAnexoController {
  async handle(req: AuthRequest, res: Response) {
    const files = req.files as Express.Multer.File[];
    let processoId = req.body.processoId;
    const usuarioId = req.user?.sub;
    if (!usuarioId) {
      throw new Error("Usuário não identificado.");
    }
    try {
      processoId = JSON.parse(processoId);
      const response = await createAnexo.execute(processoId, files, usuarioId);
      res.status(201).json(response);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new CreateAnexoController();
