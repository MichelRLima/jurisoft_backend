import { oauth2Client } from "../../services/googleDriveService/googleDriveService";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "token.json");

class GoogleCallbackModel {
  async execute(code: string): Promise<void> {
    try {
      // 1. Troca o código enviado pelo Google pelos tokens reais
      const { tokens } = await oauth2Client.getToken(code);

      // 2. Aplica as credenciais no cliente atual
      oauth2Client.setCredentials(tokens);

      // 3. Salva fisicamente para persistência (não deslogar no restart)
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

      console.log("Tokens gerados e salvos com sucesso em token.json");
    } catch (error) {
      console.error("Erro no Model ao processar callback:", error);
      throw new Error("Falha ao processar autenticação do Google");
    }
  }
}

export default new GoogleCallbackModel();
