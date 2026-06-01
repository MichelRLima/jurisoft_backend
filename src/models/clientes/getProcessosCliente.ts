import { PrismaClient } from "@prisma/client";

import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class GetProcessosCliente {
  async execute(clienteId: string) {
    try {
      if (!clienteId) {
        throw new Error("Necessário informar um cliente");
      }

      const allProcessos = await prisma.processos.findMany({
        where: {
          clienteId: clienteId,
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
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const format = allProcessos.map((processo) => {
        return {
          ...processo,
          anexos: processo?._count?.anexosProcesso || 0,
          usuariosResponsaveis: processo?.usuariosResponsaveis?.map(
            (responsavel) => {
              return {
                ...responsavel?.usuario,
                perfil: responsavel?.usuario?.perfil?.[0],
              };
            },
          ),
        };
      });

      logger.info(`Clientes buscados com sucesso!`);
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
