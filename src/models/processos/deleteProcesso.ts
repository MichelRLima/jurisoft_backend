import { PrismaClient } from "@prisma/client";
import googleDeleteFile from "../googleDrive/googleDeleteFile";
import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class DeleteProcesso {
  async execute(processoId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }

      const processo = await prisma.processos.findUnique({
        where: {
          id: processoId,
        },
      });

      if (!processo) {
        throw new Error("Processo nao encontrado");
      }

      const deleteDrive = await googleDeleteFile.execute(processo.pastaDriveId);

      logger.info(`Pasta do drive excluida com sucesso!`);
      const response = await prisma.processos.delete({
        where: {
          id: processoId,
        },
      });
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

export default new DeleteProcesso();
