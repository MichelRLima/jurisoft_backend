import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger"; // Trocado o console.log pelo seu logger padrão
import { getSecureUrl } from "../../services/storageService"; // Importando o gerador de links do R2

const prisma = new PrismaClient();

class GetDetailsProcesso {
  async execute(processoId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }

      const detailsProcesso = await prisma.processos.findUnique({
        where: {
          id: processoId,
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
            select: {
              id: true,
              codigoStatus: true,
              nomeStatus: true,
            },
          },
          tipo: {
            select: {
              id: true,
              codigoTipo: true,
              nomeTipo: true,
            },
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
            select: {
              id: true,
              nome: true,
              caminhoArquivo: true, // Substituímos o 'link' pelo 'caminhoArquivo' do R2
            },
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

      if (!detailsProcesso) {
        throw new Error("Processo não encontrado.");
      }

      // =========================================================================
      // GERAÇÃO DE LINKS SEGUROS PARA OS ANEXOS
      // =========================================================================

      // Mapeia os anexos para gerar as URLs temporárias de forma simultânea
      const anexosComLinksTemporarios = await Promise.all(
        detailsProcesso.anexosProcesso.map(async (anexo) => {
          let urlSegura = "";

          if (anexo.caminhoArquivo) {
            // Gera o link válido por 1 hora usando a função que criamos no storageService
            urlSegura = await getSecureUrl(anexo.caminhoArquivo);
          }

          return {
            id: anexo.id,
            nome: anexo.nome,
            url: urlSegura, // O front-end vai usar essa propriedade 'url' para o href do botão de download
          };
        }),
      );

      // Retorna o objeto do processo original, mas com a lista de anexos atualizada com as URLs prontas
      return {
        ...detailsProcesso,
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
