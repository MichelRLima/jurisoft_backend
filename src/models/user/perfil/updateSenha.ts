import { prisma } from "../../../shared/database/prisma";

import bcrypt from "bcryptjs";

class UpdateSenha {
  async execute(usuarioId: string, novaSenha: string) {
    try {
      const passwordHash = await bcrypt.hash(novaSenha, 8);

      const updateSenha = await prisma.usuario.update({
        where: { id: usuarioId },
        data: { senha: passwordHash },
      });

      return updateSenha;
    } catch (error: any) {
      error.path = "src/models/internal/auth/updateSenha.js";
      throw error;
    }
  }
}

export default new UpdateSenha();
