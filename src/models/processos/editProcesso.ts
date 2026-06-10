import { PrismaClient, AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { io } from "../.."; // 👇 Importação do socket.io

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

      // 1. Busca estado anterior INCLUINDO o perfil dos responsáveis (para pegar o nome de quem sair)
      const firstProcesso = await prisma.processos.findUnique({
        where: { id: processo.id },
        include: {
          usuariosResponsaveis: {
            include: {
              usuario: {
                include: { perfil: true },
              },
            },
          },
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
          usuarioCriacao: {
            select: {
              id: true,
              email: true,
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
          usuariosResponsaveis: {
            select: {
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
            },
          },
          status: {
            select: { codigoStatus: true, id: true, nomeStatus: true },
          },
          tipo: { select: { codigoTipo: true, id: true, nomeTipo: true } },
        },
      });

      // =========================================================================
      // LÓGICA DE REGISTRO DE ATUALIZAÇÕES DO PROCESSO
      // =========================================================================
      const atualizacoesParaCriar: string[] = [];

      // A. Status
      if (firstProcesso.status?.codigoStatus !== processo.status) {
        atualizacoesParaCriar.push(
          `Status do processo alterado de '${firstProcesso.status?.nomeStatus}' para '${response.status?.nomeStatus}'`,
        );
      }

      // B. Tipo
      if (firstProcesso.tipo?.codigoTipo !== processo.tipo) {
        atualizacoesParaCriar.push(
          `Tipo do processo alterado de '${firstProcesso.tipo?.nomeTipo}' para '${response.tipo?.nomeTipo}'`,
        );
      }

      // C. Adição de Responsáveis
      if (paraAdicionar.length > 0) {
        const nomesAdicionados = paraAdicionar.map((id) => {
          const resp = response.usuariosResponsaveis.find(
            (r: any) => r.usuario?.id === id,
          );
          const pRaw = resp?.usuario?.perfil;
          const perfil = Array.isArray(pRaw) ? pRaw[0] : pRaw;
          return perfil
            ? `${perfil.nome || ""} ${perfil.sobrenome || ""}`.trim()
            : "Usuário Desconhecido";
        });

        atualizacoesParaCriar.push(
          `Responsáveis adicionados ao processo:\n${nomesAdicionados
            .map((n) => `- ${n}`)
            .join("\n")}`,
        );
      }

      // D. Remoção de Responsáveis
      if (paraRemover.length > 0) {
        const nomesRemovidos = paraRemover.map((id) => {
          const resp = firstProcesso.usuariosResponsaveis.find(
            (r: any) => r.usuarioId === id,
          );
          const pRaw = resp?.usuario?.perfil;
          const perfil = Array.isArray(pRaw) ? pRaw[0] : pRaw;
          return perfil
            ? `${perfil.nome || ""} ${perfil.sobrenome || ""}`.trim()
            : "Usuário Desconhecido";
        });

        atualizacoesParaCriar.push(
          `Usuários removidos do processo:\n${nomesRemovidos
            .map((n) => `- ${n}`)
            .join("\n")}`,
        );
      }

      let createAtualizacao = null;
      // E. Persiste no banco de dados se houver algo para registrar (Em uma única mensagem)
      if (atualizacoesParaCriar.length > 0) {
        // Junta todas as mensagens em um único bloco de texto
        const mensagemUnica = atualizacoesParaCriar.join("\n\n");

        createAtualizacao = await prisma.atualizacoesProcesso.create({
          data: {
            usuarioId,
            processoId: processo.id,
            conteudo: mensagemUnica,
            statusId: response.status?.id,
            tipo: "PROCESSO_ALTERADO",
          },
          select: {
            id: true,
            conteudo: true,
            tipo: true,
            createdAt: true,
            usuario: {
              select: {
                id: true,
                email: true,
                login: true,
                permissao: {
                  select: {
                    id: true,
                    codigoPermissao: true,
                    nomePermissao: true,
                    descricaoPermissao: true,
                    ativo: true,
                    tipo: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                perfil: {
                  select: { id: true, nome: true, sobrenome: true, foto: true },
                },
              },
            },
            status: {
              select: { id: true, codigoStatus: true, nomeStatus: true },
            },
          },
        });

        createAtualizacao = {
          ...createAtualizacao,
          usuario: {
            ...createAtualizacao.usuario,
            perfil: {
              ...createAtualizacao.usuario?.perfil,
              foto: createAtualizacao.usuario?.perfil?.foto
                ? `${R2_PUBLIC_URL}/${createAtualizacao.usuario?.perfil?.foto}`
                : null,
            },
          },
        };

        // ====================================================================
        // 👇 ADICIONADO: LÓGICA DE NOTIFICAÇÃO VIA SOCKET PARA NOVOS USUÁRIOS
        // ====================================================================

        // Remove o usuário que está fazendo a edição caso ele tenha se adicionado
        const destinatariosNotificacao = paraAdicionar.filter(
          (id) => id !== usuarioId,
        );

        if (destinatariosNotificacao.length > 0) {
          const perfilAtor = createAtualizacao.usuario?.perfil;
          const nomeCompletoAtor = perfilAtor
            ? `${perfilAtor.nome || ""} ${perfilAtor.sobrenome || ""}`.trim()
            : "Usuário do Sistema";

          const fotoAtorUrl = perfilAtor?.foto || null;

          const notificacao = await prisma.notificacao.create({
            data: {
              tipo: "NOVO_PROCESSO",
              descricao: `adicionou você a um novo processo.`,
              usuarioAtorId: usuarioId,
              processoId: processo.id,
              destinatarios: {
                create: destinatariosNotificacao.map((id) => ({
                  usuarioId: id,
                })),
              },
            },
            include: {
              destinatarios: true,
            },
          });

          // Emite o socket individualmente para os recém adicionados
          notificacao.destinatarios.forEach((destinatario) => {
            io.to(`user_${destinatario.usuarioId}`).emit(
              "notificacao_atualizacao",
              {
                id: destinatario.id,
                isRead: destinatario.isRead,
                tipo: notificacao.tipo,
                createdAt: notificacao.createdAt,
                descricao: notificacao.descricao,
                usuarioAtor: {
                  nome: nomeCompletoAtor,
                  foto: fotoAtorUrl,
                },
                processo: {
                  numeroProcesso: response.numeroProcesso,
                  id: processo.id,
                },
              },
            );
          });
        }
        // ====================================================================
      }

      // =========================================================================

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

      const processoFormatado = {
        ...response,
        usuarioCriacao: criadorFormatado,
        usuariosResponsaveis: responsaveisFormatados,
      };

      logger.info(`Processo ${processo.id} editado com sucesso!`);
      return {
        processo: processoFormatado,
        ...(createAtualizacao && { atualizacao: createAtualizacao }),
      };
    } catch (error) {
      logger.error("Erro no Model de EditProcesso:", error);
      throw error;
    }
  }
}

export default new EditProcesso();
