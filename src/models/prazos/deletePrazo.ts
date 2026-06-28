import { AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { prisma } from "../../shared/database/prisma";

class DeletePrazo {
  async execute(id: string, usuarioId: string) {
    try {
      if (!id) {
        throw new Error("Id do prazo ausente.");
      }

      // 👇 Transação para garantir que a leitura, a deleção e o trigger do log andem juntos
      await prisma.$transaction(async (tx) => {
        const prazo = await tx.prazos.findUnique({
          where: {
            id: id,
          },
          include: {
            processo: true,
          },
        });

        if (!prazo) {
          throw new Error("Prazo não encontrado");
        }

        await tx.prazos.delete({
          where: {
            id: id,
          },
        });

        logger.info(`Prazo ${id} deletado com sucesso do banco de dados!`);

        auditEmitter.emit("AUDIT_LOG", {
          entidade: "PRAZO",
          entidadeId: prazo.id,
          acao: AcaoLog.DELETE,
          atorId: usuarioId,
          dadosAnteriores: {
            titulo: prazo.titulo,
            descricao: prazo.descricao,
            dataPrazo: prazo.dataPrazo,
            status: prazo.status,
            tipo: prazo.tipo,
            processoVinculado: prazo.processo?.numeroProcesso,
          },
          dadosNovos: null,
        });
      });

      return { message: "Prazo deletado com sucesso" };
    } catch (error) {
      logger.error("Erro no Model de DeletePrazo:", error);
      throw error;
    }
  }
}

export default new DeletePrazo();
