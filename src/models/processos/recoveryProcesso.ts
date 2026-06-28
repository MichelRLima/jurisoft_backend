import { AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { prismaBase } from "../../shared/database/prisma";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class RecoveryProcesso {
  async execute(processoId: string, usuarioId: string) {
    try {
      if (!processoId) {
        throw new Error("Id não informado");
      }
      console.log("----", processoId);

      logger.debug(`Iniciando restauração do processo: ${processoId}`);

      // 1. Busca estado anterior para o log de auditoria
      const firstProcesso = await prismaBase.processos.findUnique({
        where: { id: processoId },
        include: { status: true },
      });

      if (!firstProcesso) {
        throw new Error("Processo não encontrado na base de dados");
      }

      // 2. Atualiza o processo (restauração)
      const processoRestaurado = await prismaBase.processos.update({
        where: {
          id: processoId,
        },
        data: {
          deletedAt: null,
        },
        include: {
          status: {
            select: { id: true, codigoStatus: true, nomeStatus: true },
          },
        },
      });

      auditEmitter.emit("AUDIT_LOG", {
        entidade: "PROCESSO",
        entidadeId: processoRestaurado.id,
        acao: AcaoLog.UPDATE, // Se você tiver AcaoLog.RESTORE no prisma, pode usar
        atorId: usuarioId,
        dadosAnteriores: {
          deletedAt: firstProcesso.deletedAt,
          status: firstProcesso.status?.nomeStatus,
        },
        dadosNovos: {
          deletedAt: null,
          status: processoRestaurado.status?.nomeStatus,
        },
      });

      logger.info(
        `Processo ${processoId} restaurado com sucesso pelo usuário ${usuarioId}`,
      );

      return {
        message: "Processo restaurado com sucesso",
      };
    } catch (error) {
      logger.error("Erro no Model de RecoveryProcesso:", error);
      throw error;
    }
  }
}

export default new RecoveryProcesso();
