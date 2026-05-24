import { PrismaClient } from "@prisma/client";

import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class DeleteCliente {
  async execute(clienteId: string) {
    try {
      if (!clienteId) {
        throw new Error("Necessário informar um cliente");
      }

      await prisma.clientes.delete({
        where: {
          id: clienteId,
        },
      });

      logger.info(`Cliente excluido com sucesso!`);
      return { menssege: "Cliente excluido com sucesso" };
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new DeleteCliente();
