import { Request, Response } from "express";
import oauth2callback from "../../models/googleDrive/oauth2callback";

class GoogleCallbackController {
  async handle(req: Request, res: Response): Promise<void> {
    const { code } = req.query;

    if (!code) {
      res.status(400).send("Código de autorização não fornecido pelo Google.");
      return;
    }

    try {
      // Passa o código para o Model processar
      await oauth2callback.execute(code as string);

      // Retorna a resposta visual para o navegador
      res.send(
        "<h1>Autenticado!</h1><p>O token foi salvo. O servidor pode ser reiniciado sem perder a sessão.</p>",
      );
    } catch (error) {
      res.status(500).send("Erro ao obter token do Google");
    }
  }
}

export default new GoogleCallbackController();
