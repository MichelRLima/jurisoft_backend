import { google } from "googleapis";
import { oauth2Client } from "../../services/googleDriveService/googleDriveService";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
const PARENT_FOLDER_ID = "1N3mHm0GtfkV-gySkr6QlPKKmu1lNwq1-";
const TOKEN_PATH = path.join(process.cwd(), "token.json");

class GoogleUploadFileModel {
  async execute(file: any) {
    try {
      if (!oauth2Client.credentials.access_token && fs.existsSync(TOKEN_PATH)) {
        const savedToken = fs.readFileSync(TOKEN_PATH, "utf-8");
        oauth2Client.setCredentials(JSON.parse(savedToken));
      }

      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      // 1. Criar o arquivo
      const response = await drive.files.create({
        requestBody: {
          name: file.originalname,
          parents: [PARENT_FOLDER_ID],
        },
        media: {
          mimeType: file.mimetype,
          body: bufferStream,
        },
        fields: "id, name, webViewLink",
      });

      const fileId = response.data.id;

      // 2. ADICIONAR PERMISSÃO PÚBLICA
      // Isso equivale a clicar em "Qualquer pessoa com o link" no Drive
      await drive.permissions.create({
        fileId: fileId as string,
        requestBody: {
          role: "reader", // permissão de visualização
          type: "anyone", // para qualquer pessoa
        },
      });

      // 3. Buscar o link de visualização atualizado (opcional, mas recomendado)
      const updatedFile = await drive.files.get({
        fileId: fileId as string,
        fields: "id, name, webViewLink, webContentLink",
      });

      return updatedFile.data;
    } catch (error) {
      console.error("Erro no Model ao fazer upload público:", error);
      throw error;
    }
  }
}

export default new GoogleUploadFileModel();
