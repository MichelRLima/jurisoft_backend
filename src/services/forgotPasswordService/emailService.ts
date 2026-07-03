import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Inicializa o Resend com a chave que ficará no seu .env
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendRecoveryEmail = async (
  to: string,
  code: string,
): Promise<void> => {
  // O Resend retorna os dados de sucesso ou a mensagem de erro da API
  const { data, error } = await resend.emails.send({
    from: "JuSoft <naoresponda@jusoft.com.br>",
    to: to,
    subject: "Código de Recuperação de Senha",
    html: `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f4f7f9; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">JuSoft</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #334155; font-size: 20px; margin-top: 0; text-align: center;">Recuperação de Senha</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: center;">
              Olá! Recebemos uma solicitação para redefinir o seu acesso. Utilize o código de segurança abaixo:
            </p>
            
            <!-- Code Box -->
            <div style="margin: 32px 0; padding: 24px; background-color: #f1f5f9; border-radius: 8px; text-align: center; border: 1px dashed #cbd5e1;">
              <span style="font-size: 42px; font-weight: 800; color: #2563eb; letter-spacing: 12px; display: inline-block; margin-left: 12px;">
                ${code}
              </span>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 0;">
              Este código é válido por <strong>10 minutos</strong> e permite no máximo <strong>3 tentativas</strong>.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5;">
              Se você não solicitou esta alteração, nenhuma ação é necessária. Sua conta continua segura.<br>
              Equipe JuSoft
            </p>
          </div>
          
        </div>
      </div>
    `,
  });

  // Tratamento de erro elegante
  if (error) {
    console.error("Erro ao disparar e-mail no Resend:", error);
    throw new Error("Falha no envio do e-mail de recuperação.");
  }

  console.log("E-mail de recuperação enviado com sucesso. ID:", data?.id);
};
