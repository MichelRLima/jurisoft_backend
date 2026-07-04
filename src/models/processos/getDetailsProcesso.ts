import { prisma } from "../../shared/database/prisma";
import logger from "../../utils/logger/logger";
import { getSecureUrl } from "../../services/storageService";
import { io } from "../..";
import { decryptDado } from "../../utils/crypto/encryption"; // Importe a função de descriptografia

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Definição do tipo para garantir consistência no mapeamento
type CampoAdicional = {
  id: string;
  label: string;
  value: string;
  type: string;
};

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
          id: processoId,
          OR: [
            {
              usuarioCriacaoId: usuarioId,
            },
            {
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
              dataPrazo: "asc",
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

      if (!detailsProcesso) {
        throw new Error("Processo não encontrado ou sem permissão de acesso.");
      }

      // =========================================================================
      // 1. FOTOS DE PERFIL (Bucket Público - Síncrono e Rápido)
      // =========================================================================

      const uCriacao = detailsProcesso.usuarioCriacao;
      const uPerfil = uCriacao?.perfil;
      const uFotoUrl = uPerfil?.foto ? `${R2_PUBLIC_URL}/${uPerfil.foto}` : "";

      const usuarioCriacaoFormatado = uCriacao
        ? {
            ...uCriacao,
            perfil: uPerfil
              ? {
                  ...uPerfil,
                  foto: uFotoUrl,
                }
              : null,
          }
        : null;

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
                    foto: rFotoUrl,
                  }
                : null,
            },
          };
        });

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
                        foto: aFotoUrl,
                      }
                    : null,
                }
              : null,
          };
        },
      );

      // =========================================================================
      // FORMATAÇÃO DOS PRAZOS DESTE PROCESSO
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
        esfera: detailsProcesso.esfera,
      }));

      // =========================================================================
      // INTERCEPTAÇÃO: Descriptografar campos de senha em dadosAdicionais
      // =========================================================================
      const dadosAdicionaisFormatados = detailsProcesso.dadosAdicionais.map(
        (dado) => {
          // Trata a propriedade campos (que vem do Prisma como Json) como um array de objetos CampoAdicional
          const camposBrutos =
            (dado.campos as unknown as CampoAdicional[]) || [];

          const camposProcessados = camposBrutos.map((campo) => {
            if (campo.type === "password" && campo.value) {
              try {
                return {
                  ...campo,
                  value: decryptDado(campo.value), // Devolve o texto limpo para o front
                };
              } catch (decryptionError) {
                // Fallback preventivo caso haja algum dado antigo em texto plano ou corrompido no banco
                logger.error(
                  `Falha ao descriptografar campo ${campo.id}:`,
                  decryptionError,
                );
                return campo;
              }
            }
            return campo;
          });

          return {
            ...dado,
            campos: camposProcessados,
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

      const notificacoesNaoLidas = await prisma.rlNotificacaoUsuario.findMany({
        where: {
          usuarioId: usuarioId,
          isRead: false,
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

        io.to(`user_${usuarioId}`).emit("read_notificacoes", {
          processoId: processoId,
          mensagem: "Notificações lidas atualizadas",
        });
      }

      const { prazos, ...restOfProcesso } = detailsProcesso;
      logger.info("Detalhes do processo buscados com sucesso!");

      return {
        ...restOfProcesso,
        usuarioCriacao: usuarioCriacaoFormatado,
        usuariosResponsaveis: usuariosResponsaveisFormatados,
        atualizacoes: atualizacoesFormatadas,
        anexosProcesso: anexosComLinksTemporarios,
        prazos: prazosFormatados,
        dadosAdicionais: dadosAdicionaisFormatados, // Retorna os dados com as senhas abertas
      };
    } catch (error) {
      logger.error("Erro ao buscar detalhes do processo:", error);
      throw error;
    }
  }
}

export default new GetDetailsProcesso();
