import { supabase } from "../../services/supabaseService/supabaseConfig";
import logger from "../../utils/logger/logger";

class UploadFotoPerfil {
  async execute(foto: string) {
    try {
      logger.debug(`Iniciando upload de foto de perfil...`);
      const matches = foto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Formato Base64 inválido.");
      }
      const tipoConteudo = matches[1]; // Ex: image/jpeg
      const base64Limpo = matches[2]; // Apenas o código da imagem

      // 2. Converter a string Base64 em um Buffer (O que o Supabase entende)
      const buffer = Buffer.from(base64Limpo, "base64");
      const extensao = tipoConteudo.split("/")[1];
      const fileName = `perfil_${Date.now()}.${extensao}`;
      const { data, error } = await supabase.storage
        .from("fotos_perfil")
        .upload(fileName, buffer, {
          contentType: tipoConteudo,
          upsert: true,
        });
      if (error) {
        console.error(error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("fotos_perfil")
        .getPublicUrl(fileName);
      logger.info(`Foto de perfil salva com sucesso!`);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new UploadFotoPerfil();
