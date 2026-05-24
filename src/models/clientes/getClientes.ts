import { PrismaClient } from "@prisma/client";

import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class GetClientes {
  async execute() {
    try {
      const response = await prisma.clientes.findMany();
      logger.info(`Clientes buscados com sucesso!`);
      return response;
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new GetClientes();
