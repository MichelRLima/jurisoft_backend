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
        throw new Error("Usuário não encontrado");
      }
      if (email !== firstUser?.email) {
        logger.debug(
          `Alteração de e-mail identificada. Verificando se o email ja foi cadastrado no sistema`,
        );

        const emailExists = await prisma.usuario.findUnique({
          where: {
            email: email,
          },
        });

        if (emailExists) {
          throw Object.assign(
            new Error("Este e-mail já está vinculado a um usuário."),
            {
              status: 409,
            },
          );
        }
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
      const updateUser = await prisma.usuario.update({
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

      if (!updateUser) {
        throw new Error("Usuario nao encontrado");
      }
      const user = await prisma.usuario.findUnique({
        where: {
          id: firstUser?.id,
        },
        include: {
          perfil: true,
        },
      });

      const format = {
        email: user?.email,
        nome: user?.perfil[0]?.nome,
        sobrenome: user?.perfil[0]?.sobrenome,
        telefone: user?.perfil[0]?.telefone,
        foto: user?.perfil[0]?.foto,
      };

      return format;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new UpdateUser();
