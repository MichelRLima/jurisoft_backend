import { Request, Response } from "express";
import updatePerfil from "../../../models/user/perfil/updatePerfil";
import updateSenha from "../../../models/user/perfil/updateSenha";
import uploadFotoPerfil from "../../../models/superBase/uploadFotoPerfil";

class UpdatePerfilCOntroller {
  async handle(req: Request, res: Response) {
    try {
      const { foto, nome, sobrenome, email, telefone, novaSenha } = req.body;

      const usuarioId = req.headers["x-user-id"] as string;
      let linkFoto = "";
      if (foto) {
        linkFoto = await uploadFotoPerfil.execute(foto);
      }

      const response = await updatePerfil.execute(
        linkFoto,
        nome,
        sobrenome,
        email,
        telefone,
        usuarioId,
      );
      if (novaSenha) {
        await updateSenha.execute(usuarioId, novaSenha);
      }

      res.status(200).json(response.updatePerfil);
    } catch (error: any) {
      if (!error.path) {
        error.path =
          "src/controllers/internal/perfil/updatePerfilClienteController.js";
      }
      throw error;
    }
  }
}

export default new UpdatePerfilCOntroller();
