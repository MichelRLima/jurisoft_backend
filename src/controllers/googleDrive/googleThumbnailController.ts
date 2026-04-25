import { Request, Response } from "express";
import googleThumbnail from "../../models/googleDrive/googleThumbnail";

class GoogleThumbnailsController {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.query; // Captura o ID da URL
      if (!fileId) {
        res.status(400).json({ error: "O ID do arquivo é obrigatório." });
        return;
      }

      console.log("fileId", fileId);
      const { buffer, contentType } = await googleThumbnail.execute(
        fileId as string,
      );

      // Configura os headers de resposta para imagem
      res.set("Content-Type", contentType as string);
      res.set("Cache-Control", "public, max-age=86400"); // Cache de 24h no navegador do usuário

      // Envia o buffer diretamente
      res.send(buffer);
    } catch (error) {
      console.error("Erro no Controller:", error);
      res.status(500).json({ error: "Erro ao carregar imagem." });
    }
  }
}

export default new GoogleThumbnailsController();
