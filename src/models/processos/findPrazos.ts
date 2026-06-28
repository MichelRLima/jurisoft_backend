import { prisma } from "../../shared/database/prisma";

class FindPrazos {
  async execute(processoId: string) {
    try {
      if (!processoId) {
        throw new Error("Id do processo ausente.");
      }

      const prazos = await prisma.prazos.findMany({
        where: {
          processoId: processoId,
        },
        select: {
          id: true,
          titulo: true,
          dataPrazo: true,
          tipo: true,
          descricao: true,
          status: true,
          processo: {
            select: {
              numeroProcesso: true,
              cliente: {
                select: {
                  nome: true,
                  documento: true,
                },
              },
            },
          },
        },
        orderBy: {
          dataPrazo: "asc", // Ordena do mais próximo para o mais distante
        },
      });

      const prazosFormatados = prazos.map((prazo) => ({
        id: prazo.id,
        title: prazo.titulo,
        caseNumber: prazo.processo.numeroProcesso,
        clientName: prazo.processo.cliente?.nome || "",
        deadlineDate: prazo.dataPrazo.toISOString(),
        taskType: prazo.tipo,
        description: prazo.descricao,
        status: prazo.status,
      }));

      return prazosFormatados;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}

export default new FindPrazos();
