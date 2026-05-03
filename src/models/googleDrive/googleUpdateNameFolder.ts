import { google } from "googleapis";
import { oauth2Client } from "../../services/googleDriveService/googleDriveService";

class GoogleUpdateNameFolder {
  async execute(folderId: string, newName: string) {
    try {
      // Verificação de autenticação (seguindo sua lógica)
      if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
        throw new Error(
          "Não autorizado: Token do Google ausente. Faça login novamente.",
        );
      }

      if (!folderId || !newName) {
        throw new Error("ID da pasta ou novo nome ausentes.");
      }

      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // O Google Drive trata pastas como arquivos (files)
      // O método update altera as propriedades do arquivo correspondente ao ID
      const response = await drive.files.update({
        fileId: folderId,
        requestBody: {
          name: newName,
        },
        fields: "id, name", // Retorna o ID e o novo nome para confirmação
      });

      return response.data;
    } catch (error: any) {
      console.error("Erro no Model ao renomear pasta:", error);

      // Tratamento específico para pastas não encontradas
      if (error.code === 404) {
        throw new Error("Pasta não encontrada no Google Drive.");
      }

      throw error;
    }
  }
}

export default new GoogleUpdateNameFolder();
