import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class GetAllPrcessos {
  async execute() {
    try {
      const allProcessos = await prisma.processos.findMany({
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
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Mapeamento síncrono e ultra-rápido dos dados
      const format = allProcessos.map((processo) => {
        // 1. Formata o Usuário de Criação (Gera link completo da foto se existir)
        const uCriacao = processo.usuarioCriacao;
        const uPerfil = uCriacao?.perfil?.[0];
        const uFotoUrl = uPerfil?.foto
          ? `${R2_PUBLIC_URL}/${uPerfil.foto}`
          : "";

        const usuarioCriacaoFormatado = uCriacao
          ? {
              ...uCriacao,
              perfil: uPerfil
                ? {
                    ...uPerfil,
                    foto: uFotoUrl, // Substitui pelo link estático completo
                  }
                : null,
            }
          : null;

        // 2. Formata a lista de Usuários Responsáveis (Gera link completo para cada um)
        const usuariosResponsaveisFormatados =
          processo?.usuariosResponsaveis?.map((responsavel) => {
            const rUsuario = responsavel?.usuario;
            const rPerfil = rUsuario?.perfil?.[0];
            const rFotoUrl = rPerfil?.foto
              ? `${R2_PUBLIC_URL}/${rPerfil.foto}`
              : "";

            return {
              ...rUsuario,
              perfil: rPerfil
                ? {
                    ...rPerfil,
                    foto: rFotoUrl, // Substitui pelo link estático completo
                  }
                : null,
            };
          }) || [];

        return {
          ...processo,
          anexos: processo?._count?.anexosProcesso || 0,
          usuarioCriacao: usuarioCriacaoFormatado,
          usuariosResponsaveis: usuariosResponsaveisFormatados,
        };
      });

      return format;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new GetAllPrcessos();
