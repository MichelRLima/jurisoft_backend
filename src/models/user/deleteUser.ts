import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // 1. Adicionada a referência do bucket

class DeleteUser {
  async execute(userId: string) {
    try {
      if (!userId) {
        throw new Error("Usuário não informado");
      }
      const user = await prisma.usuario.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new Error("Usuário não encontrado");
      }
      await prisma.usuario.delete({
        where: {
          id: userId,
        },
      });
      return { message: "Usuário deletado com sucesso!" };
    } catch (error) {
      console.error(error);
      throw error; // Importante manter o throw para o Controller capturar o status 500
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new DeleteUser();
