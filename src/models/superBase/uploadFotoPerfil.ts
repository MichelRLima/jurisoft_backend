import logger from "../../utils/logger/logger";
import { uploadFile } from "../../services/storageService"; // Ajuste o caminho para onde está o seu serviço do S3/R2

class UploadFotoPerfil {
  async execute(foto: string) {
    try {
      logger.debug(`Iniciando upload de foto de perfil para o R2...`);

      const matches = foto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Formato Base64 inválido.");
      }

      const tipoConteudo = matches[1]; // Ex: image/jpeg
      const base64Limpo = matches[2]; // Apenas o código da imagem

      // Converter a string Base64 em um Buffer (O que o SDK da AWS entende)
      const buffer = Buffer.from(base64Limpo, "base64");
      const extensao = tipoConteudo.split("/")[1];
      const fileName = `perfil_${Date.now()}.${extensao}`;
      const escritorio = process.env.ESCRITORIO_NAME;
      // Monta o caminho exato que será salvo no banco de dados
      const caminhoNoStorage = `escritorios/${escritorio}/perfis/${fileName}`;

      // Envia para o R2 passando 'true' no último parâmetro para usar o bucket jurisoft-perfis
      await uploadFile(buffer, caminhoNoStorage, tipoConteudo, true);

      logger.info(`Foto de perfil salva com sucesso no R2!`);

      return caminhoNoStorage;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new UploadFotoPerfil();
