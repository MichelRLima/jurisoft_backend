import { Request, Response } from "express";
import googleDeleteFile from "../../models/googleDrive/googleDeleteFile";

class GoogleDeleteFileController {
  async handle(req: Request, res: Response): Promise<void> {
    const { fileId } = req.params; // Captura o ID da URL

    if (!fileId) {
      res.status(400).json({ error: "O ID do arquivo é obrigatório." });
      return;
    }

    try {
      const response = await googleDeleteFile.execute(fileId);

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

export default new GoogleDeleteFileController();
