import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import generateTokenProvider from "../../provider/generateTokenProvider";
import generateRefreshToken from "../../provider/generateRefreshToken";
/* import { logLoginCliente } from "./logs/logLoginCliente"; */
/* import cache from "../../../cache";
 */
const client = new PrismaClient();

/* // Interface para o contador de falhas no cache
interface IFailureCounter {
  nTentativas: number;
  lastTry: number;
}
 */
// Interface para os dados do dispositivo (ajuste conforme sua biblioteca de detecção)
interface IDeviceData {
  browser: { name: string };
  os: { name: string };
}

class LoginUser {
  async execute(
    login: string,
    senha: string,
    /*   ipAddress: string, 
    deviceData: IDeviceData */
  ) {
    try {
      const tempoInicial = new Date().getTime();

      // Checa se o usuário existe
      const userAlreadyExists = await client.usuario.findFirst({
        where: { login },
      });

      if (!userAlreadyExists) {
        throw Object.assign(new Error("User or password incorrect!"), {
          status: 401,
        });
      }

      /*     // Verifica tentativas de login no cache
      const blockLogin = cache.get(`${userAlreadyExists.id}`) as IFailureCounter | undefined;
 */
      /*   if (blockLogin) {
        let timeDiff = (tempoInicial - blockLogin.lastTry) / 1000;
        timeDiff /= 60;
        timeDiff = Math.abs(Math.round(timeDiff));

        if (
          blockLogin.nTentativas >= 10 &&
          timeDiff < 5 &&
          blockLogin.nTentativas % 5 === 0
        ) {
          await logLoginCliente.execute(
            userAlreadyExists.id,
            ipAddress,
            0, // Status falha
            deviceData.browser.name,
            deviceData.os.name
          );

          const errorInfo = {
            error: "Too many requests",
            waitingTime: 5 - timeDiff,
          };
          
          throw Object.assign(new Error(JSON.stringify(errorInfo)), {
            status: 429,
          });
        }
      }
 */
      // Verificar senha
      const passwordMatch = await bcrypt.compare(
        senha,
        userAlreadyExists.senha ?? "", // Se for null, vira ""
      );

      /*      if (!passwordMatch) {
        const failureCounter: IFailureCounter = {
          nTentativas: blockLogin ? blockLogin.nTentativas + 1 : 1,
          lastTry: tempoInicial,
        };
        
       cache.set(`${userAlreadyExists.id}`, failureCounter, 3600);
 
        await logLoginCliente.execute(
          userAlreadyExists.id,
          ipAddress,
          0,
          deviceData.browser.name,
          deviceData.os.name
        );

        throw Object.assign(new Error("User or password incorrect!"), {
          status: 401,
        });
      } */

      // Transaction para garantir consistência
      const response = await client.$transaction(async (tx) => {
        const token = await generateTokenProvider.execute(userAlreadyExists.id);

        await tx.refreshToken.deleteMany({
          where: { usuarioId: userAlreadyExists.id },
        });

        const refreshToken = await generateRefreshToken.execute(
          userAlreadyExists.id,
        );

        /*  const logs = await logLoginCliente.execute(
          userAlreadyExists.id,
          ipAddress,
          1, // Sucesso
          deviceData.browser.name,
          deviceData.os.name
        ); */

        /*   cache.del(`${userAlreadyExists.id}`);
         */
        return { token, refreshToken };
      });

      return response;
    } catch (error: any) {
      error.path = "src/models/internal/auth/authUser.ts";
      throw error;
    } finally {
      await client.$disconnect();
    }
  }
}
export default new LoginUser();
