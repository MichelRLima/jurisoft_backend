import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class FindProcessosPrazos {
  async execute(usuarioId: string) {
    try {
      const processos = await prisma.processos.findMany({
        where: {
          OR: [
            {
              usuarioCriacaoId: usuarioId,
            },
            {
              usuariosResponsaveis: {
                some: {
                  usuarioId: usuarioId,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          numeroProcesso: true,
          cliente: {
            select: {
              nome: true,
              documento: true,
              id: true,
            },
          },
        },
      });
      return processos;
    } catch (error) {
      console.error("Erro ao buscar prazos do cliente", error);
      throw error;
    } finally {
    }
  }
}

export default new FindProcessosPrazos();
