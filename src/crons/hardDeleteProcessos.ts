import logger from "../utils/logger/logger";
import { cronitorClient } from "./cronitorCliente";
// Importamos a instância base porque precisamos enxergar os dados que estão com deletedAt preenchido
import { prismaBase } from "../shared/database/prisma";
import hardDeleteProcesso from "../models/processos/hardDeleteProcesso";
// Ajuste o caminho de importação do model de acordo com a sua estrutura de pastas

export const iniciarJobLimpezaProcessos = () => {
  cronitorClient.schedule!(
    "LimpezaDeProcessosNaLixeira",
    "5 0 * * *", // Roda todos os dias às 00:05 da manhã
    async () => {
      logger.info(
        "⏳ Iniciando rotina de exclusão definitiva de processos (Lixeira)...",
      );

      try {
        // Calcula a data de corte: Exatamente 7 dias atrás
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

        // 1. Busca os IDs de todos os processos que estão na lixeira há mais de 7 dias
        const processosExpirados = await prismaBase.processos.findMany({
          where: {
            deletedAt: {
              not: null, // Garante que só busca quem está na lixeira
              lt: seteDiasAtras, // Menor que 7 dias atrás
            },
          },
          select: {
            id: true,
          },
        });

        if (processosExpirados.length === 0) {
          logger.info(
            "✅ Rotina finalizada: Nenhum processo expirado na lixeira hoje.",
          );
          return;
        }

        logger.info(
          `🗑️ Encontrados ${processosExpirados.length} processos para destruição total. Iniciando...`,
        );

        let sucessos = 0;
        let falhas = 0;

        // 2. Executa o model de Hard Delete para cada processo encontrado
        // Usamos um for...of para deletar um por vez e não sobrecarregar as requisições ao Cloudflare R2
        for (const processo of processosExpirados) {
          try {
            await hardDeleteProcesso.execute(processo.id);
            sucessos++;
          } catch (error) {
            logger.error(
              `❌ Falha ao tentar apagar definitivamente o processo: ${processo.id}`,
              error,
            );
            falhas++;
          }
        }

        logger.info(
          `✅ Rotina finalizada: ${sucessos} processos (e seus arquivos) apagados definitivamente. Falhas: ${falhas}.`,
        );
      } catch (error) {
        logger.error(
          "❌ Erro fatal ao rodar rotina de limpeza de processos da lixeira",
          error,
        );
        throw error;
      }
    },
  );
};
