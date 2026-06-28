import { prisma } from "../../shared/database/prisma";

class ReadNotificacao {
  async execute(usuarioId: string) {
    try {
      if (!usuarioId) {
        throw new Error("Necessário informar o usuário");
      }
      const response = await prisma.rlNotificacaoUsuario.updateMany({
        where: {
          usuarioId: usuarioId,
        },
        data: {
          isRead: true,
        },
      });
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new ReadNotificacao();
