import { PrismaClient } from "@prisma/client";

import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class GetClientes {
  async execute() {
    try {
      const response = await prisma.clientes.findMany({
        select: {
          id: true,
          nome: true,
          documento: true,
          _count: {
            select: {
              processos: true,
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
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new GetClientes();
