import { AcaoLog } from "@prisma/client";
import { prisma } from "../../shared/database/prisma";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";

type DadoAdicional = {
  id: string;
  titulo: string;
  descricao: string;
  campos: string[];
  processoId: string;
};

class CreateDadoAdicional {
  async execute(dadoAdicional: DadoAdicional, usuarioId: string) {
    try {
      if (!dadoAdicional.titulo || !dadoAdicional.processoId) {
        throw new Error("Título e ID do processo são obrigatórios.");
      }

      // 1. A FOTOGRAFIA DO ANTES: Verifica se já existe para diferenciar CREATE de UPDATE
      let acaoLog: AcaoLog = AcaoLog.CREATE;
      let dadosAnteriores: any = null;

      if (dadoAdicional.id) {
        const dadoExistente = await prisma.dadoAdicional.findUnique({
          where: { id: dadoAdicional.id },
        });

        if (dadoExistente) {
          acaoLog = AcaoLog.UPDATE;
          dadosAnteriores = {
            titulo: dadoExistente.titulo,
            descricao: dadoExistente.descricao,
            campos: dadoExistente.campos,
          };
        }
      }

      // =========================================================================
      // FASE ÚNICA: UPSERT (CRIAR OU ATUALIZAR)
      // =========================================================================
      const createdDadoAdicional = await prisma.dadoAdicional.upsert({
        where: {
          id: dadoAdicional.id || "", // Garante fallback caso venha undefined
        },
        update: {
          titulo: dadoAdicional.titulo,
          descricao: dadoAdicional.descricao,
          campos: dadoAdicional.campos,
        },
        create: {
          titulo: dadoAdicional.titulo,
          descricao: dadoAdicional.descricao,
          campos: dadoAdicional.campos,
          processoId: dadoAdicional.processoId,
        },
      });

      logger.info(
        `Dado Adicional ${createdDadoAdicional.id} processado com sucesso (Ação: ${acaoLog})!`,
      );

      // =========================================================================
      // TRILHA DE AUDITORIA (FIRE-AND-FORGET)
      // =========================================================================
      auditEmitter.emit("AUDIT_LOG", {
        entidade: "DADO_ADICIONAL",
        entidadeId: createdDadoAdicional.id,
        acao: acaoLog,
        atorId: usuarioId,
        dadosAnteriores: dadosAnteriores,
        dadosNovos: {
          titulo: createdDadoAdicional.titulo,
          descricao: createdDadoAdicional.descricao,
          campos: createdDadoAdicional.campos,
        },
      });

      return createdDadoAdicional;
    } catch (error) {
      logger.error("Erro no Model de CreateDadoAdicional:", error);
      throw error;
    }
  }
}

export default new CreateDadoAdicional();
