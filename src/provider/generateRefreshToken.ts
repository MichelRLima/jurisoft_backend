import { Prisma, PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const client = new PrismaClient();

class GenerateRefreshToken {
  // 💡 Recebe o tx (Prisma.TransactionClient) como segundo parâmetro opcional
  async execute(usuarioId: string, tx?: Prisma.TransactionClient) {
    const expiresIn = dayjs().add(6, "M").unix();

    // 💡 Se o tx existir, usa ele. Se não, usa o client padrão da classe.
    const prismaExecutor = tx || client;

    try {
      const refreshToken = await prismaExecutor.refreshToken.create({
        data: {
          usuarioId,
          expiresIn,
        },
      });

      return refreshToken;
    } catch (error) {
      console.error("Erro ao criar Refresh Token:", error);
      throw new Error("Não foi possível gerar o token de atualização.");
    }
  }
}

export default new GenerateRefreshToken();
