import { PrismaClient, AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";

interface UsuarioResponsavel {
  id: string;
}

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
  async execute(processo: Processo, usuarioId: string) {
    try {
      logger.debug("Iniciando edição do processo", processo.id);

      const firstProcesso = await prisma.processos.findUnique({
        where: { id: processo.id },
        include: {
          usuariosResponsaveis: true,
          status: true,
          tipo: true,
        },
      });

      if (!firstProcesso) throw new Error("Processo não encontrado");

      const cliente = await prisma.clientes.findUnique({
        where: { id: processo.clienteId },
      });

      if (!cliente) throw new Error("Cliente não encontrado");

      const idsAtuais = firstProcesso.usuariosResponsaveis?.map(
        (u) => u.usuarioId,
      );
      const idsNovos = processo.usuariosResponsaveis?.map((u) =>
        typeof u === "string" ? u : u.id,
      );

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
            deleteMany: { usuarioId: { in: paraRemover } },
            create: paraAdicionar.map((id) => ({ usuarioId: id })),
          },
          status: { connect: { codigoStatus: processo.status } },
          tipo: { connect: { codigoTipo: processo.tipo } },
          cliente: { connect: { id: cliente.id } },
        },
        include: {
          // 👇 ADICIONADO: Buscando o criador do processo e sua permissão
          usuarioCriacao: {
            select: {
              id: true,
              email: true,
              permissao: true, // Traz a permissão completa do criador
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
          usuariosResponsaveis: {
            select: {
              usuario: {
                select: {
                  id: true,
                  email: true,
                  login: true,
                  permissao: true, // 👇 ADICIONADO: Traz a permissão completa dos responsáveis
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
            select: { codigoStatus: true, id: true, nomeStatus: true },
          },
          tipo: { select: { codigoTipo: true, id: true, nomeTipo: true } },
        },
      });

      auditEmitter.emit("AUDIT_LOG", {
        entidade: "PROCESSO",
        entidadeId: response.id,
        acao: AcaoLog.UPDATE,
        atorId: usuarioId,
        dadosAnteriores: {
          numeroProcesso: firstProcesso.numeroProcesso,
          descricao: firstProcesso.descricao,
          status: firstProcesso.status?.nomeStatus,
          tipo: firstProcesso.tipo?.nomeTipo,
          responsaveis: idsAtuais,
        },
        dadosNovos: {
          numeroProcesso: response.numeroProcesso,
          descricao: response.descricao,
          status: response.status?.nomeStatus,
          tipo: response.tipo?.nomeTipo,
          responsaveis: idsNovos,
        },
      });

      // =========================================================================
      // Interceptação para formatar os links completos de foto
      // =========================================================================

      // Formatação da foto dos responsáveis
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
              perfil: perfilResp ? { ...perfilResp, foto: fotoRespUrl } : null,
            },
          };
        },
      );

      // 👇 ADICIONADO: Formatação da foto do criador (para não quebrar no front)
      let criadorFormatado = null;
      if (response.usuarioCriacao) {
        const pCriadorRaw = (response.usuarioCriacao as any).perfil;
        const perfilCriador = Array.isArray(pCriadorRaw)
          ? pCriadorRaw[0]
          : pCriadorRaw;
        const fotoCriadorUrl = perfilCriador?.foto
          ? `${R2_PUBLIC_URL}/${perfilCriador.foto}`
          : "";

        criadorFormatado = {
          ...response.usuarioCriacao,
          perfil: perfilCriador
            ? { ...perfilCriador, foto: fotoCriadorUrl }
            : null,
        };
      }

      // Montando o objeto final que vai pro front-end
      const processoFormatado = {
        ...response,
        usuarioCriacao: criadorFormatado, // Substitui pelo criador com a foto formatada
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
