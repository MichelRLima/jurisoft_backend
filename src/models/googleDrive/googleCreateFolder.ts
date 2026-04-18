import { google } from "googleapis";
import { oauth2Client } from "../../services/googleDriveService/googleDriveService";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "token.json");
class GoogleCreateFolderModel {
  async execute(folderName: string) {
    try {
      // Garante que o token seja carregado do arquivo caso o servidor reinicie
      // Verifica se o token foi carregado corretamente na memória
      if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
        throw new Error(
          "Não autorizado: Token do Google ausente. Faça login novamente.",
        );
      }
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const fileMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: ["root"],
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id, name",
      });

      return response.data;
    } catch (error) {
      console.error("Erro no Model ao criar pasta:", error);
      throw error;
    }
  }
}

export default new GoogleCreateFolderModel();
