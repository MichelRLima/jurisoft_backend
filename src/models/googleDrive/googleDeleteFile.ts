import { google } from "googleapis";
import { oauth2Client } from "../../services/googleDriveService/googleDriveService";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "token.json");

class GoogleDeleteFileModel {
  async execute(fileId: string): Promise<object> {
    try {
      // Verifica e carrega o token se necessário
      if (!oauth2Client.credentials.access_token && fs.existsSync(TOKEN_PATH)) {
        const savedToken = fs.readFileSync(TOKEN_PATH, "utf-8");
        oauth2Client.setCredentials(JSON.parse(savedToken));
      }

      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // Executa a exclusão permanente
      await drive.files.delete({
        fileId: fileId,
      });
      return {
        menssege: "Arquivo deletado com sucesso",
      };
    } catch (error: any) {
      console.error("Erro no Model ao excluir arquivo:", error);

      // Se o erro for 404, o arquivo já não existe
      if (error.code === 404) {
        throw new Error("Arquivo não encontrado no Google Drive.");
      }

      throw error;
    }
  }
}

export default new GoogleDeleteFileModel();
