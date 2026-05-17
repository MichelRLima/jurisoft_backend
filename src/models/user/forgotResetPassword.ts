import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface ResetPasswordDTO {
  email: string;
  code: string;
  newPassword: string;
}

class ForgotResetPassword {
  async execute({ email, code, newPassword }: ResetPasswordDTO) {
    try {
      // 1. Busca o usuário e suas informações de recuperação
      const user = await prisma.usuario.findUnique({ where: { email } });

      // Verifica se existe uma solicitação ativa
      if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
        return {
          success: false,
          status: 400,
          error: "Nenhuma solicitação de recuperação ativa para este e-mail.",
        };
      }

      // 2. Valida se o código já expirou pelo tempo (10 minutos)
      const now = new Date();
      if (now > user.passwordResetExpires) {
        await prisma.usuario.update({
          where: { email },
          data: {
            passwordResetCode: null,
            passwordResetExpires: null,
            passwordResetAttempts: 0,
          },
        });
        return {
          success: false,
          status: 400,
          error: "O código expirou por tempo. Solicite um novo.",
        };
      }

      // 3. Valida se o limite de tentativas foi atingido ANTES de testar o código atual
      const currentAttempts = user.passwordResetAttempts || 0;
      if (currentAttempts >= 3) {
        await prisma.usuario.update({
          where: { email },
          data: {
            passwordResetCode: null,
            passwordResetExpires: null,
            passwordResetAttempts: 0,
          },
        });
        return {
          success: false,
          status: 400,
          error: "Limite de 3 tentativas excedido. Solicite um novo código.",
        };
      }
      console.log(user.passwordResetCode);
      console.log(code);

      // 4. Se o código digitado estiver INCORRETO:
      if (user.passwordResetCode !== code) {
        const nextAttempts = currentAttempts + 1;

        if (nextAttempts >= 3) {
          await prisma.usuario.update({
            where: { email },
            data: {
              passwordResetCode: null,
              passwordResetExpires: null,
              passwordResetAttempts: 0,
            },
          });
          return {
            success: false,
            status: 400,
            error:
              "Código incorreto. Limite de 3 tentativas atingido. Solicite um novo código.",
          };
        } else {
          await prisma.usuario.update({
            where: { email },
            data: { passwordResetAttempts: nextAttempts },
          });
          return {
            success: false,
            status: 400,
            error: `Código incorreto. Você tem mais ${3 - nextAttempts} tentativa(s).`,
          };
        }
      }

      // 5. Se o código estiver CORRETO, processa a alteração da senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.usuario.update({
        where: { email },
        data: {
          senha: hashedPassword, // Ajustado para coincidir com a coluna 'senha' do seu modelo
          passwordResetCode: null,
          passwordResetExpires: null,
          passwordResetAttempts: 0,
        },
      });

      return {
        success: true,
        status: 200,
        message: "Senha alterada com sucesso! Agora você já pode fazer login.",
      };
    } catch (error) {
      console.error("Erro no ResetPasswordService:", error);
      return {
        success: false,
        status: 500,
        error: "Erro interno ao redefinir senha.",
      };
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new ForgotResetPassword();
