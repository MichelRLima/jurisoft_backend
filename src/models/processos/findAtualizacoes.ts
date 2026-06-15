import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";

const prisma = new PrismaClient();

class FindAtualizacoes {
  async execute(processoId: string) {
    try {
      const atualizacoes = await prisma.atualizacoesProcesso.findMany({
        where: {
          processoId,
        },
        select: {
          id: true,
          conteudo: true,
          tipo: true,
          createdAt: true,
          updatedAt: true,
          usuario: {
            select: {
              id: true,
              email: true,
              login: true,
              permissao: true,
              perfil: {
                select: {
                  id: true,
                  nome: true,
                  sobrenome: true,
                  foto: true,
                },
              },
            },
          },
          status: {
            select: {
              id: true,
              codigoStatus: true,
              nomeStatus: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const atualizacoesFormatadas = atualizacoes.map((atualizacao) => {
        const aUsuario = atualizacao.usuario;
        const aPerfil = aUsuario?.perfil;
        const aFotoUrl = aPerfil?.foto
          ? `${process.env.R2_PUBLIC_URL}/${aPerfil.foto}`
          : "";

        return {
          ...atualizacao,
          usuario: aUsuario
            ? {
                ...aUsuario,
                perfil: aPerfil
                  ? {
                      ...aPerfil,
                      foto: aFotoUrl, // Link estático e permanente
                    }
                  : null,
              }
            : null,
        };
      });

      return atualizacoesFormatadas;
    } catch (error) {
      console.error("Error na busca das atualizacoes: ", error);
      throw error;
    } finally {
    }
  }
}

export default new FindAtualizacoes();
