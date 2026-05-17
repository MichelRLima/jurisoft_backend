import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendRecoveryEmail } from "../../services/forgotPasswordService/emailService";

const prisma = new PrismaClient();

class ForgotPassword {
  async execute(email: string) {
    try {
      // 1. Busca o usuário pelo e-mail
      const user = await prisma.usuario.findUnique({ where: { email } });

      if (!user) {
        // Retornamos sucesso fictício por segurança (evita enumeração de e-mails ativos)
        return {
          success: true,
          status: 200,
          message: "Se o e-mail estiver cadastrado, um código foi enviado.",
        };
      }

      // 2. Gera o código criptograficamente seguro de 4 dígitos (entre 1000 e 9999)
      const recoveryCode = crypto.randomInt(1000, 10000).toString();

      // 3. Define expiração para 10 minutos à frente
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // 4. Salva no banco e ZERA as tentativas anteriores
      await prisma.usuario.update({
        where: { email },
        data: {
          passwordResetCode: recoveryCode,
          passwordResetExpires: expiresAt,
          passwordResetAttempts: 0,
        },
      });

      // 5. Dispara o envio de e-mail através do serviço do Nodemailer
      await sendRecoveryEmail(email, recoveryCode);

      return {
        success: true,
        status: 200,
        message: "Código de recuperação enviado com sucesso!",
      };
    } catch (error) {
      console.error("Erro no ForgotPasswordService:", error);
      return {
        success: false,
        status: 500,
        error: "Erro interno no servidor ao gerar recuperação de senha.",
      };
    } finally {
      // Garante que a conexão com o banco seja encerrada adequadamente
      await prisma.$disconnect();
    }
  }
}

export default new ForgotPassword();
