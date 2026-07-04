import { prisma } from "../../shared/database/prisma";

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
          esfera: true,
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
