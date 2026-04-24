import { PrismaClient } from "@prisma/client";
import { log } from "console";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
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
          clienteName: true,
          clienteDoc: true,
          contato: true,
          email: true,
          descricao: true,
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
              link: true,
            },
          },
        },
      });

      return detailsProcesso;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new GetDetailsProcesso();
