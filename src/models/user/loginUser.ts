import bcrypt from "bcryptjs";
// Importe o prismaBase para fazer a transação pura
import { prisma, prismaBase } from "../../shared/database/prisma";
import generateTokenProvider from "../../provider/generateTokenProvider";
import generateRefreshToken from "../../provider/generateRefreshToken";

class LoginUser {
  async execute(login: string, senha: string) {
    try {
      // Pode manter o prisma normal aqui, pois a tabela usuário não tem extensão
      const userAlreadyExists = await prisma.usuario.findUnique({
        where: { login: login },
      });

      if (!userAlreadyExists) {
        throw Object.assign(new Error("User or password incorrect!"), {
          status: 401,
        });
      }

      const passwordMatch = await bcrypt.compare(
        senha,
        userAlreadyExists.senha ?? "",
      );

      if (!passwordMatch) {
        throw Object.assign(new Error("User or password incorrect!"), {
          status: 401,
        });
      }

      // 👇 MUDE AQUI: Use prismaBase para gerar um `tx` do tipo Prisma.TransactionClient puro
      const response = await prismaBase.$transaction(async (tx) => {
        const token = await generateTokenProvider.execute(userAlreadyExists.id);

        await tx.refreshToken.deleteMany({
          where: { usuarioId: userAlreadyExists.id },
        });

        // Agora o TypeScript aceita perfeitamente o repasse do tx
        const refreshToken = await generateRefreshToken.execute(
          userAlreadyExists.id,
          tx,
        );

        return { token, refreshToken };
      });

      return response;
    } catch (error: any) {
      console.error(error);
      error.path = "src/models/internal/auth/authUser.ts";
      throw error;
    }
  }
}

export default new LoginUser();
