import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { deleteFile } from "../../services/storageService"; // Importando o serviço do R2

const prisma = new PrismaClient();

class DeleteProcesso {
  async execute(processoId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }

      // Busca o processo e já inclui os anexos para termos acesso ao "caminhoArquivo"
      const processo = await prisma.processos.findUnique({
        where: {
          id: processoId,
        },
        include: {
          anexosProcesso: true,
        },
      });

      if (!processo) {
        throw new Error("Processo não encontrado");
      }

      // =========================================================================
      // FASE 1: DELETAR OS ARQUIVOS FÍSICOS NO CLOUDFLARE R2
      // =========================================================================

      if (processo.anexosProcesso && processo.anexosProcesso.length > 0) {
        logger.debug(
          `Encontrados ${processo.anexosProcesso.length} arquivos para deletar no R2. Iniciando exclusão...`,
        );

        // Dispara a exclusão de todos os arquivos simultaneamente no R2
        await Promise.all(
          processo.anexosProcesso.map(async (anexo) => {
            if (anexo.caminhoArquivo) {
              await deleteFile(anexo.caminhoArquivo);
              logger.debug(`Arquivo removido do R2: ${anexo.caminhoArquivo}`);
            }
          }),
        );
        logger.info(
          "Todos os arquivos do R2 vinculados ao processo foram excluídos!",
        );
      }

      // =========================================================================
      // FASE 2: DELETAR O REGISTRO DO PROCESSO NO BANCO DE DADOS
      // =========================================================================

      await prisma.processos.delete({
        where: {
          id: processoId,
        },
      });

      logger.info(
        `Processo ${processoId} deletado com sucesso do banco de dados!`,
      );

      return { message: "Processo deletado com sucesso" };
    } catch (error) {
      logger.error("Erro no Model de DeleteProcesso:", error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new DeleteProcesso();
