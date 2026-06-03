import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";

interface UsuarioResponsavel {
  id: string;
}

// Interface principal do Processo
interface Processo {
  id: string;
  contato: string;
  descricao: string;
  email: string;
  clienteDoc: string;
  numeroProcesso: string;
  clienteName: string;
  status: string;
  tipo: string;
  usuariosResponsaveis: UsuarioResponsavel[];
  clienteId: string;
}

const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // 1. Adicionada a referência do bucket

class EditProcesso {
  async execute(processo: Processo) {
    try {
      logger.debug("Iniciando edição do processo", processo.id);

      const firstProcesso = await prisma.processos.findUnique({
        where: {
          id: processo.id,
        },
        include: {
          usuariosResponsaveis: true,
        },
      });

      if (!firstProcesso) {
        throw new Error("Processo não encontrado");
      }

      const cliente = await prisma.clientes.findUnique({
        where: {
          id: processo.clienteId,
        },
      });

      if (!cliente) {
        throw new Error("Cliente não encontrado");
      }

      // 1. Pegamos os IDs atuais que estão no banco
      const idsAtuais = firstProcesso.usuariosResponsaveis?.map(
        (u) => u.usuarioId,
      );

      // 2. Pegamos os IDs que vieram da requisição
      const idsNovos = processo.usuariosResponsaveis?.map((u) =>
        typeof u === "string" ? u : u.id,
      );

      // 3. Calculamos quem deve ser removido e quem deve ser adicionado
      const paraRemover =
        idsAtuais?.filter((id) => !idsNovos?.includes(id)) || [];
      const paraAdicionar =
        idsNovos?.filter((id) => !idsAtuais?.includes(id)) || [];

      // 4. Atualizamos os dados do processo e suas relações no banco de dados
      const response = await prisma.processos.update({
        where: { id: processo.id },
        data: {
          descricao: processo.descricao,
          numeroProcesso: processo.numeroProcesso,
          usuariosResponsaveis: {
            // Remove apenas as associações que não estão mais na lista
            deleteMany: {
              usuarioId: { in: paraRemover },
            },
            // Adiciona apenas as novas associações
            create: paraAdicionar.map((id) => ({
              usuarioId: id,
            })),
          },
          status: {
            connect: { codigoStatus: processo.status },
          },
          tipo: {
            connect: { codigoTipo: processo.tipo },
          },
          cliente: {
            connect: { id: cliente.id },
          },
        },
        include: {
          usuariosResponsaveis: {
            select: {
              usuario: {
                select: {
                  id: true,
                  email: true,
                  login: true,
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
            },
          },
          status: {
            select: {
              codigoStatus: true,
              id: true,
              nomeStatus: true,
            },
          },
          tipo: {
            select: {
              codigoTipo: true,
              id: true,
              nomeTipo: true,
            },
          },
        },
      });

      // =========================================================================
      // 5. Interceptação para formatar os links completos de foto
      // =========================================================================

      const responsaveisFormatados = response.usuariosResponsaveis.map(
        (responsavel: any) => {
          // Tratamento de array caso o Prisma retorne o perfil encapsulado no índice [0]
          const pRespRaw = responsavel.usuario?.perfil;
          const perfilResp = Array.isArray(pRespRaw) ? pRespRaw[0] : pRespRaw;

          // Concatena a URL pública
          const fotoRespUrl = perfilResp?.foto
            ? `${R2_PUBLIC_URL}/${perfilResp.foto}`
            : "";

          return {
            ...responsavel,
            usuario: {
              ...responsavel.usuario,
              perfil: perfilResp
                ? {
                    ...perfilResp,
                    foto: fotoRespUrl, // URL estática final
                  }
                : null,
            },
          };
        },
      );

      // Monta o objeto final preservando a estrutura original do response
      const processoFormatado = {
        ...response,
        usuariosResponsaveis: responsaveisFormatados,
      };

      logger.info(`Processo ${processo.id} editado com sucesso!`);

      // 6. Retorna o objeto formatado em vez da resposta pura do banco
      return processoFormatado;
    } catch (error) {
      logger.error("Erro no Model de EditProcesso:", error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new EditProcesso();
