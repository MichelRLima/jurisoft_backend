import { PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken";
import dayjs from "dayjs";

const prisma = new PrismaClient();

class RefreshTokenUser {
  async execute(refresh_token: string) {
    try {
      console.log(
        "############################## ACIONANDO REFRASH TOKEN ################################",
      );

      if (!refresh_token) {
        throw Object.assign(new Error("Refresh token é obrigatório"), {
          status: 400,
        });
      }

      // 1. Verifica se o Refresh Token existe na nossa tabela
      const refreshTokenExists = await prisma.refreshToken.findFirst({
        where: { id: refresh_token },
      });

      if (!refreshTokenExists) {
        throw Object.assign(
          new Error("Refresh Token inválido ou não encontrado"),
          { status: 401 },
        );
      }

      // 2. Verifica se o Refresh Token (a Identidade) já expirou
      // O dayjs.unix() transforma o Int salvo no banco em uma data real
      const isExpired = dayjs().isAfter(
        dayjs.unix(refreshTokenExists.expiresIn),
      );

      if (isExpired) {
        // Se a identidade expirou, apagamos ela do banco por segurança
        await prisma.refreshToken.deleteMany({
          where: { usuarioId: refreshTokenExists.usuarioId },
        });
        throw Object.assign(
          new Error("Refresh Token expirado. Faça login novamente."),
          { status: 401 },
        );
      }

      // 3. O Refresh Token é válido! Vamos gerar um novo Access Token (Crachá)
      const secret = process.env.JWT_SECRET || "sua_chave_secreta_aqui";
      const token = sign({}, secret, {
        subject: refreshTokenExists.usuarioId,
        expiresIn: "15m", // Dura pouco tempo por segurança
      });

      // 4. ROTATIVIDADE (Segurança Avançada)
      // Apagamos o Refresh Token que acabou de ser usado...
      // await prisma.refreshToken.delete({
      //   where: { id: refresh_token },
      // });

      // // ... e criamos um novo para o usuário usar da próxima vez (válido por mais 30 dias)
      // const novoExpiresIn = dayjs().add(30, "days").unix();
      // const novoRefreshToken = await prisma.refreshToken.create({
      //   data: {
      //     usuarioId: refreshTokenExists.usuarioId,
      //     expiresIn: novoExpiresIn,
      //   },
      // });

      // Devolvemos o Crachá (token) e a nova Identidade (refreshToken)
      return { token, refreshToken: refreshTokenExists };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new RefreshTokenUser();
