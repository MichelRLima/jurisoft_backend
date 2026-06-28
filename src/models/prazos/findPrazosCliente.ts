import { prisma } from "../../shared/database/prisma";

class FindPrazosCliente {
  async execute(usuarioId: string, clienteId: string) {
    try {
      const allProcesos = await prisma.processos.findMany({
        where: {
          clienteId: clienteId,
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
        },
      });
      let formattedPrazos;

      if (allProcesos?.length > 0) {
        // 1. Busca os prazos e inclui os relacionamentos necessários
        const allPrazos = await prisma.prazos.findMany({
          where: {
            processoId: {
              in: allProcesos.map((processo) => processo.id),
            },
          },
          include: {
            processo: {
              include: {
                cliente: true, // Garante que o nome do cliente venha junto
              },
            },
          },
          orderBy: {
            dataPrazo: "asc", // Ordena do mais próximo para o mais distante
          },
        });

        // 2. Formata o array para dar "match" com o modelo esperado pelo frontend
        formattedPrazos = allPrazos.map((prazo) => ({
          id: prazo.id,
          title: prazo.titulo,
          caseNumber: prazo.processo.numeroProcesso,
          clientName: prazo.processo.cliente.nome,
          deadlineDate: prazo.dataPrazo.toISOString(),
          taskType: prazo.tipo, // O Prisma já retornará a string do Enum ('peticao', 'audiencia', etc.)
          description: prazo.descricao,
          status: prazo.status, // Propriedade extra útil para o controle de isCompleted no Card
        }));
      }

      return formattedPrazos || [];
    } catch (error) {
      console.error("Erro ao buscar prazos do cliente", error);
      throw error;
    } finally {
    }
  }
}

export default new FindPrazosCliente();
