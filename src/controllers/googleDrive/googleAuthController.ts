import { Request, Response } from "express";
// Importe o Model que criamos no passo anterior
import GoogleAuthModel from "../../models/googleDrive/googleAuth";

class GoogleAuthController {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      // Chamamos o método execute do Model para obter a URL
      const url = await GoogleAuthModel.execute();

      // Redirecionamos o usuário para a página de login do Google
      res.redirect(url);
    } catch (error) {
      console.error("Erro no GoogleAuthController:", error);
      res.status(500).json({ error: "Erro ao gerar URL de autenticação" });
    }
  }
}

// Exportamos uma instância da classe
export default new GoogleAuthController();
