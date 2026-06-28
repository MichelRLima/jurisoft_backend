import { prisma } from "../../shared/database/prisma";

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
