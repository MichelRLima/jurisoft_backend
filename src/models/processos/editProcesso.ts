import { PrismaClient, AcaoLog } from "@prisma/client"; // Adicionado AcaoLog
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";

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
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class EditProcesso {
  // 👇 Adicionado usuarioId para sabermos quem é o autor da edição
  async execute(processo: Processo, usuarioId: string) {
    try {
      logger.debug("Iniciando edição do processo", processo.id);

      // 1. A FOTOGRAFIA DO ANTES: Buscamos como o processo está agora
      const firstProcesso = await prisma.processos.findUnique({
        where: {
          id: processo.id,
        },
        include: {
          usuariosResponsaveis: true,
          status: true, // Incluído para o log ficar legível
          tipo: true, // Incluído para o log ficar legível
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

      // Pegamos os IDs atuais que estão no banco
      const idsAtuais = firstProcesso.usuariosResponsaveis?.map(
        (u) => u.usuarioId,
      );

      // Pegamos os IDs que vieram da requisição
      const idsNovos = processo.usuariosResponsaveis?.map((u) =>
        typeof u === "string" ? u : u.id,
      );

      // Calculamos quem deve ser removido e quem deve ser adicionado
      const paraRemover =
        idsAtuais?.filter((id) => !idsNovos?.includes(id)) || [];
      const paraAdicionar =
        idsNovos?.filter((id) => !idsAtuais?.includes(id)) || [];

      // 2. A MUDANÇA: Atualizamos os dados no banco
      const response = await prisma.processos.update({
        where: { id: processo.id },
        data: {
          descricao: processo.descricao,
          numeroProcesso: processo.numeroProcesso,
          usuariosResponsaveis: {
            deleteMany: {
              usuarioId: { in: paraRemover },
            },
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

      // 3. O REGISTRO: Disparamos o log em background
      auditEmitter.emit("AUDIT_LOG", {
        entidade: "PROCESSO",
        entidadeId: response.id,
        acao: AcaoLog.UPDATE,
        atorId: usuarioId,
        // Montamos o objeto de "Antes" usando a primeira busca
        dadosAnteriores: {
          numeroProcesso: firstProcesso.numeroProcesso,
          descricao: firstProcesso.descricao,
          status: firstProcesso.status?.nomeStatus,
          tipo: firstProcesso.tipo?.nomeTipo,
          responsaveis: idsAtuais, // Salva a lista de IDs de quem cuidava antes
        },
        // Montamos o objeto de "Depois" usando a resposta do update
        dadosNovos: {
          numeroProcesso: response.numeroProcesso,
          descricao: response.descricao,
          status: response.status?.nomeStatus,
          tipo: response.tipo?.nomeTipo,
          responsaveis: idsNovos, // Salva a nova lista de responsáveis
        },
      });

      // =========================================================================
      // Interceptação para formatar os links completos de foto
      // =========================================================================

      const responsaveisFormatados = response.usuariosResponsaveis.map(
        (responsavel: any) => {
          const pRespRaw = responsavel.usuario?.perfil;
          const perfilResp = Array.isArray(pRespRaw) ? pRespRaw[0] : pRespRaw;

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
                    foto: fotoRespUrl,
                  }
                : null,
            },
          };
        },
      );

      const processoFormatado = {
        ...response,
        usuariosResponsaveis: responsaveisFormatados,
      };

      logger.info(`Processo ${processo.id} editado com sucesso!`);

      return processoFormatado;
    } catch (error) {
      logger.error("Erro no Model de EditProcesso:", error);
      throw error;
    }
  }
}

export default new EditProcesso();
