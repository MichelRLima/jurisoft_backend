import { PrismaClient } from "@prisma/client";
import googleCreateFolder from "../googleDrive/googleCreateFolder";
import logger from "../../utils/logger/logger";
import googleUploadFile from "../googleDrive/googleUploadFile";
import googlePermissionFolder from "../googleDrive/googlePermissionFolder";
import { log } from "console";

// Definimos o que o Model espera receber
interface CreateProcessoRequest {
  processo: any;
  files: Express.Multer.File[];
  usuarioId: string;
}

const prisma = new PrismaClient();
function formatarProcesso(numero: string) {
  // Remove qualquer caractere que não seja número, caso a entrada venha suja
  const limpo = numero.replace(/\D/g, "");

  // Verifica se tem os 20 dígitos necessários
  if (limpo.length !== 20) {
    return "Número inválido (deve conter 20 dígitos)";
  }

  // Aplica a máscara: NNNNNNN-DD.AAAA.J.TR.OOOO
  return limpo.replace(
    /^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/,
    "$1-$2.$3.$4.$5.$6",
  );
}

class CreateProcesso {
  // Tipamos o objeto de entrada
  async execute({ processo, files = [], usuarioId }: CreateProcessoRequest) {
    try {
      if (
        !processo?.clienteName ||
        !processo?.numeroDoc ||
        !processo?.numeroProcesso ||
        !processo?.status ||
        !processo?.descricao
      ) {
        throw new Error("Dados insuficientes para abertura de processo");
      }

      const userCreate = await prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },
      });

      if (!userCreate || !userCreate?.email) {
        throw new Error("Usuário nao encontrado ou sem email");
      }

      const pastaName = `Processo: ${formatarProcesso(processo?.numeroProcesso)} - ${processo?.clienteName}`;
      logger.debug(`Criando pasta do processo: ${pastaName}`);
      const pastaDrive = await googleCreateFolder.execute(pastaName);
      if (!pastaDrive || !pastaDrive.id) {
        throw new Error(
          "Falha ao criar pasta no Google Drive. O processo não pode ser salvo.",
        );
      }
      logger.info(`Pasta criada no Google Drive: ${pastaDrive.id}`);
      logger.debug(
        "Adicionando permissão de compartilhamento para o usuário de criação do processo:" +
          userCreate.email,
      );

      const responseDrivePermissao = await googlePermissionFolder.addPermission(
        pastaDrive.id,
        userCreate.email,
        "writer",
      );

      if (!responseDrivePermissao?.id) {
        throw new Error(
          "Falha ao adicionar permissão de compartilhamento. O processo não pode ser salvo.",
        );
      }

      logger.info(
        `Permissão de compartilhamento adicionada para: ${userCreate.email}`,
      );

      await Promise.all(
        files.map(async (file) => {
          // Verificação explícita dentro do novo escopo
          if (!pastaDrive?.id) {
            throw new Error("ID da pasta não encontrado para o upload.");
          }

          logger.debug(`Upload do arquivo ${file.originalname}`);
          return googleUploadFile.execute(file, pastaDrive.id); // Agora ele aceita!
        }),
      );

      logger.debug(`Criando processo no banco de dados`);
      const newProcesso = await prisma.processos.create({
        data: {
          numeroProcesso: processo.numeroProcesso,
          clienteName: processo.clienteName,
          numeroDoc: processo.numeroDoc,
          descricao: processo.descricao,
          contato: processo.contato,
          email: processo.email,
          idPastaDrive: pastaDrive?.id,
          usuario: {
            connect: {
              id: userCreate?.id,
            },
          },
          status: {
            connect: {
              codigoStatus: processo.status,
            },
          },
        },
      });
      logger.debug(`Processo criado no banco de dados: ${newProcesso.id}`);

      logger.debug(`Criando permissão de acesso ao processo no banco de dados`);
      await prisma.permissaoDrive.create({
        data: {
          idPastaDrive: pastaDrive.id,
          idPermissao: responseDrivePermissao.id,
          usuarioId: userCreate.id,
        },
      });
      logger.debug(`Permissão de acesso ao processo criado no banco de dados`);

      logger.debug(`Finalizado abertura do processo: ${newProcesso.id}`);

      return { success: true, message: "Processo recebido com sucesso" };
    } catch (error) {
      console.error("Erro no Model:", error);
      throw error;
    }
  }
}

export default new CreateProcesso();
