import logger from "../../utils/logger/logger";
import { deleteFile } from "../../services/storageService";
// 👇 IMPORTANTE: Aqui usamos o prismaBase porque o processo já está com deletedAt preenchido
import { prismaBase } from "../../shared/database/prisma";

class HardDeleteProcesso {
  // Removemos o atorId, pois não haverá mais registro na trilha de auditoria
  async execute(processoId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }

      // 1. A FOTOGRAFIA DO ANTES: Buscamos o processo COMPLETO direto da base sem filtros
      const processo = await prismaBase.processos.findUnique({
        where: {
          id: processoId,
        },
        include: {
          anexosProcesso: true,
          status: true,
          tipo: true,
          cliente: true,
        },
      });

      if (!processo) {
        logger.warn(
          `Processo ${processoId} não encontrado para exclusão definitiva. Pode já ter sido apagado.`,
        );
        return; // Retorno silencioso para não quebrar a rotina em massa
      }

      // =========================================================================
      // FASE 1: DELETAR OS ARQUIVOS FÍSICOS NO CLOUDFLARE R2
      // =========================================================================

      if (processo.anexosProcesso && processo.anexosProcesso.length > 0) {
        logger.debug(
          `Hard Delete: Encontrados ${processo.anexosProcesso.length} arquivos no processo ${processoId}. Deletando do R2...`,
        );

        await Promise.all(
          processo.anexosProcesso.map(async (anexo) => {
            if (anexo.caminhoArquivo) {
              await deleteFile(anexo.caminhoArquivo);
              logger.debug(`Arquivo removido do R2: ${anexo.caminhoArquivo}`);
            }
          }),
        );
        logger.info(
          `Todos os arquivos físicos do processo ${processoId} foram destruídos!`,
        );
      }

      // =========================================================================
      // FASE 2: DELETAR O REGISTRO DO PROCESSO NO BANCO DE DADOS (DEFINITIVO)
      // =========================================================================

      await prismaBase.processos.delete({
        where: {
          id: processoId,
        },
      });

      logger.info(
        `Processo ${processoId} apagado DEFINITIVAMENTE do banco de dados!`,
      );

      return { message: "Processo e arquivos deletados definitivamente." };
    } catch (error) {
      logger.error(
        `Erro fatal no Hard Delete do Processo ${processoId}:`,
        error,
      );
      throw error;
    }
  }
}

export default new HardDeleteProcesso();
