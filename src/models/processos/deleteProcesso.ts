import { AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { prisma } from "../../shared/database/prisma";

class DeleteProcesso {
  async execute(processoId: string, usuarioId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }

      // 1. A FOTOGRAFIA DO ANTES: Buscamos para o log (Usando o prisma estendido normal)
      const processo = await prisma.processos.findUnique({
        where: {
          id: processoId,
        },
        include: {
          status: true,
          tipo: true,
          cliente: true,
        },
      });

      if (!processo) {
        throw new Error("Processo não encontrado ou já excluído.");
      }

      // =========================================================================
      // FASE ÚNICA: SOFT DELETE (MANDAR PARA A LIXEIRA)
      // =========================================================================

      await prisma.processos.update({
        where: {
          id: processoId,
        },
        data: {
          deletedAt: new Date(), // Seta a data atual, enviando para a lixeira
        },
      });

      logger.info(`Processo ${processoId} enviado para a lixeira lógicamente!`);

      // =========================================================================
      // TRILHA DE AUDITORIA (FIRE-AND-FORGET)
      // =========================================================================

      auditEmitter.emit("AUDIT_LOG", {
        entidade: "PROCESSO",
        entidadeId: processo.id,
        acao: AcaoLog.DELETE, // Mantemos DELETE para o log de negócio do usuário
        atorId: usuarioId,
        dadosAnteriores: {
          numeroProcesso: processo.numeroProcesso,
          descricao: processo.descricao,
          status: processo.status?.nomeStatus,
          tipo: processo.tipo?.nomeTipo,
          cliente: processo.cliente?.nome,
          estado: "Ativo",
        },
        dadosNovos: {
          estado: "Na Lixeira",
          dataExclusao: new Date().toISOString(),
        },
      });

      return { message: "Processo enviado para a lixeira com sucesso" };
    } catch (error) {
      logger.error("Erro no Model de DeleteProcesso (Soft):", error);
      throw error;
    }
  }
}

export default new DeleteProcesso();
