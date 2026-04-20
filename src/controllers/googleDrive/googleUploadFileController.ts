import { Request, Response } from "express";
import googleUploadFile from "../../models/googleDrive/googleUploadFile";

class GoogleUploadFileController {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Nenhum arquivo enviado!" });
        return;
      }

      console.log(req.file);

      /*       const result = await googleUploadFile.execute(req.file); */

      /*   res.status(201).json({
        message: "Arquivo enviado com sucesso!",
        file: result,
      }); */
    } catch (error) {
      res.status(500).json({ error: "Erro ao fazer upload para o Drive" });
    }
  }
}

export default new GoogleUploadFileController();
