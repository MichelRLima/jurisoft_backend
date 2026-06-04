import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class FindLogs {
  async execute(usuarioId: string) {
    try {
      if (!usuarioId) {
        throw new Error("Usuário não identificado");
      }

      const response = await prisma.auditLog.findMany({
        // 1. Traz os mais recentes primeiro
        orderBy: {
          createdAt: "desc",
        },
        // 2. Faz o JOIN para pegar o nome e foto de quem executou a ação
        include: {
          ator: {
            select: {
              email: true,
              login: true,
              perfil: {
                select: {
                  nome: true,
                  sobrenome: true,
                  foto: true,
                },
              },
            },
          },
        },
      });

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new FindLogs();
