import { PrismaClient } from "@prisma/client";
import deleteFotoPerfil from "../../superBase/deleteFotoPerfil";
import uploadFotoPerfil from "../../superBase/uploadFotoPerfil";
import logger from "../../../utils/logger/logger";
import googlePermissionFolder from "../../googleDrive/googlePermissionFolder";

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

      if (email !== firstUser?.email) {
        logger.debug(
          `Alteração de e-mail identificada. Atualizando permissões de pastas do Drive...`,
        );

        const permissoesDrive = await prisma.permissaoDrive.findMany({
          where: {
            usuarioId: firstUser?.id,
          },
        });

        const paraEmail = email; // ou updateUser?.email

        // Funçao auxiliar para processar cada item com concorrência limitada
        // Se você não tiver o 'p-map' instalado, pode usar este padrão de pool:
        const CONCURRENCY_LIMIT = 5;
        const items = [...permissoesDrive];
        const results = [];

        const execLimit = async () => {
          while (items.length > 0) {
            const item = items.shift();
            if (!item) break;

            const task = (async (permissao) => {
              try {
                logger.info(`Processando pasta: ${permissao.pastaDriveId}`);

                // 1. Adiciona permissão ao novo e-mail
                // Importante: Adicionamos antes de remover para garantir que o acesso não seja perdido em caso de erro no meio do processo
                const novaPermissao =
                  await googlePermissionFolder.addPermission(
                    permissao.pastaDriveId,
                    paraEmail,
                    "writer", // ou o nível de acesso padrão do seu app
                  );

                if (!novaPermissao || !novaPermissao.id) {
                  throw new Error("Erro ao adicionar permissão ao novo e-mail");
                }

                // 2. Remove a permissão do e-mail antigo
                // Note que usamos o permissaoId que você já tem no banco
                await googlePermissionFolder.removePermission(
                  permissao.pastaDriveId,
                  permissao.permissaoId,
                );

                // 3. Atualiza o banco de dados com o novo ID de permissão do Google
                await prisma.permissaoDrive.update({
                  where: { id: permissao.id },
                  data: {
                    permissaoId: novaPermissao.id,
                    updatedAt: new Date(),
                  },
                });

                return { id: permissao.id, status: "success" };
              } catch (error) {
                logger.error(
                  `Erro ao atualizar pasta ${permissao.pastaDriveId}:`,
                  error,
                );
              }
            })(item);

            results.push(task);
            await task;
          }
        };

        // Cria 5 "trabalhadores" simultâneos
        const workers = Array(CONCURRENCY_LIMIT)
          .fill(null)
          .map(() => execLimit());

        await Promise.all(workers);

        logger.info(
          `Finalizada atualização de permissões: ${results.length} processadas.`,
        );
      }
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
