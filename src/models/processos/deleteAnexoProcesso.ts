import { PrismaClient } from "@prisma/client";
import googleDeleteFile from "../googleDrive/googleDeleteFile";
import logger from "../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class DeleteAnexoProcesso {
  async execute(anexoId: string) {
    try {
      const firstAnexo = await prisma.anexosProcesso.findUnique({
        where: {
          id: anexoId,
        },
      });

      if (!firstAnexo) {
        throw new Error("Anexo nao encontrado");
      }
      const deleteDrive = await googleDeleteFile.execute(
        firstAnexo.anexoDriveId,
      );

      const response = await prisma.anexosProcesso.delete({
        where: {
          id: firstAnexo.id,
        },
      });
      logger.info(`Anexo deletado com sucesso!`);
      return { menssege: "Anexo deletado com sucesso" };
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new DeleteAnexoProcesso();
