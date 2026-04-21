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
      /* const formtAllProcessos = allProcessos.map((processo) => {
  return {
    id: processo.id,
    numeroProcesso: processo.numeroProcesso,
    clienteName: processo.clienteName,
    numeroDoc: processo.numeroDoc,
    contato: processo.contato,
    email: processo.email,
    descricao: processo.descricao,
    status: processo.status,
    usuarioCriação: processo.usuario,
    rlUsuarioPrcessos: processo.rlUsuarioPrcessos,
  };
})
 */
      return allProcessos;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new GetAllPrcessos();
