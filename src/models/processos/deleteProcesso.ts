import { PrismaClient, AcaoLog } from "@prisma/client"; // Adicionado AcaoLog
import logger from "../../utils/logger/logger";
import { deleteFile } from "../../services/storageService";
import { auditEmitter } from "../../services/auditService";

const prisma = new PrismaClient();

class DeleteProcesso {
  // 👇 Adicionado o usuarioId como segundo parâmetro
  async execute(processoId: string, usuarioId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }

      // 1. A FOTOGRAFIA DO ANTES: Buscamos o processo completo para o log e para exclusão dos arquivos
      const processo = await prisma.processos.findUnique({
        where: {
          id: processoId,
        },
        include: {
          anexosProcesso: true,
          status: true, // Incluído para enriquecer o log
          tipo: true, // Incluído para enriquecer o log
          cliente: true, // Incluído para enriquecer o log
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

      // =========================================================================
      // FASE 3: TRILHA DE AUDITORIA (FIRE-AND-FORGET)
      // =========================================================================

      // 👇 Dispara o log APENAS APÓS a exclusão no banco dar certo
      auditEmitter.emit("AUDIT_LOG", {
        entidade: "PROCESSO",
        entidadeId: processo.id,
        acao: AcaoLog.DELETE, // Ação de exclusão
        atorId: usuarioId, // Quem solicitou o delete
        dadosAnteriores: {
          numeroProcesso: processo.numeroProcesso,
          descricao: processo.descricao,
          status: processo.status?.nomeStatus,
          tipo: processo.tipo?.nomeTipo,
          cliente: processo.cliente?.nome,
        },
        dadosNovos: null, // Como foi excluído, o "depois" é nulo
      });

      return { message: "Processo deletado com sucesso" };
    } catch (error) {
      logger.error("Erro no Model de DeleteProcesso:", error);
      throw error;
    }
    // O bloco finally foi removido permanentemente.
  }
}

export default new DeleteProcesso();
