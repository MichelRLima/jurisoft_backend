import { PrismaClient } from "@prisma/client";
import { Cliente } from "../../types/cliente";
import logger from "../../utils/logger/logger";

const prisma = new PrismaClient();
class EditCliente {
  async execute(dataCliente: Cliente, clienteId: string) {
    try {
      if (!dataCliente?.nome || !dataCliente?.documento) {
        throw new Error(
          "Necessário preencher campos obrigatórios (nome e documento)",
        );
      }

      const response = await prisma.clientes.update({
        where: {
          id: clienteId,
        },
        data: {
          nome: dataCliente?.nome?.trim(),
          documento: dataCliente?.documento?.trim(),
          contato: dataCliente?.contato?.trim(),
          email: dataCliente?.email?.trim(),
          cep: dataCliente?.cep?.trim(),
          logradouro: dataCliente?.rua?.trim(),
          numero: dataCliente?.numero?.trim(),
          complemento: dataCliente?.complemento?.trim(),
          bairro: dataCliente?.bairro?.trim(),
          cidade: dataCliente?.cidade?.trim(),
          estado: dataCliente?.estado?.trim(),
        },
      });
      logger.info(`Cliente criado com sucesso!`);
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new EditCliente();
