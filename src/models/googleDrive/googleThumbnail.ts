import axios from "axios";
import { google } from "googleapis";
import { oauth2Client } from "../../services/googleDriveService/googleDriveService";
import NodeCache from "node-cache";

// stdTTL: 86400 significa que a imagem fica no cache por 24 horas
const thumbCache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

class GoogleThumbnailsModel {
  async execute(fileId: string) {
    try {
      // 1. Tentar buscar do Cache primeiro
      const cachedData = thumbCache.get(fileId) as
        | { buffer: Buffer; contentType: string }
        | undefined;

      if (cachedData) {
        console.log(`[Cache] Servindo miniatura do arquivo: ${fileId}`);
        return cachedData;
      }

      // 2. Se não estiver no cache, busca no Google
      console.log(`[Google API] Buscando miniatura do arquivo: ${fileId}`);
      const drive = google.drive({ version: "v3", auth: oauth2Client });
      const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: "thumbnailLink",
      });

      const thumbnailLink = fileMetadata.data.thumbnailLink;
      if (!thumbnailLink) throw new Error("Miniatura não disponível.");

      const highResThumb = thumbnailLink.replace(/=s\d+$/, "=s500");
      const response = await axios.get(highResThumb, {
        responseType: "arraybuffer",
      });

      const contentType = String(
        response.headers["content-type"] || "image/jpeg",
      );
      const result = {
        buffer: Buffer.from(response.data),
        contentType: contentType,
      };

      // 3. Salvar no Cache para os próximos usuários
      thumbCache.set(fileId, result);

      return result;
    } catch (error) {
      console.error("Erro no Model:", error);
      throw error;
    }
  }
}

export default new GoogleThumbnailsModel();
