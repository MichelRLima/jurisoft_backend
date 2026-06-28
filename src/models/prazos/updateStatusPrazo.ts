import { StatusPrazo, AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { io } from "../.."; // Ajuste o caminho do socket conforme sua estrutura
import dayjs from "dayjs";
import { prisma } from "../../shared/database/prisma";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

class UpdateStatusPrazo {
  async execute(id: string, status: StatusPrazo, usuarioId: string) {
    try {
      if (!id || !status || !usuarioId) {
        throw new Error("Id, status e usuário são obrigatórios.");
      }

      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Busca o prazo atual e os envolvidos no processo
        const prazoAnterior = await tx.prazos.findUnique({
          where: { id },
          include: {
            processo: {
              select: {
                id: true,
                numeroProcesso: true,
                usuarioCriacaoId: true,
                usuariosResponsaveis: { select: { usuarioId: true } },
                status: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        });

        if (!prazoAnterior) {
          throw new Error("Prazo não encontrado.");
        }

        // 2. Atualiza o status do prazo
        const prazoAtualizado = await tx.prazos.update({
          where: { id },
          data: { status },
        });

        // 3. Sistema de Log de Auditoria
        auditEmitter.emit("AUDIT_LOG", {
          entidade: "PRAZO",
          entidadeId: id,
          acao: AcaoLog.UPDATE,
          atorId: usuarioId,
          dadosAnteriores: { status: prazoAnterior.status },
          dadosNovos: { status: prazoAtualizado.status },
        });

        // 4. Sistema de Notificação (Apenas se o status novo for CONCLUIDO e antes não era)
        if (
          status === StatusPrazo.CONCLUIDO &&
          prazoAnterior.status !== StatusPrazo.CONCLUIDO
        ) {
          const destinatariosSet = new Set<string>();

          if (prazoAnterior.processo?.usuarioCriacaoId) {
            destinatariosSet.add(prazoAnterior.processo.usuarioCriacaoId);
          }

          prazoAnterior.processo?.usuariosResponsaveis.forEach((resp) => {
            destinatariosSet.add(resp.usuarioId);
          });

          destinatariosSet.delete(usuarioId); // Evita que o usuário notifique a si mesmo
          const destinatariosFinal = Array.from(destinatariosSet);

          if (destinatariosFinal.length > 0) {
            // Pega os dados do ator da ação para exibir na notificação
            const ator = await tx.usuario.findUnique({
              where: { id: usuarioId },
              select: {
                perfil: { select: { nome: true, sobrenome: true, foto: true } },
              },
            });

            // Salva a notificação no banco
            const notificacao = await tx.notificacao.create({
              data: {
                tipo: "UPDATE_STATUS_PRAZO",
                descricao: `marcou o prazo "${prazoAnterior.titulo}" como concluído.`,
                usuarioAtorId: usuarioId,
                processoId: prazoAnterior.processoId,
                destinatarios: {
                  create: destinatariosFinal.map((uid) => ({
                    usuarioId: uid,
                  })),
                },
              },
              include: { destinatarios: true },
            });

            const nomeCompleto = ator?.perfil
              ? `${ator.perfil.nome || ""} ${ator.perfil.sobrenome || ""}`.trim()
              : "Usuário do Sistema";

            const fotoUrl = ator?.perfil?.foto
              ? `${R2_PUBLIC_URL}/${ator.perfil.foto}`
              : null;

            // Emite o socket para atualizar o frontend em tempo real
            notificacao.destinatarios.forEach((destinatario) => {
              io.to(`user_${destinatario.usuarioId}`).emit(
                "notificacao_atualizacao",
                {
                  id: destinatario.id,
                  isRead: destinatario.isRead,
                  tipo: notificacao.tipo,
                  createdAt: notificacao.createdAt,
                  descricao: notificacao.descricao,
                  usuarioAtor: {
                    nome: nomeCompleto,
                    foto: fotoUrl,
                  },
                  processo: {
                    numeroProcesso: prazoAnterior.processo?.numeroProcesso,
                    id: prazoAnterior.processoId,
                  },
                },
              );
            });
          }

          const mensagem = `Prazo concluído: <strong>${prazoAnterior.titulo}</strong> concluído em ${dayjs().format("DD/MM/YYYY")}`;

          await prisma.atualizacoesProcesso.create({
            data: {
              usuarioId,
              processoId: prazoAnterior.processoId,
              conteudo: mensagem,
              statusId: prazoAnterior.processo?.status?.id,
              tipo: "PRAZO",
            },
          });
        }

        return prazoAtualizado;
      });

      return resultado;
    } catch (error) {
      logger.error("Erro no Model de UpdateStatusPrazo:", error);
      throw error;
    }
  }
}

export default new UpdateStatusPrazo();
