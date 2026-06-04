import { EventEmitter } from "events";
import { PrismaClient, AcaoLog } from "@prisma/client";
import logger from "../utils/logger/logger"; // Seu logger de console

const prisma = new PrismaClient();
export const auditEmitter = new EventEmitter();

// Interface para garantir que todo log siga o mesmo padrão
export interface AuditEventPayload {
  entidade: string;
  entidadeId: string;
  acao: AcaoLog;
  atorId: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
}

// O "Ouvinte": Ele fica rodando em background esperando alguém gritar "AUDIT_LOG"
auditEmitter.on("AUDIT_LOG", async (payload: AuditEventPayload) => {
  try {
    await prisma.auditLog.create({
      data: {
        entidade: payload.entidade,
        entidadeId: payload.entidadeId,
        acao: payload.acao,
        atorId: payload.atorId,
        // Converte os objetos para JSON stringificado seguro
        dadosAnteriores: payload.dadosAnteriores
          ? JSON.parse(JSON.stringify(payload.dadosAnteriores))
          : null,
        dadosNovos: payload.dadosNovos
          ? JSON.parse(JSON.stringify(payload.dadosNovos))
          : null,
      },
    });
  } catch (error) {
    // Se o log falhar, não derruba o sistema, apenas avisa no console
    logger.error("Falha ao gravar Trilha de Auditoria:", error);
  }
});
