import { PrismaClient } from "@prisma/client";
import { io } from "../..";

const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

class CreateAtualizacaoProcesso {
  async execute(
    usuarioId: string,
    processoId: string,
    conteudo: string,
    statusProcesso: string,
  ) {
    try {
      if (!usuarioId || !processoId || !conteudo || !statusProcesso) {
        throw new Error("Dados inválidos");
      }

      // Utiliza a transação interativa para agrupar as operações dependentes
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Busca o ID e o Nome do status informado (Nome útil para a notificação)
        const statusDetails = await tx.statusProcesso.findUnique({
          where: { codigoStatus: statusProcesso },
          select: { id: true, nomeStatus: true },
        });

        if (!statusDetails?.id) {
          throw new Error("Status inválido");
        }

        // 2. Busca os envolvidos no processo (Criador + Responsáveis) e o número do processo
        const processoDetails = await tx.processos.findUnique({
          where: { id: processoId },
          select: {
            numeroProcesso: true, // Adicionado para enviar na notificação
            usuarioCriacaoId: true,
            usuariosResponsaveis: {
              select: { usuarioId: true },
            },
          },
        });

        if (!processoDetails) {
          throw new Error("Processo não encontrado");
        }

        // 3. Cria o registro de atualização do processo e SELECIONA os dados de retorno
        const atualizacao = await tx.atualizacoesProcesso.create({
          data: {
            usuarioId,
            processoId,
            conteudo,
            statusId: statusDetails.id,
          },
          select: {
            id: true,
            conteudo: true,
            createdAt: true,
            usuario: {
              select: {
                id: true,
                email: true,
                login: true,
                permissao: {
                  select: {
                    id: true,
                    codigoPermissao: true,
                    nomePermissao: true,
                    descricaoPermissao: true,
                    ativo: true,
                    tipo: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                perfil: {
                  select: { id: true, nome: true, sobrenome: true, foto: true },
                },
              },
            },
            status: {
              select: { id: true, codigoStatus: true, nomeStatus: true },
            },
          },
        });

        // 4. Atualiza o status atual na tabela principal do processo
        await tx.processos.update({
          where: { id: processoId },
          data: { statusId: statusDetails.id },
        });

        // ====================================================================
        // 5. LÓGICA DE NOTIFICAÇÃO
        // ====================================================================

        const destinatariosSet = new Set<string>();

        if (processoDetails.usuarioCriacaoId) {
          destinatariosSet.add(processoDetails.usuarioCriacaoId);
        }

        processoDetails.usuariosResponsaveis.forEach((resp) => {
          destinatariosSet.add(resp.usuarioId);
        });

        // Remove o usuário que está fazendo a atualização agora
        destinatariosSet.delete(usuarioId);
        const destinatariosFinal = Array.from(destinatariosSet);

        // Só cria a notificação se sobrar alguém na lista
        if (destinatariosFinal.length > 0) {
          // Precisamos armazenar o resultado do create e dar include nos destinatários
          // para pegar o ID da relação (RlNotificacaoUsuario) gerado para cada um
          const notificacao = await tx.notificacao.create({
            data: {
              tipo: "ATUALIZACAO_PROCESSO",
              descricao: `adicionou uma nova atualização e alterou o status para "${statusDetails.nomeStatus}".`,
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

          // Prepara os dados do ator (nome e foto) baseados no insert da atualização (passo 3)
          const perfilAtor = atualizacao.usuario?.perfil;
          const nomeCompleto = perfilAtor
            ? `${perfilAtor.nome || ""} ${perfilAtor.sobrenome || ""}`.trim()
            : "Usuário do Sistema";

          const fotoUrl = perfilAtor?.foto
            ? `${R2_PUBLIC_URL}/${perfilAtor.foto}`
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
                  numeroProcesso: processoDetails.numeroProcesso,
                  id: processoId,
                },
              },
            );
          });
        }
        // ====================================================================

        return atualizacao;
      });

      const format = {
        ...resultado,
        usuario: {
          ...resultado.usuario,
          perfil: {
            ...resultado.usuario?.perfil,
            foto: resultado.usuario?.perfil?.foto
              ? `${R2_PUBLIC_URL}/${resultado.usuario?.perfil?.foto}`
              : null,
          },
        },
      };

      return format;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new CreateAtualizacaoProcesso();
