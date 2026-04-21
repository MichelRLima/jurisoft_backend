import { supabase } from "../../services/supabaseService/supabaseConfig";
import logger from "../../utils/logger/logger";

class DeleteFotoPerfil {
  async execute(urlPublica: string) {
    try {
      const partes = urlPublica.split("fotos_perfil/");
      const fileName = partes[partes.length - 1];
      logger.debug(`Removendo foto de perfil...`);
      if (!fileName) return;
      console.log(fileName);

      // 2. Chamar o comando de remoção
      const { data, error } = await supabase.storage
        .from("fotos_perfil")
        .remove([fileName]); // O remove espera um array de strings

      if (error) {
        console.error("Erro ao deletar arquivo no Supabase:", error);
        throw error;
      }
      logger.info(`Foto de perfil removida com sucesso!`);
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new DeleteFotoPerfil();
