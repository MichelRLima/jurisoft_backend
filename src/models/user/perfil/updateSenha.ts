import { PrismaClient } from "@prisma/client";

import bcrypt from "bcryptjs";

const client = new PrismaClient();

class UpdateSenha {
  async execute(usuarioId: string, novaSenha: string) {
    try {
      const passwordHash = await bcrypt.hash(novaSenha, 8);

      const updateSenha = await client.usuario.update({
        where: { id: usuarioId },
        data: { senha: passwordHash },
      });

      return updateSenha;
    } catch (error: any) {
      error.path = "src/models/internal/auth/updateSenha.js";
      throw error;
      // ... tratamento de erros ...
    } finally {
      await client.$disconnect();
    }
  }
}

export default new UpdateSenha();
