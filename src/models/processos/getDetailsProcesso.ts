import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { getSecureUrl } from "../../services/storageService";
import { io } from "../..";

const prisma = new PrismaClient();
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
          atualizacoes: {
            select: {
              id: true,
              conteudo: true,
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

      io.to(`user_${usuarioCriacaoFormatado?.id}`).emit("nova_notificacao", {
        titulo: "Atualização no Processo",
        mensagem: "teste de envio de notificação",
      });

      return {
        ...detailsProcesso,
        usuarioCriacao: usuarioCriacaoFormatado,
        usuariosResponsaveis: usuariosResponsaveisFormatados,
        atualizacoes: atualizacoesFormatadas, // Array formatado adicionado ao retorno
        anexosProcesso: anexosComLinksTemporarios,
      };
    } catch (error) {
      logger.error("Erro ao buscar detalhes do processo:", error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new GetDetailsProcesso();
