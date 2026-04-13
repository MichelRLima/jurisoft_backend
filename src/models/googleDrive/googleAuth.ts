import {
  oauth2Client,
  DRIVE_SCOPES,
} from "../../services/googleDriveService/googleDriveService";

class GoogleAuthModel {
  async execute(): Promise<string> {
    try {
      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: DRIVE_SCOPES,
        prompt: "consent",
      });
      return url;
    } catch (error) {
      console.error("Erro no Model ao gerar URL:", error);
      throw new Error("Falha ao gerar URL de autenticação.");
    }
  }
}

export default new GoogleAuthModel();
