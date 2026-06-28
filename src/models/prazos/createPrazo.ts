import { TipoPrazo, AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { io } from "../.."; // Ajuste o caminho conforme sua estrutura
import dayjs from "dayjs";
import { prisma } from "../../shared/database/prisma";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

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
      const formattedPrazo = await prisma.$transaction(async (tx) => {
        // 1. Criação do prazo com Include expandido para pegar os destinatários
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
                usuariosResponsaveis: {
                  select: { usuarioId: true },
                },
                status: {
                  select: { id: true },
                },
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

        // ====================================================================
        // 2. LÓGICA DE NOTIFICAÇÃO
        // ====================================================================

        const destinatariosSet = new Set<string>();

        // Adiciona o criador do processo (se existir)
        if (response.processo?.usuarioCriacaoId) {
          destinatariosSet.add(response.processo.usuarioCriacaoId);
        }

        // Adiciona os responsáveis do processo
        response.processo?.usuariosResponsaveis?.forEach((resp) => {
          destinatariosSet.add(resp.usuarioId);
        });

        // Remove o usuário que está criando o prazo agora (para ele não notificar a si mesmo)
        destinatariosSet.delete(usuarioId);
        const destinatariosFinal = Array.from(destinatariosSet);

        // Só executa o bloco de notificação se houver destinatários
        if (destinatariosFinal.length > 0) {
          // Busca os dados do ator (usuário que está criando o prazo) para preencher a notificação
          const ator = await tx.usuario.findUnique({
            where: { id: usuarioId },
            select: {
              perfil: {
                select: { nome: true, sobrenome: true, foto: true },
              },
            },
          });

          // Cria a notificação no banco de dados
          const notificacao = await tx.notificacao.create({
            data: {
              tipo: "NOVO_PRAZO",
              descricao: `adicionou um novo prazo: "${titulo}".`,
              usuarioAtorId: usuarioId,
              processoId: processoId,
              destinatarios: {
                create: destinatariosFinal.map((id) => ({
                  usuarioId: id,
                })),
              },
            },
            include: {
              destinatarios: true, // Importante para pegar o ID de vínculo e status isRead
            },
          });

          // Formata nome e foto do ator
          const nomeCompleto = ator?.perfil
            ? `${ator.perfil.nome || ""} ${ator.perfil.sobrenome || ""}`.trim()
            : "Usuário do Sistema";

          const fotoUrl = ator?.perfil?.foto
            ? `${R2_PUBLIC_URL}/${ator.perfil.foto}`
            : null;

          // Emite o socket individualmente para cada destinatário
          notificacao.destinatarios.forEach((destinatario) => {
            io.to(`user_${destinatario.usuarioId}`).emit(
              "notificacao_atualizacao",
              {
                id: destinatario.id, // Envia o ID da tabela pivô (RlNotificacaoUsuario)
                isRead: destinatario.isRead,
                tipo: notificacao.tipo,
                createdAt: notificacao.createdAt,
                descricao: notificacao.descricao,
                usuarioAtor: {
                  nome: nomeCompleto,
                  foto: fotoUrl,
                },
                processo: {
                  numeroProcesso: response.processo.numeroProcesso,
                  id: processoId,
                },
              },
            );
          });
        }
        // ====================================================================

        const mensagem = `Adicionado novo prazo: <strong>${titulo}</strong> com vencimento em ${dayjs(response.dataPrazo).format("DD/MM/YYYY")}`;

        await prisma.atualizacoesProcesso.create({
          data: {
            usuarioId,
            processoId,
            conteudo: mensagem,
            statusId: response.processo.status?.id,
            tipo: "PRAZO",
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
