// src/jobs/iniciarJobVerificacaoPrazos.ts
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger/logger";
import { cronitorClient } from "./cronitorCliente";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { io } from "..";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

const prisma = new PrismaClient();

// Função auxiliar para processar e notificar
async function processarNotificacoes(
  prazos: any[],
  tipoNotificacao: "PRAZO_VENCIDO" | "PRAZO_VENCENDO",
) {
  for (const prazo of prazos) {
    try {
      // 1. Busca processo e usuários vinculados
      const processo = await prisma.processos.findUnique({
        where: { id: prazo.processoId },
        include: {
          usuarioCriacao: true,
          usuariosResponsaveis: {
            select: { usuarioId: true },
          },
        },
      });

      if (!processo) continue;

      // 2. Agrupa destinatários únicos usando Set
      const destinatariosSet = new Set<string>();

      if (processo.usuarioCriacaoId) {
        destinatariosSet.add(processo.usuarioCriacaoId);
      }

      processo.usuariosResponsaveis?.forEach((resp: any) => {
        if (resp.usuarioId) {
          destinatariosSet.add(resp.usuarioId);
        }
      });

      const destinatariosFinal = Array.from(destinatariosSet);

      // 3. Cria a notificação e emite o socket apenas se houver destinatários
      if (destinatariosFinal.length > 0) {
        // --- LÓGICA DE CÁLCULO DE DIAS ---
        const hoje = dayjs().startOf("day");
        const dataDoPrazo = dayjs(prazo.dataPrazo).startOf("day");
        const diffDias = dataDoPrazo.diff(hoje, "day");

        let descricaoTexto = "";

        if (tipoNotificacao === "PRAZO_VENCIDO") {
          const diasAtraso = Math.abs(diffDias);
          const plural = diasAtraso === 1 ? "dia" : "dias";
          descricaoTexto = `O prazo "${prazo.titulo}" venceu há ${diasAtraso} ${plural}.`;
        } else {
          // Trata o caso PRAZO_VENCENDO
          if (diffDias === 0) {
            descricaoTexto = `O prazo "${prazo.titulo}" vence hoje.`;
          } else {
            const plural = diffDias === 1 ? "dia" : "dias";
            descricaoTexto = `O prazo "${prazo.titulo}" vence em ${diffDias} ${plural}.`;
          }
        }
        // ---------------------------------

        // Cria APENAS UMA notificação e vincula múltiplos destinatários
        const notificacao = await prisma.notificacao.create({
          data: {
            tipo: tipoNotificacao,
            descricao: descricaoTexto,
            processoId: processo.id,
            // usuarioAtorId omitido pois a ação é do sistema
            destinatarios: {
              create: destinatariosFinal.map((id) => ({
                usuarioId: id,
              })),
            },
          },
          include: {
            destinatarios: true, // Retorna a tabela pivô para pegar id e isRead
          },
        });

        // 4. Emite via Socket individualmente para cada destinatário
        notificacao.destinatarios.forEach((destinatario) => {
          io.to(`user_${destinatario.usuarioId}`).emit(
            "notificacao_atualizacao",
            {
              id: destinatario.id, // ID da tabela pivô (RlNotificacaoUsuario)
              isRead: destinatario.isRead,
              tipo: notificacao.tipo,
              createdAt: notificacao.createdAt,
              descricao: notificacao.descricao,
              usuarioAtor: null, // Sistema gerou a notificação
              processo: {
                numeroProcesso: processo.numeroProcesso,
                id: processo.id,
              },
            },
          );
        });
      }
    } catch (err: any) {
      logger.error(
        `⚠️ Erro ao processar notificação para o prazo ${prazo.id}:`,
        err,
      );
    }
  }
}

export const iniciarJobVerificacaoPrazos = () => {
  cronitorClient.schedule!("VerificacaoDePrazos", "0 0 * * *", async () => {
    logger.info("⏳ Verificando prazos...");
    const hoje = dayjs().startOf("day");
    const limiteFuturo = hoje.add(3, "day");

    try {
      const allPrazos = await prisma.prazos.findMany({
        where: { status: "PENDENTE" },
      });

      const prazosProximos = allPrazos.filter((p) =>
        dayjs(p.dataPrazo).isBetween(hoje, limiteFuturo, "day", "[)"),
      );

      const prazosAtrasados = allPrazos.filter((p) =>
        dayjs(p.dataPrazo).isBefore(hoje, "day"),
      );

      // Executa as notificações
      await processarNotificacoes(prazosAtrasados, "PRAZO_VENCIDO");
      await processarNotificacoes(prazosProximos, "PRAZO_VENCENDO");

      logger.info(
        `✅ Rotina finalizada: ${prazosAtrasados.length} atrasos e ${prazosProximos.length} próximos.`,
      );
    } catch (error) {
      logger.error("❌ Erro ao rodar rotina de prazos", error);
    }
  });
};
