import { Request, Response } from "express";
import updatePerfil from "../../../models/user/perfil/updatePerfil"; // Ajuste o nome conforme seu arquivo
import updateSenha from "../../../models/user/perfil/updateSenha";

class UpdatePerfilController {
  // Adicionamos o Promise<void> aqui para deixar o TypeScript feliz
  async handle(req: Request, res: Response): Promise<void> {
    try {
      const { foto, nome, sobrenome, email, telefone, novaSenha } = req.body;
      const usuarioId = req.headers["x-user-id"] as string;

      const response = await updatePerfil.execute(
        foto,
        nome,
        sobrenome,
        email,
        telefone,
        usuarioId,
      );

      if (novaSenha) {
        await updateSenha.execute(usuarioId, novaSenha);
      }

      // Removemos o 'return' daqui, apenas executamos o método
      res.status(200).json(response);
    } catch (error: any) {
      if (!error.path) {
        error.path =
          "src/controllers/internal/perfil/updatePerfilClienteController.js";
      }

      if (error.status) {
        // Removemos o 'return' daqui também
        res.status(error.status).json({ message: error.message });
      } else {
        console.error(error);
        // E daqui
        res
          .status(500)
          .json({ message: error.message || "Erro interno no servidor" });
      }
    }
  }
}

export default new UpdatePerfilController();
