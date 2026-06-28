// src/jobs/limparNotificacoes.ts
import logger from "../utils/logger/logger";
import { cronitorClient } from "./cronitorCliente";
import { prisma } from "../shared/database/prisma";

export const iniciarJobLimpezaNotificacoes = () => {
  cronitorClient.schedule!(
    "LimpezaDeNotificacoesLidas",
    "1 0 * * *",
    async () => {
      logger.info("⏳ Iniciando rotina de limpeza de notificações antigas...");

      try {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

        const deletadas = await prisma.notificacao.deleteMany({
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
        logger.error(
          "❌ Erro ao rodar rotina de limpeza de notificações",
          error,
        );
        throw error;
      }
    },
  );
};
