import { PrismaClient } from "@prisma/client";
import googleDeleteFile from "../googleDrive/googleDeleteFile";
import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();
class EditProcesso {
  async execute(processo: object) {
    try {
      console.log(processo);

      return;

      logger.info(`Processo deletado com sucesso!`);
      return { menssege: "Processo deletado com sucesso" };
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new EditProcesso();
