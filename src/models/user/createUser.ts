import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const createUser = {
  async execute(
    login: string,
    senha: string,
    email: string,
    permissaoId: string,
  ) {
    try {
      console.log("----", login, senha, email, permissaoId);

      const result = await prisma.$transaction(async (prisma) => {
        // verificar se usuario existe
        const userAlreadyExists = await prisma.usuario.findFirst({
          where: {
            OR: [{ login }, { email }],
          },
        });

        if (userAlreadyExists) {
          if (login === userAlreadyExists.login) {
            throw Object.assign(new Error("User already exists!"), {
              status: 409,
            });
          }
          //se existir pelo email ele entende que existe outra empresa que esta tentando cadastro a mesma pessoa
          if (email === userAlreadyExists.email) {
            throw Object.assign(new Error("Email already exists!"), {
              status: 409,
            });
          }
        }
        // Criptografa a senha
        const passwordHash = await bcrypt.hash(senha, 8);
        let responseUsuario = await prisma.usuario.create({
          data: {
            login: login,
            senha: passwordHash,
            email,
            status: 1,
          },
        });

        // Se selecionada permissão Adiciona ao usuário recem criado
        /*     if (permissaoId) {
          const permissaoUser = await prisma.rlPermissoesUsuario.create({
            data: {
              usuarioId: responseUsuario?.id,
              permissaoId: permissaoId,
            },
            include: { permissao: true },
          });
          responseUsuario = {
            ...responseUsuario,
            permissao: permissaoUser?.permissao?.codigoPermissao,
          };
        } */

        return responseUsuario;
      });

      return result;
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  },
};
