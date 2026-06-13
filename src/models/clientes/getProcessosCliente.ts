import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class GetProcessosCliente {
  async execute(clienteId: string, usuarioId: string) {
    try {
      if (!clienteId) {
        throw new Error("Necessário informar um cliente");
      }
      if (!usuarioId) {
        throw new Error("Necessário informar o usuário");
      }

      const allProcessos = await prisma.processos.findMany({
        where: {
          // 1. Garante que vai trazer apenas os processos deste cliente específico
          clienteId: clienteId,

          // 2. Garante que o usuário logado tem acesso a este processo
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
          cliente: {
            select: {
              id: true,
              nome: true,
              documento: true,
            },
          },
          _count: {
            select: {
              anexosProcesso: true,
              prazos: true,
              atualizacoes: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Mapeamento síncrono montando as URLs públicas das fotos
      const format = allProcessos.map((processo) => {
        // 1. Formata a foto do Usuário de Criação
        const uCriacao = processo.usuarioCriacao;
        const uPerfil = uCriacao?.perfil;
        const uFotoUrl = uPerfil?.foto
          ? `${R2_PUBLIC_URL}/${uPerfil.foto}`
          : "";

        const usuarioCriacaoFormatado = uCriacao
          ? {
              ...uCriacao,
              perfil: uPerfil
                ? {
                    ...uPerfil,
                    foto: uFotoUrl, // Link estático completo
                  }
                : null,
            }
          : null;

        // 2. Formata as fotos dos Usuários Responsáveis
        const usuariosResponsaveisFormatados =
          processo?.usuariosResponsaveis?.map((responsavel) => {
            const rUsuario = responsavel?.usuario;
            const rPerfil = rUsuario?.perfil;
            const rFotoUrl = rPerfil?.foto
              ? `${R2_PUBLIC_URL}/${rPerfil.foto}`
              : "";

            return {
              ...rUsuario,
              perfil: rPerfil
                ? {
                    ...rPerfil,
                    foto: rFotoUrl, // Link estático completo
                  }
                : null,
            };
          }) || [];

        return {
          ...processo,
          anexos: processo?._count?.anexosProcesso || 0,
          prazos: processo?._count?.prazos || 0,
          atualizacoes: processo?._count?.atualizacoes || 0,
          usuarioCriacao: usuarioCriacaoFormatado,
          usuariosResponsaveis: usuariosResponsaveisFormatados,
        };
      });

      logger.info(`Processos do cliente buscados com sucesso!`);
      return format;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new GetProcessosCliente();
