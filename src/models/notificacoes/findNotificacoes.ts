import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

class FindNotificacoes {
  async execute(usuarioId: string) {
    try {
      if (!usuarioId) {
        throw new Error("Dados inválidos");
      }

      // 1. Busca as notificações do usuário ordenadas das mais recentes para as mais antigas
      const notificacoesRaw = await prisma.rlNotificacaoUsuario.findMany({
        where: {
          usuarioId: usuarioId,
        },
        orderBy: {
          createdAt: "desc", // Garante que as novas apareçam no topo do Popover
        },
        take: 30, // Limite seguro para não estourar a memória com dados antigos
        select: {
          id: true, // Retornamos o ID do vínculo (RlNotificacaoUsuario) para facilitar o "marcar como lido" no futuro
          isRead: true,

          notificacao: {
            select: {
              descricao: true,
              createdAt: true,
              tipo: true,
              processo: {
                select: {
                  numeroProcesso: true,
                  id: true,
                },
              },
              usuarioAtor: {
                select: {
                  perfil: {
                    select: {
                      nome: true,
                      sobrenome: true,
                      foto: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // 2. Formata os dados estruturando exatamente como o frontend (React) espera
      const notificacoesFormatadas = notificacoesRaw.map((item) => {
        // Atalhos para facilitar a leitura do objeto
        const notif = item.notificacao;
        const perfilAtor = notif.usuarioAtor?.perfil;

        // Trata o nome (juntando nome + sobrenome)
        const nomeCompleto = perfilAtor
          ? `${perfilAtor.nome || ""} ${perfilAtor.sobrenome || ""}`?.trim()
          : null;

        // Monta o link final da foto concatenando com o seu R2 Cloudflare
        const fotoUrl = perfilAtor?.foto
          ? `${R2_PUBLIC_URL}/${perfilAtor.foto}`
          : null;

        return {
          id: item.id,
          isRead: item.isRead,
          tipo: notif.tipo,
          createdAt: notif.createdAt, // O Frontend no formato Date ou ISO resolverá isso
          descricao: notif.descricao,
          usuarioAtor: {
            nome: nomeCompleto,
            foto: fotoUrl,
          },
          processo: notif.processo
            ? {
                numeroProcesso: notif.processo.numeroProcesso,
                id: notif.processo.id,
              }
            : null,
        };
      });

      return notificacoesFormatadas;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new FindNotificacoes();
