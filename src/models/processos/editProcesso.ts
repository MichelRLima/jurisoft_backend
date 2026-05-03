import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import googleUpdateNameFolder from "../googleDrive/googleUpdateNameFolder";
import formatarProcesso from "../../utils/formatarProcesso/formatarProcesso";

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
  usuariosResponsaveis: UsuarioResponsavel[];
}
// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();
class EditProcesso {
  async execute(processo: Processo) {
    try {
      const firstProcesso = await prisma.processos.findUnique({
        where: {
          id: processo.id,
        },
        include: {
          usuariosResponsaveis: true,
        },
      });

      if (!firstProcesso) {
        throw new Error("Processo nao encontrado");
      }
      // 1. Pegamos os IDs atuais que estão no banco (você já tem o firstProcesso do seu código)
      const idsAtuais = firstProcesso.usuariosResponsaveis?.map(
        (u) => u.usuarioId,
      );

      // 2. Pegamos os IDs que vieram da requisição (ajuste conforme a estrutura do seu objeto)
      const idsNovos = processo.usuariosResponsaveis?.map((u) =>
        typeof u === "string" ? u : u.id,
      );

      // 3. Calculamos quem deve ser removido e quem deve ser adicionado
      const paraRemover = idsAtuais?.filter((id) => !idsNovos?.includes(id));
      const paraAdicionar = idsNovos?.filter((id) => !idsAtuais?.includes(id));
      const pastaName = `Processo: ${formatarProcesso(processo?.numeroProcesso)} - ${processo?.clienteName}`;

      await googleUpdateNameFolder.execute(
        firstProcesso.pastaDriveId,
        pastaName,
      );
      const response = await prisma.processos.update({
        where: { id: processo.id },
        data: {
          contato: processo.contato,
          descricao: processo.descricao,
          email: processo.email,
          clienteDoc: processo.clienteDoc,
          numeroProcesso: processo.numeroProcesso,
          clienteName: processo.clienteName,

          usuariosResponsaveis: {
            // 1. Remove apenas as associações que não estão mais na lista
            // Usamos deleteMany com um filtro nos IDs dos usuários
            deleteMany: {
              usuarioId: { in: paraRemover },
            },
            // 2. Adiciona apenas as novas associações
            create: paraAdicionar.map((id) => ({
              usuarioId: id,
            })),
          },

          status: {
            connect: { codigoStatus: processo.status },
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
        },
      });

      logger.info(`Processo editado com sucesso!`);
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new EditProcesso();
