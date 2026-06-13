import { PrismaClient, AcaoLog, TipoPrazo } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";

const prisma = new PrismaClient();

class UpdatePrazo {
  async execute(
    id: string,
    titulo: string,
    descricao: string,
    dataPrazo: Date,
    tipoPrazo: string,
    usuarioId: string,
  ) {
    try {
      // 👇 Inicia a transação interativa do Prisma
      const formattedPrazo = await prisma.$transaction(async (tx) => {
        // 1. Usa 'tx' em vez de 'prisma' para garantir que faz parte da transação
        const prazoAnterior = await tx.prazos.findUnique({
          where: { id: id },
          include: { processo: true },
        });

        if (!prazoAnterior) {
          throw new Error("Prazo não encontrado");
        }

        // 2. Realiza o update na transação
        const response = await tx.prazos.update({
          where: {
            id: id,
          },
          data: {
            titulo: titulo,
            descricao: descricao,
            dataPrazo: dataPrazo,
            tipo: tipoPrazo as TipoPrazo,
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
          `Prazo ${response.id} atualizado com sucesso no banco de dados!`,
        );

        // 3. Dispara o log dentro do bloco. Se isso falhar sincronicamente, a transação aborta.
        auditEmitter.emit("AUDIT_LOG", {
          entidade: "PRAZO",
          entidadeId: response.id,
          acao: AcaoLog.UPDATE,
          atorId: usuarioId,
          dadosAnteriores: {
            titulo: prazoAnterior.titulo,
            descricao: prazoAnterior.descricao,
            dataPrazo: prazoAnterior.dataPrazo,
            status: prazoAnterior.status,
            tipo: prazoAnterior.tipo,
            processoVinculado: prazoAnterior.processo?.numeroProcesso,
          },
          dadosNovos: {
            titulo: response.titulo,
            descricao: response.descricao,
            dataPrazo: response.dataPrazo,
            status: response.status,
            tipo: response.tipo,
            processoVinculado: response.processo?.numeroProcesso,
          },
        });

        // 4. Formata o objeto e retorna para fora da transação
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
      logger.error(`Erro no Model de UpdatePrazo: ${error}`);
      throw new Error("Erro ao atualizar prazo");
    }
  }
}

export default new UpdatePrazo();
