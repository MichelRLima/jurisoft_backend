import { google } from "googleapis";
import { oauth2Client } from "../../services/googleDriveService/googleDriveService";

class GooglePermissionModel {
  /**
   * Adiciona um usuário específico a uma pasta ou arquivo
   * @param fileOrFolderId ID da pasta ou do arquivo no Drive
   * @param email Email da pessoa (deve ser uma conta Google para melhor experiência)
   * @param role 'reader' (visualizador) ou 'writer' (editor)
   */
  async addPermission(
    fileOrFolderId: string,
    email: string,
    role: "reader" | "writer" = "reader",
  ) {
    try {
      if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
        throw new Error("Não autorizado: Token do Google ausente.");
      }

      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const response = await drive.permissions.create({
        fileId: fileOrFolderId,
        sendNotificationEmail: true, // Envia um e-mail automático do Google avisando a pessoa
        requestBody: {
          type: "user",
          role: role,
          emailAddress: email,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao adicionar permissão:", error);
      throw error;
    }
  }

  /**
   * Remove o acesso de uma pessoa específica
   */
  async removePermission(fileOrFolderId: string, permissionId: string) {
    try {
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      await drive.permissions.delete({
        fileId: fileOrFolderId,
        permissionId: permissionId, // Note que para remover, você precisa do ID da permissão, não do e-mail direto
      });

      return { success: true };
    } catch (error) {
      console.error("Erro ao remover permissão:", error);
      throw error;
    }
  }
}

export default new GooglePermissionModel();
