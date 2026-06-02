import { PrismaClient } from "@prisma/client";
import deleteFotoPerfil from "../../superBase/deleteFotoPerfil";
import uploadFotoPerfil from "../../superBase/uploadFotoPerfil";
import logger from "../../../utils/logger/logger";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

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

      const isBase64 = foto && foto.startsWith("data:");
      let caminhoFoto = firstUser?.perfil[0]?.foto || "";

      if (isBase64) {
        logger.debug(
          `Identificado nova foto do perfil. Realizando atualização...`,
        );

        // 1. Se o usuário já tinha uma foto antiga registrada, remove do R2 primeiro
        if (caminhoFoto) {
          await deleteFotoPerfil.execute(caminhoFoto);
        }

        // 2. Executa o upload passando a string base64 e a referência de pasta
        // (Usando o escritorioId se houver no seu schema, caso contrário, usa o próprio userId)

        caminhoFoto = await uploadFotoPerfil.execute(foto);

        logger.info(`Foto de perfil atualizada com sucesso!`);
      } else if (foto === "") {
        // Se a foto vier como string vazia, significa que o usuário removeu o avatar
        logger.debug(`Removendo foto de perfil atual do storage...`);
        if (caminhoFoto) {
          await deleteFotoPerfil.execute(caminhoFoto);
        }
        caminhoFoto = "";
      } else {
        logger.debug(`Foto de perfil não alterada.`);
      }

      // 3. Atualiza os dados no banco guardando apenas o caminho relativo
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
                foto: caminhoFoto, // Caminho relativo limpo (ex: escritorios/123/perfis/perfil_xxxx.jpg)
                nome,
                sobrenome,
                telefone,
              },
            },
          },
        },
        include: {
          perfil: true, // Já inclui o perfil atualizado para evitar o findUnique extra abaixo
        },
      });

      if (!updateUser) {
        throw new Error("Usuario nao encontrado");
      }

      // 4. Concatena a URL pública para fornecer o link estático direto para o front-end
      const urlFotoCompleta = updateUser?.perfil[0]?.foto
        ? `${R2_PUBLIC_URL}/${updateUser.perfil[0].foto}`
        : "";

      const format = {
        email: updateUser?.email,
        nome: updateUser?.perfil[0]?.nome,
        sobrenome: updateUser?.perfil[0]?.sobrenome,
        telefone: updateUser?.perfil[0]?.telefone,
        foto: urlFotoCompleta, // URL final estática pronta para o client-side (Ex: https://pub-...r2.dev/escritorios/...)
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
