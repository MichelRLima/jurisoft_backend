import { PrismaClient } from "@prisma/client";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class DeleteProcesso {
  async execute(processoId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }
      const response = await prisma.processos.delete({
        where: {
          id: processoId,
        },
      });
      return { menssege: "Processo deletado com sucesso" };
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new DeleteProcesso();
