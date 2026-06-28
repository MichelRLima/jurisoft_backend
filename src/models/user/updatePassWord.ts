import bcrypt from "bcryptjs";
import { prisma } from "../../shared/database/prisma";

class UpdatePassWord {
  async execute(usuarioId: string, password: string, newPassword: string) {
    try {
      const user = await prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },
      });
      if (!user) {
        throw new Error("Usuário não encontrado");
      }
      if (!user.senha) {
        throw new Error("Usuário sem senha");
      }
      const passwordMatch = await bcrypt.compare(password, user.senha);
      if (!passwordMatch) {
        throw new Error("Senha incorreta");
      }
      const passwordHash = await bcrypt.hash(newPassword, 8);
      await prisma.usuario.update({
        where: {
          id: user.id,
        },
        data: {
          senha: passwordHash,
        },
      });

      return null;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new UpdatePassWord();
