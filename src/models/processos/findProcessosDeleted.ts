import { prismaBase } from "../../shared/database/prisma";
import logger from "../../utils/logger/logger";

class FindProcessosDeleted {
  async execute(usuarioId: string) {
    try {
      if (!usuarioId) {
        throw new Error("Usuário não encontrado!");
      }

      // 1. Busca usando prismaBase para visualizar os registros com Soft Delete
      const processosDeletados = await prismaBase.processos.findMany({
        where: {
          deletedAt: {
            not: null, // Condição essencial: Traz APENAS o que está na lixeira
          },
          // Mantém a regra de visibilidade e segurança do seu sistema
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
          descricao: true,
          deletedAt: true, // Necessário para o cálculo de tempo no mapeamento
          cliente: {
            select: {
              id: true,
              nome: true,
              documento: true,
            },
          },
        },
        orderBy: {
          deletedAt: "desc", // Mostra o que foi jogado na lixeira mais recentemente no topo
        },
      });

      // 2. Mapeamento síncrono para calcular os dias restantes (Lógica de Retenção de 7 Dias)
      const formatados = processosDeletados.map((processo) => {
        // Como filtramos por not: null, sabemos que deletedAt existe aqui
        const dataDelecao = new Date(processo.deletedAt!);

        // Adiciona 7 dias exatos à data de exclusão
        const dataExpiracao = new Date(
          dataDelecao.getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        const agora = new Date();

        // Calcula a diferença em milissegundos e converte para dias (arredondando para cima)
        const diferencaTempo = dataExpiracao.getTime() - agora.getTime();
        const diasRestantes = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

        return {
          id: processo.id,
          numeroProcesso: processo.numeroProcesso,
          descricao: processo.descricao,
          deletadoEm: processo.deletedAt?.toISOString(),
          cliente: processo.cliente,
          // Se passou dos 7 dias e o Cron Job ainda não rodou, exibe 0 para não quebrar a tela
          diasParaExclusaoDefinitiva: diasRestantes > 0 ? diasRestantes : 0,
        };
      });

      return formatados;
    } catch (error) {
      logger.error("Erro no Model GetProcessosLixeira:", error);
      throw error;
    }
  }
}

export default new FindProcessosDeleted();
