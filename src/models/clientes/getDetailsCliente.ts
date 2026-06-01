import { PrismaClient } from "@prisma/client";

import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class GetDetailsCliente {
  async execute(clienteId: string) {
    try {
      if (!clienteId) {
        throw new Error("Necessário informar um cliente");
      }
      const response = await prisma.clientes.findUnique({
        where: {
          id: clienteId,
        },
      });

      if (!response) {
        throw new Error("Cliente não encontrado");
      }
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

export default new GetDetailsCliente();
