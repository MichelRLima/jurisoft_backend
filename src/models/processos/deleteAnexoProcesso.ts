import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { deleteFile } from "../../services/storageService"; // Importando o serviço do Cloudflare R2

const prisma = new PrismaClient();

class DeleteAnexoProcesso {
  async execute(anexoId: string) {
    try {
      if (!anexoId) {
        throw new Error("Id do anexo ausente.");
      }

      // 1. Busca o anexo para encontrar o caminho do arquivo no R2
      const anexo = await prisma.anexosProcesso.findUnique({
        where: {
          id: anexoId,
        },
      });

      if (!anexo) {
        throw new Error("Anexo não encontrado");
      }

      // =========================================================================
      // FASE 1: REMOÇÃO DO ARQUIVO FÍSICO NO CLOUDFLARE R2
      // =========================================================================
      if (anexo.caminhoArquivo) {
        logger.debug(`Removendo arquivo físico do R2: ${anexo.caminhoArquivo}`);
        await deleteFile(anexo.caminhoArquivo);
      } else {
        logger.warn(
          `Anexo ${anexoId} não possui caminho de arquivo associado.`,
        );
      }

      // =========================================================================
      // FASE 2: REMOÇÃO DO REGISTRO NO BANCO DE DADOS
      // =========================================================================
      await prisma.anexosProcesso.delete({
        where: {
          id: anexo.id,
        },
      });

      logger.info(`Anexo ${anexoId} deletado com sucesso do sistema!`);

      return { message: "Anexo deletado com sucesso" };
    } catch (error) {
      logger.error("Erro no Model de DeleteAnexoProcesso:", error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new DeleteAnexoProcesso();
