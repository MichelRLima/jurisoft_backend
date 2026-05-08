import { PrismaClient } from "@prisma/client";
import deleteFotoPerfil from "../../superBase/deleteFotoPerfil";
import uploadFotoPerfil from "../../superBase/uploadFotoPerfil";
import logger from "../../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class UpdateUser {
  async execute(
    userId: string,
    foto: string,
    nome: string,
    sobrenome: string,
    email: string,
    telefone: string,
  ) {
    try {
      const firstUser = await prisma.usuario.findUnique({
        where: {
          id: userId,
        },
        include: {
          perfil: true,
        },
      });

      if (!firstUser) {
        throw new Error("Usuario nao encontrado");
      }
      const isBase64 = foto.startsWith("data:");
      let linkFoto = "";
      if (isBase64 && firstUser?.perfil[0]?.foto) {
        logger.debug(
          `Identificado nova foto do perfil. Realizando atualização...`,
        );
        await deleteFotoPerfil.execute(firstUser?.perfil[0]?.foto);
        linkFoto = await uploadFotoPerfil.execute(foto);
        logger.info(`Foto de perfil atualizada com sucesso!`);
      } else {
        logger.debug(`Foto de perfil não alterada.`);
        linkFoto = foto;
      }
      const response = await prisma.usuario.update({
        where: {
          id: userId,
        },
        data: {
          email,
          perfil: {
            update: {
              where: {
                id: firstUser?.perfil[0]?.id,
              },
              data: {
                foto: linkFoto,
                nome,
                sobrenome,
                telefone,
              },
            },
          },
        },
      });

      if (email !== firstUser?.email) {
        logger.debug(
          `Alteração de e-mail identificada. Realizado atualização de permissões de pastas...`,
        );
      }
      if (!response) {
        throw new Error("Usuario nao encontrado");
      }

      console.log(response);
    } catch (error) {
      console.error(error);
      // throw new Error(error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new UpdateUser();
