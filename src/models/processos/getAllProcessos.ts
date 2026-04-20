import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
class GetAllPrcessos {
  async execute() {
    try {
      const allProcessos = await prisma.processos.findMany({
        select: {
          id: true,
          numeroProcesso: true,
          clienteName: true,
          numeroDoc: true,
          contato: true,
          email: true,
          descricao: true,
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
          status: {
            select: {
              id: true,
              codigoStatus: true,
              nomeStatus: true,
            },
          },
          rlUsuarioPrcessos: {
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
        },
      });

      return allProcessos;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new GetAllPrcessos();
