// src/jobs/limparNotificacoes.ts
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger/logger";
import { cronitorClient } from "./cronitorCliente";

const prisma = new PrismaClient();

export const iniciarJobLimpezaLogs = () => {
  cronitorClient.schedule!("LimpezaDeLogs", "0 3 * * *", async () => {
    logger.info("⏳ Iniciando rotina de limpeza de logs antigas...");

    try {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const deletadas = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: trintaDiasAtras,
          },
        },
      });

      logger.info(
        `✅ Rotina finalizada: ${deletadas.count} notificações apagadas.`,
      );
    } catch (error) {
      logger.error("❌ Erro ao rodar rotina de limpeza de notificações", error);
      throw error;
    }
  });
};
