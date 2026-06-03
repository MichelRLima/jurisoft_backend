import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
class FindPermissao {
  async execute() {
    try {
      const response = await prisma.permissoes.findMany({
        where: {
          tipo: {
            not: 2,
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

export default new FindPermissao();
