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
        },
      });

      const format = allProcessos.map((processo) => {
        return {
          ...processo,
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

      return format;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new GetAllPrcessos();
