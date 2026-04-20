import { Request, Response } from "express";
import googleListFiles from "../../models/googleDrive/googleListFiles";

class GoogleListFilesController {
  async handle(req: Request, res: Response): Promise<void> {
    const { fileId } = req.params; // Captura o ID da URL

    try {
      const response = await googleListFiles.execute(fileId);

      // 2. Você envia esse objeto usando status 200
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        error: "Erro ao excluir arquivo",
        message: error.message,
      });
    }
  }
}

export default new GoogleListFilesController();
