import { google } from "googleapis";
import { oauth2Client } from "../../services/googleDriveService/googleDriveService";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "token.json");
class GoogleCreateFolderModel {
  async execute(folderName: string) {
    try {
      // Garante que o token seja carregado do arquivo caso o servidor reinicie
      if (!oauth2Client.credentials.access_token && fs.existsSync(TOKEN_PATH)) {
        const savedToken = fs.readFileSync(TOKEN_PATH, "utf-8");
        oauth2Client.setCredentials(JSON.parse(savedToken));
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
