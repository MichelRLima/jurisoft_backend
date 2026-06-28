import logger from "../../utils/logger/logger";
import { prisma } from "../../shared/database/prisma";

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
    }
  }
}

export default new GetDetailsCliente();
