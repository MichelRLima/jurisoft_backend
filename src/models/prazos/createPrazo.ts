import { PrismaClient, TipoPrazo, AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";

const prisma = new PrismaClient();

class CreatePrazo {
  async execute(
    titulo: string,
    descricao: string,
    dataPrazo: Date,
    processoId: string,
    tipoPrazo: string,
    usuarioId: string,
  ) {
    try {
      // 👇 Transação para a criação e log
      const formattedPrazo = await prisma.$transaction(async (tx) => {
        const response = await tx.prazos.create({
          data: {
            titulo: titulo,
            descricao: descricao,
            dataPrazo: dataPrazo,
            tipo: tipoPrazo as TipoPrazo,
            processoId: processoId,
          },
          include: {
            processo: {
              include: {
                cliente: true,
              },
            },
          },
        });

        logger.info(
          `Prazo ${response.id} criado com sucesso no banco de dados!`,
        );

        auditEmitter.emit("AUDIT_LOG", {
          entidade: "PRAZO",
          entidadeId: response.id,
          acao: AcaoLog.CREATE,
          atorId: usuarioId,
          dadosAnteriores: null,
          dadosNovos: {
            titulo: response.titulo,
            descricao: response.descricao,
            dataPrazo: response.dataPrazo,
            status: response.status,
            tipo: response.tipo,
            processoVinculado: response.processo?.numeroProcesso,
          },
        });

        return {
          id: response.id,
          title: response.titulo,
          caseNumber: response.processo.numeroProcesso,
          clientName: response.processo.cliente.nome,
          deadlineDate: response.dataPrazo.toISOString(),
          taskType: response.tipo,
          description: response.descricao,
          status: response.status,
        };
      });

      return formattedPrazo;
    } catch (error) {
      logger.error("Erro no Model de CreatePrazo:", error);
      throw new Error("Erro ao criar prazo");
    }
  }
}

export default new CreatePrazo();
