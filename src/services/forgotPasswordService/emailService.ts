import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendRecoveryEmail = async (
  to: string,
  code: string,
): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: "Código de Recuperação de Senha",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Recuperação de Senha</h2>
        <p>Olá! Você solicitou a redefinição de sua senha. Use o código de 4 dígitos abaixo para prosseguir:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 4px; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; color: #1976d2; letter-spacing: 10px;">
            ${code}
          </span>
        </div>
        
        <p style="font-size: 13px; color: #666; text-align: center;">
          Este código é válido por <b>10 minutos</b> e permite no máximo <b>3 tentativas</b>.
          Se não foi você quem solicitou, pode ignorar este e-mail com segurança.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
