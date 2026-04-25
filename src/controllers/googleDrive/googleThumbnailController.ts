import { Request, Response } from "express";
import googleThumbnail from "../../models/googleDrive/googleThumbnail";

class GoogleThumbnailsController {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      // Dica: Em produção, você provavelmente pegará o id via query: req.query.id
      const url =
        "https://drive.google.com/uc?id=1mDmBxilf8iTlYcp8MPzEhdllc9VhJDoo&export=download";
      const fileId = new URL(url).searchParams.get("id");

      if (!fileId) {
        res.status(400).json({ error: "O ID do arquivo é obrigatório." });
        return;
      }

      const { buffer, contentType } = await googleThumbnail.execute(fileId);

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
