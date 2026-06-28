import { AcaoLog } from "@prisma/client";
import { prisma } from "../../shared/database/prisma";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";

class DeleteDadoAdicional {
  async execute(idDadoAdicional: string, usuarioId: string) {
    try {
      if (!idDadoAdicional) {
        throw new Error("ID do dado adicional é obrigatório.");
      }

      // 1. A FOTOGRAFIA DO ANTES: Buscamos para o log antes de apagar
      const dadoAdicional = await prisma.dadoAdicional.findUnique({
        where: {
          id: idDadoAdicional,
        },
      });

      if (!dadoAdicional) {
        throw new Error("Dado adicional não encontrado ou já excluído.");
      }

      // =========================================================================
      // FASE ÚNICA: HARD DELETE (EXCLUSÃO FÍSICA)
      // =========================================================================
      await prisma.dadoAdicional.delete({
        where: {
          id: idDadoAdicional,
        },
      });

      logger.info(`Dado adicional ${idDadoAdicional} excluído fisicamente!`);

      // =========================================================================
      // TRILHA DE AUDITORIA (FIRE-AND-FORGET)
      // =========================================================================
      auditEmitter.emit("AUDIT_LOG", {
        entidade: "DADO_ADICIONAL",
        entidadeId: dadoAdicional.id,
        acao: AcaoLog.DELETE,
        atorId: usuarioId,
        dadosAnteriores: {
          titulo: dadoAdicional.titulo,
          descricao: dadoAdicional.descricao,
          processoId: dadoAdicional.processoId,
        },
        dadosNovos: {
          estado: "Excluído Permanentemente",
          dataExclusao: new Date().toISOString(),
        },
      });

      return { message: "Dado adicional deletado com sucesso!" };
    } catch (error) {
      logger.error("Erro no Model de DeleteDadoAdicional:", error);
      throw error;
    }
  }
}

export default new DeleteDadoAdicional();
