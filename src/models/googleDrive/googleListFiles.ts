import { google } from "googleapis";
import { oauth2Client } from "../../services/googleDriveService/googleDriveService";

class GoogleListFilesModel {
  async execute(folderId: string) {
    try {
      // Verifica e carrega o token se necessário
      if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
        throw new Error(
          "Não autorizado: Token do Google ausente. Faça login novamente.",
        );
      }
      const drive = google.drive({ version: "v3", auth: oauth2Client });
      const FOLDER_ID = "1N3mHm0GtfkV-gySkr6QlPKKmu1lNwq1-";

      const response = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, size)",
        pageSize: 20,
      });

      return { folder: FOLDER_ID, files: response.data.files };
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new GoogleListFilesModel();
