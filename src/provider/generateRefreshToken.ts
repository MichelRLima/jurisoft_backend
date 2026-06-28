import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
// 1. Importa a instância padrão do banco de dados centralizado
import { prisma } from "../shared/database/prisma";

class GenerateRefreshToken {
  // Recebe o tx (Prisma.TransactionClient) como segundo parâmetro opcional
  async execute(usuarioId: string, tx?: Prisma.TransactionClient) {
    const expiresIn = dayjs().add(6, "M").unix();

    // Se o tx da transação existir, usamos ele. Caso contrário, usamos o prisma global.
    const prismaExecutor = tx || prisma;

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
