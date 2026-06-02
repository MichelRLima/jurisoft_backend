import logger from "../../utils/logger/logger";
import { deleteFile } from "../../services/storageService"; // Ajuste o caminho do seu serviço

class DeleteFotoPerfil {
  async execute(caminhoArquivo: string) {
    try {
      logger.debug(`Removendo foto de perfil...`);
      if (!caminhoArquivo) return;

      // Segurança: Limpa a string para garantir que temos apenas a "Key" (o caminho no bucket)
      const urlBase = process.env.R2_PUBLIC_URL || "";
      const key = caminhoArquivo.replace(`${urlBase}/`, "");

      console.log(`Deletando chave: ${key}`);

      // Chama a função do R2 passando 'true' para indicar que é do bucket público
      await deleteFile(key, true);

      logger.info(`Foto de perfil removida com sucesso do R2!`);
      return true;
    } catch (error) {
      console.error("Erro ao deletar arquivo no R2:", error);
      throw error;
    }
  }
}

export default new DeleteFotoPerfil();
