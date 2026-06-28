import { prisma } from "../../shared/database/prisma";
import logger from "../../utils/logger/logger";
import { getSecureUrl } from "../../services/storageService";
import { io } from "../..";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class GetDetailsProcesso {
  async execute(processoId: string, usuarioId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }
      if (!usuarioId) {
        throw new Error("Necessário informar o usuário");
      }

      const detailsProcesso = await prisma.processos.findFirst({
        where: {
          id: processoId, // Filtra pelo ID do processo
          OR: [
            {
              // Condição 1: Usuário é o criador
              usuarioCriacaoId: usuarioId,
            },
            {
              // Condição 2: Usuário está na lista de responsáveis
              usuariosResponsaveis: {
                some: {
                  usuarioId: usuarioId,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          numeroProcesso: true,
          descricao: true,
          createdAt: true,
          esfera: true,
          usuarioCriacao: {
            select: {
              id: true,
              email: true,
              login: true,
              permissao: true,
              perfil: {
                select: { id: true, nome: true, sobrenome: true, foto: true },
              },
            },
          },
          status: {
            select: { id: true, codigoStatus: true, nomeStatus: true },
          },
          tipo: {
            select: { id: true, codigoTipo: true, nomeTipo: true },
          },
          usuariosResponsaveis: {
            select: {
              usuario: {
                select: {
                  id: true,
                  email: true,
                  login: true,
                  permissao: true,
                  perfil: {
                    select: {
                      id: true,
                      nome: true,
                      sobrenome: true,
                      foto: true,
                    },
                  },
                },
              },
            },
          },
          anexosProcesso: {
            select: { id: true, nome: true, caminhoArquivo: true },
          },
          cliente: {
            select: {
              id: true,
              nome: true,
              documento: true,
              contato: true,
              email: true,
              cep: true,
              logradouro: true,
              numero: true,
              complemento: true,
              bairro: true,
              cidade: true,
              estado: true,
            },
          },
          // ADICIONADO: Busca todos os prazos atrelados a este processo
          prazos: {
            select: {
              id: true,
              titulo: true,
              dataPrazo: true,
              tipo: true,
              descricao: true,
              status: true,
            },
            orderBy: {
              dataPrazo: "asc", // Ordena do mais próximo para o mais distante
            },
          },
          atualizacoes: {
            select: {
              id: true,
              conteudo: true,
              tipo: true,
              createdAt: true,
              updatedAt: true,
              usuario: {
                select: {
                  id: true,
                  email: true,
                  login: true,
                  permissao: true,
                  perfil: {
                    select: {
                      id: true,
                      nome: true,
                      sobrenome: true,
                      foto: true,
                    },
                  },
                },
              },
              status: {
                select: { id: true, codigoStatus: true, nomeStatus: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          dadosAdicionais: {
            select: {
              id: true,
              titulo: true,
              descricao: true,
              campos: true,
            },
          },
        },
      });

      // Se o resultado for nulo, significa que o ID não existe OU o usuário não tem permissão
      if (!detailsProcesso) {
        throw new Error("Processo não encontrado ou sem permissão de acesso.");
      }

      // =========================================================================
      // 1. FOTOS DE PERFIL (Bucket Público - Síncrono e Rápido)
      // =========================================================================

      // Formata o Usuário de Criação
      const uCriacao = detailsProcesso.usuarioCriacao;
      const uPerfil = uCriacao?.perfil;
      const uFotoUrl = uPerfil?.foto ? `${R2_PUBLIC_URL}/${uPerfil.foto}` : "";

      const usuarioCriacaoFormatado = uCriacao
        ? {
            ...uCriacao,
            perfil: uPerfil
              ? {
                  ...uPerfil,
                  foto: uFotoUrl, // Link estático e permanente
                }
              : null,
          }
        : null;

      // Formata os Usuários Responsáveis
      const usuariosResponsaveisFormatados =
        detailsProcesso.usuariosResponsaveis.map((responsavel) => {
          const rUsuario = responsavel.usuario;
          const rPerfil = rUsuario?.perfil;
          const rFotoUrl = rPerfil?.foto
            ? `${R2_PUBLIC_URL}/${rPerfil.foto}`
            : "";

          return {
            usuario: {
              ...rUsuario,
              perfil: rPerfil
                ? {
                    ...rPerfil,
                    foto: rFotoUrl, // Link estático e permanente
                  }
                : null,
            },
          };
        });

      // Formata os Usuários das Atualizações
      const atualizacoesFormatadas = detailsProcesso.atualizacoes.map(
        (atualizacao) => {
          const aUsuario = atualizacao.usuario;
          const aPerfil = aUsuario?.perfil;
          const aFotoUrl = aPerfil?.foto
            ? `${R2_PUBLIC_URL}/${aPerfil.foto}`
            : "";

          return {
            ...atualizacao,
            usuario: aUsuario
              ? {
                  ...aUsuario,
                  perfil: aPerfil
                    ? {
                        ...aPerfil,
                        foto: aFotoUrl, // Link estático e permanente
                      }
                    : null,
                }
              : null,
          };
        },
      );

      // =========================================================================
      // ADICIONADO: FORMATAÇÃO DOS PRAZOS DESTE PROCESSO
      // =========================================================================
      const prazosFormatados = detailsProcesso.prazos.map((prazo) => ({
        id: prazo.id,
        title: prazo.titulo,
        caseNumber: detailsProcesso.numeroProcesso,
        clientName: detailsProcesso.cliente?.nome || "",
        deadlineDate: prazo.dataPrazo.toISOString(),
        taskType: prazo.tipo,
        description: prazo.descricao,
        status: prazo.status,
      }));

      // =========================================================================
      // 2. GERAÇÃO DE LINKS SEGUROS PARA OS ANEXOS (Bucket Privado - Assíncrono)
      // =========================================================================

      const anexosComLinksTemporarios = await Promise.all(
        detailsProcesso.anexosProcesso.map(async (anexo) => {
          let urlSegura = "";

          if (anexo.caminhoArquivo) {
            urlSegura = await getSecureUrl(anexo.caminhoArquivo);
          }

          return {
            id: anexo.id,
            nome: anexo.nome,
            url: urlSegura,
          };
        }),
      );

      const notificacoesNaoLidas = await prisma.rlNotificacaoUsuario.findMany({
        where: {
          usuarioId: usuarioId,
          isRead: false, // Otimização: ignora as que já estão lidas
          notificacao: {
            processoId: processoId,
          },
        },
        select: { id: true },
      });

      const idsParaAtualizar = notificacoesNaoLidas.map((n) => n.id);
      if (idsParaAtualizar.length > 0) {
        await prisma.rlNotificacaoUsuario.updateMany({
          where: {
            id: { in: idsParaAtualizar },
          },
          data: {
            isRead: true,
          },
        });

        // Dispara o evento via Socket.io APENAS se houveram notificações atualizadas.
        io.to(`user_${usuarioId}`).emit("read_notificacoes", {
          processoId: processoId,
          mensagem: "Notificações lidas atualizadas",
        });
      }

      // Remove a propriedade 'prazos' bruta do Prisma para não duplicar dados
      const { prazos, ...restOfProcesso } = detailsProcesso;
      logger.info("Detalhes do processo buscados com sucesso!");
      return {
        ...restOfProcesso,
        usuarioCriacao: usuarioCriacaoFormatado,
        usuariosResponsaveis: usuariosResponsaveisFormatados,
        atualizacoes: atualizacoesFormatadas,
        anexosProcesso: anexosComLinksTemporarios,
        prazos: prazosFormatados, // Retorna os prazos na formatação esperada pelo frontend
        dadosAdicionais: detailsProcesso.dadosAdicionais,
      };
    } catch (error) {
      logger.error("Erro ao buscar detalhes do processo:", error);
      throw error;
    }
  }
}

export default new GetDetailsProcesso();
