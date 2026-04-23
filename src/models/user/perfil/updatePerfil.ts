import { PrismaClient } from "@prisma/client";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const client = new PrismaClient();

class UpdatePerfil {
  async execute(
    foto: string,
    nome: string,
    sobrenome: string,
    email: string,
    telefone: string,
    usuarioId: string,
  ) {
    try {
      // Usando transação apenas se você for reativar os logs depois.
      // Se for apenas o upsert, o transactionClient não é estritamente necessário.
      const result = await client.$transaction(async (transactionClient) => {
        const updateUser = await transactionClient.usuario.update({
          where: {
            id: usuarioId,
          },
          data: {
            email,
          },
        });
        // Se o usuarioId for @unique no schema.prisma, você pode fazer o upsert direto nele
        const updatePerfil = await transactionClient.perfil.upsert({
          where: {
            // Se usuarioId for único, use: usuarioId: usuarioId
            // Se não for, precisamos buscar o ID primeiro como você fez
            usuarioId: usuarioId,
          },
          create: { foto, nome, sobrenome, telefone, usuarioId },
          update: { foto, nome, sobrenome, telefone },
        });

        return { updatePerfil };
      });

      return result;
    } catch (error: any) {
      if (!error.path) {
        error.path = "src/models/internal/perfil/updatePerfil.ts";
      }
      throw error;
    } finally {
      await client.$disconnect();
    }
    // Removido o $disconnect daqui
  }
}

export default new UpdatePerfil();
