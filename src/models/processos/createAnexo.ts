import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import googleUploadFile from "../googleDrive/googleUploadFile";
const prisma = new PrismaClient();
class CreateAnexo {
  async execute(processoId: string, files: Express.Multer.File[]) {
    try {
      if (!files) {
        throw new Error("Nenhum anexo para salvar");
      }

      const processo = await prisma.processos.findUnique({
        where: {
          id: processoId,
        },
      });

      if (!processo) {
        throw new Error("Processo não encontrado");
      }

      logger.debug(`Identificado ${files?.length} arquivos para upload`);
      await Promise.all(
        files.map(async (file) => {
          // Verificação explícita dentro do novo escopo
          if (!processo?.pastaDriveId) {
            throw new Error("ID da pasta não encontrado para o upload.");
          }

          logger.debug(`Upload do arquivo ${file.originalname}`);
          const responseDriveUpload = await googleUploadFile.execute(
            file,
            processo?.pastaDriveId,
          );

          if (
            !responseDriveUpload?.id ||
            !responseDriveUpload?.name ||
            !responseDriveUpload?.webViewLink
          ) {
            throw new Error("Arquivo incosistente no Google Drive.");
          }
          const anexos = await prisma.anexosProcesso.create({
            data: {
              nome: responseDriveUpload?.name,
              anexoDriveId: responseDriveUpload?.id,
              processoId: processo.id,
              link: responseDriveUpload?.webViewLink,
            },
          });

          return anexos;
        }),
      );
      const anexos = await prisma.anexosProcesso.findMany({
        where: {
          processoId: processo.id,
        },
        select: {
          id: true,
          nome: true,
          link: true,
        },
      });
      return anexos;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new CreateAnexo();
