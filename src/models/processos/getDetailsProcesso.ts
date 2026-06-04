import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { getSecureUrl } from "../../services/storageService";

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
          // ... (seu select continua exatamente igual)
          id: true,
          numeroProcesso: true,
          descricao: true,
          createdAt: true,
          usuarioCriacao: {
            select: {
              id: true,
              email: true,
              login: true,
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

      // Retorna o objeto combinando os links públicos instantâneos com as URLs seguras geradas
      return {
        ...detailsProcesso,
        usuarioCriacao: usuarioCriacaoFormatado,
        usuariosResponsaveis: usuariosResponsaveisFormatados,
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
