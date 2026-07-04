import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Inicializa o Resend com a chave do seu .env
const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailProps {
  to: string;
  login: string;
  pass: string;
  frontendLink: string;
}

export const sendWelcomeEmail = async ({
  to,
  login,
  pass,
  frontendLink,
}: WelcomeEmailProps): Promise<void> => {
  console.log("---------------", frontendLink);

  // O Resend retorna os dados de sucesso ou a mensagem de erro da API
  const { data, error } = await resend.emails.send({
    from: "JuSoft <naoresponda@jusoft.com.br>", // Mantive o domínio de envio configurado
    to: to,
    subject: "Bem-vindo(a) ao JuSoft! Seus dados de acesso 🚀",
    html: `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f4f7f9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">JuSoft</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #334155; font-size: 22px; margin-top: 0; text-align: center;">Bem-vindo(a) ao JuSoft! 🎉</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: justify;">
              Olá! Seja muito bem-vindo(a). O sistema foi pensado para otimizar sua rotina jurídica com segurança e praticidade. Para começar com o pé direito, separamos algumas informações importantes:
            </p>
            
            <div style="margin: 30px 0;">
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px; text-align: justify;">
                💻 <strong>Experiência de Uso:</strong> Desenvolvido para funcionar em qualquer dispositivo. No entanto, devido ao volume de dados, a navegação em telas pequenas pode ser limitada. Para uma experiência completa, recomendamos o uso em computadores ou notebooks.
              </p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px; text-align: justify;">
                🔒 <strong>Organização e Privacidade:</strong> O sistema opera de forma segmentada. Você visualizará apenas os processos criados por você ou aqueles em que foi adicionado(a) como responsável.
              </p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px; text-align: justify;">
                ⚙️ <strong>Permissões Administrativas:</strong> Usuários com a permissão <strong>ADVOGADO</strong> possuem acesso total ao sistema, podendo gerenciar configurações gerais, criar e editar clientes, processos e novos usuários.
              </p>
            </div>
            
            <div style="margin: 32px 0; padding: 24px; background-color: #f1f5f9; border-radius: 8px; border: 1px dashed #cbd5e1;">
              <h3 style="margin-top: 0; color: #1e293b; font-size: 18px; text-align: center;">Seus dados para o primeiro acesso</h3>
              
              <div style="margin-top: 20px; text-align: center;">
                <p style="margin: 8px 0; color: #334155; font-size: 16px;">👤 <strong>Login:</strong> ${login}</p>
                <p style="margin: 8px 0; color: #334155; font-size: 16px;">🔑 <strong>Senha provisória:</strong> ${pass}</p>
              </div>

              <div style="text-align: center; margin-top: 32px;">
                <a href="${frontendLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                  Acessar o JuSoft
                </a>
              </div>
            </div>
            
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5;">
              Michel Rocha | Equipe JuSoft
            </p>
          </div>
          
        </div>
      </div>
    `,
  });

  // Tratamento de erro
  if (error) {
    console.error("Erro ao disparar e-mail de boas-vindas no Resend:", error);
    throw new Error("Falha no envio do e-mail de boas-vindas.");
  }

  console.log("E-mail de boas-vindas enviado com sucesso. ID:", data?.id);
};
