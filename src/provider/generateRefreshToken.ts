import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const client = new PrismaClient();

class GenerateRefreshToken {
  async execute(usuarioId: string) {
    // Define a expiração para 6 meses (M) a partir de agora em formato Unix Timestamp
    const expiresIn = dayjs().add(6, "M").unix();

    try {
      const refreshToken = await client.refreshToken.create({
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
