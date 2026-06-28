import { prisma } from "../../shared/database/prisma";

const limitePlanoGb = process.env.LIMITE_PLANO_GB;
const limiteTotalBytes = limitePlanoGb
  ? Number(limitePlanoGb) * 1024 * 1024 * 1024
  : 2147483648; // Fallback global de 2GB se não definido

class FindArmazenamento {
  async execute() {
    try {
      // Agregação considerando apenas anexos cujos processos NÃO foram excluídos
      const agregacao = await prisma.anexosProcesso.aggregate({
        where: {
          processo: {
            deletedAt: null, // Filtra removendo os arquivos que pertencem à lixeira
          },
        },
        _sum: {
          tamanho: true,
        },
      });

      const espacoUtilizadoBytes = agregacao._sum.tamanho || 0;
      const espacoDisponivelBytes = Math.max(
        0,
        limiteTotalBytes - espacoUtilizadoBytes,
      );

      const percentualUso = Number(
        ((espacoUtilizadoBytes / limiteTotalBytes) * 100).toFixed(2),
      );

      return {
        limiteTotalBytes,
        espacoUtilizadoBytes,
        espacoDisponivelBytes,
        percentualUso,
      };
    } catch (error) {
      console.error("Erro ao buscar armazenamento global:", error);
      throw error;
    }
  }
}

export default new FindArmazenamento();
