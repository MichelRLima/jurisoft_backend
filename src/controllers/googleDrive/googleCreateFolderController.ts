import { Request, Response } from "express";
import googleCreateFolder from "../../models/googleDrive/googleCreateFolder";

class GoogleCreateFolderController {
  async handle(req: Request, res: Response): Promise<void> {
    const { folderName } = req.body;

    if (!folderName) {
      res
        .status(400)
        .json({
          error:
            "Nome da pasta é obrigatório no corpo da requisição (folderName)",
        });
      return;
    }

    try {
      const folder = await googleCreateFolder.execute(folderName);

      res.status(201).json({
        message: "Pasta criada com sucesso!",
        folder,
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar pasta no Drive" });
    }
  }
}

export default new GoogleCreateFolderController();
