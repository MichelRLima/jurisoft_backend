import logger from "../../utils/logger/logger";
import { prisma } from "../../shared/database/prisma";

class GetClientes {
  async execute(usuarioId: string) {
    try {
      if (!usuarioId) {
        throw new Error("Usuário não encontrado!");
      }
      const response = await prisma.clientes.findMany({
        select: {
          id: true,
          nome: true,
          documento: true,
          _count: {
            select: {
              // Em vez de passar apenas 'true', nós abrimos um objeto e passamos o where
              processos: {
                where: {
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
              },
            },
          },
        },
      });

      const format = response?.map((item) => {
        return {
          ...item,
          processos: item?._count?.processos || 0,
        };
      });
      logger.info(`Clientes buscados com sucesso!`);
      return format;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}

export default new GetClientes();
