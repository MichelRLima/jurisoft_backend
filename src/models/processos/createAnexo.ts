import logger from "../../utils/logger/logger";
import { uploadFile, getSecureUrl } from "../../services/storageService";
import { io } from "../..";
import { prisma } from "../../shared/database/prisma";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// Configuração do limite do plano via variável de ambiente
const limitePlanoGb = process.env.LIMITE_PLANO_GB;
const limitePlano = limitePlanoGb
  ? Number(limitePlanoGb) * 1024 * 1024 * 1024
  : 2147483648; // Padrão de 2GB se não existir no .env

class CreateAnexo {
  async execute(
    processoId: string,
    files: Express.Multer.File[],
    usuarioId: string,
  ) {
    try {
      if (!files || files?.length === 0) {
        throw new Error("Nenhum anexo para salvar");
      }
      if (!usuarioId) {
        throw new Error("Necessário informar o usuário");
      }

      const processo = await prisma.processos.findUnique({
        where: { id: processoId },
        select: {
          id: true,
          numeroProcesso: true,
          clienteId: true,
          usuarioCriacaoId: true,
          usuariosResponsaveis: { select: { usuarioId: true } },
          status: { select: { id: true, codigoStatus: true } },
        },
      });

      if (!processo) {
        throw new Error("Processo não encontrado");
      }

      logger.debug(
        `Identificado ${files?.length} arquivos para upload no Cloudflare R2`,
      );

      // =========================================================================
      // FASE 0: VERIFICAÇÃO DE LIMITE DE ARMAZENAMENTO ANTES DO UPLOAD
      // =========================================================================

      // 1. Calcula o peso (em bytes) dos novos arquivos do dropzone
      const tamanhoNovosArquivos = files.reduce(
        (acc, file) => acc + file.size,
        0,
      );

      // 2. Agrupa e soma todo o espaço já utilizado por esse cliente no banco
      const agregacao = await prisma.anexosProcesso.aggregate({
        _sum: {
          tamanho: true,
        },
        where: {
          processo: {
            clienteId: processo.clienteId,
          },
        },
      });

      const espacoUtilizado = agregacao._sum.tamanho || 0;

      // 3. Valida se a transação vai estourar o limite
      if (espacoUtilizado + tamanhoNovosArquivos > limitePlano) {
        logger.warn(
          `Upload de anexo bloqueado para o cliente ${processo.clienteId}. Limite excedido.`,
        );
        throw Object.assign(
          new Error("Limite de armazenamento do plano atingido."),
          {
            status: 403,
          },
        );
      }

      const arquivosParaSalvar: {
        nome: string;
        caminhoArquivo: string;
        tamanho: number;
      }[] = [];

      // =========================================================================
      // FASE 1: UPLOAD DOS ARQUIVOS FÍSICOS PARA O CLOUDFLARE R2
      // =========================================================================
      await Promise.all(
        files.map(async (file) => {
          logger.debug(`Upload do arquivo ${file.originalname}`);

          const nomeSeguro = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
          const timestamp = Date.now();
          const caminhoNoStorage = `clientes/${processo.clienteId}/processos/${processo.numeroProcesso}/${timestamp}-${nomeSeguro}`;

          await uploadFile(file.buffer, caminhoNoStorage, file.mimetype);

          arquivosParaSalvar.push({
            nome: file.originalname,
            caminhoArquivo: caminhoNoStorage,
            tamanho: file.size,
          });
        }),
      );

      logger.debug("Todos os uploads no Cloudflare R2 foram concluídos.");

      // =========================================================================
      // FASE 2: GRAVAÇÃO DAS REFERÊNCIAS NO BANCO DE DADOS E NOTIFICAÇÕES
      // =========================================================================
      let createAtualizacao = null;
      if (arquivosParaSalvar.length > 0) {
        logger.debug("Salvando novos anexos no banco de dados...");

        await prisma.anexosProcesso.createMany({
          data: arquivosParaSalvar.map((arquivo) => ({
            nome: arquivo.nome,
            caminhoArquivo: arquivo.caminhoArquivo,
            tamanho: arquivo.tamanho,
            processoId: processo.id,
          })),
        });

        const listaNomes = arquivosParaSalvar
          .map((arq) => `- ${arq.nome}`)
          .join("\n");
        const mensagem = `Adicionados novos anexos ao processo:\n${listaNomes}`;

        createAtualizacao = await prisma.atualizacoesProcesso.create({
          data: {
            usuarioId,
            processoId,
            conteudo: mensagem,
            statusId: processo.status.id,
            tipo: "ANEXOS",
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

        const destinatariosSet = new Set<string>();
        if (processo.usuarioCriacaoId)
          destinatariosSet.add(processo.usuarioCriacaoId);
        processo.usuariosResponsaveis.forEach((resp) =>
          destinatariosSet.add(resp.usuarioId),
        );
        destinatariosSet.delete(usuarioId);

        const destinatariosFinal = Array.from(destinatariosSet);

        if (destinatariosFinal.length > 0) {
          const notificacao = await prisma.notificacao.create({
            data: {
              tipo: "NOVO_ANEXO",
              descricao: `adicionou ${arquivosParaSalvar.length} novo(s) anexo(s) ao processo.`,
              usuarioAtorId: usuarioId,
              processoId: processoId,
              destinatarios: {
                create: destinatariosFinal.map((id) => ({ usuarioId: id })),
              },
            },
            include: { destinatarios: true },
          });

          const perfilAtor = createAtualizacao.usuario?.perfil;
          const nomeCompleto = perfilAtor
            ? `${perfilAtor.nome || ""} ${perfilAtor.sobrenome || ""}`.trim()
            : "Usuário do Sistema";
          const fotoUrl = perfilAtor?.foto || null;

          notificacao.destinatarios.forEach((destinatario) => {
            io.to(`user_${destinatario.usuarioId}`).emit(
              "notificacao_atualizacao",
              {
                id: destinatario.id,
                isRead: destinatario.isRead,
                tipo: notificacao.tipo,
                createdAt: notificacao.createdAt,
                descricao: notificacao.descricao,
                usuarioAtor: { nome: nomeCompleto, foto: fotoUrl },
                processo: {
                  numeroProcesso: processo.numeroProcesso,
                  id: processoId,
                },
              },
            );
          });
        }
      }

      // =========================================================================
      // FASE 3: RETORNO DOS ANEXOS ATUALIZADOS COM LINKS SEGUROS E TAMANHO
      // =========================================================================
      const todosAnexos = await prisma.anexosProcesso.findMany({
        where: { processoId: processo.id },
        select: {
          id: true,
          nome: true,
          caminhoArquivo: true,
          tamanho: true,
        },
      });

      const anexosComLinksTemporarios = await Promise.all(
        todosAnexos.map(async (anexo) => {
          let urlSegura = "";
          if (anexo.caminhoArquivo) {
            urlSegura = await getSecureUrl(anexo.caminhoArquivo);
          }
          return {
            id: anexo.id,
            nome: anexo.nome,
            tamanho: anexo.tamanho,
            url: urlSegura,
          };
        }),
      );

      return {
        anexos: anexosComLinksTemporarios,
        ...(createAtualizacao && { atualizacao: createAtualizacao }),
      };
    } catch (error) {
      logger.error("Erro no Model de CreateAnexo:", error);
      throw error;
    }
  }
}

export default new CreateAnexo();
