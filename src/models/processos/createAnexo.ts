import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { uploadFile, getSecureUrl } from "../../services/storageService"; // Importando o serviço do R2
import { io } from "../.."; // Importando o socket.io

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
const prisma = new PrismaClient();

class CreateAnexo {
  async execute(
    processoId: string,
    files: Express.Multer.File[],
    usuarioId: string,
  ) {
    try {
      if (!files || files.length === 0) {
        throw new Error("Nenhum anexo para salvar");
      }
      if (!usuarioId) {
        throw new Error("Necessário informar o usuário");
      }

      // Busca dados essenciais do processo para montar o caminho estruturado das pastas no R2
      // Adicionados 'usuarioCriacaoId' e 'usuariosResponsaveis' para a notificação
      const processo = await prisma.processos.findUnique({
        where: {
          id: processoId,
        },
        select: {
          id: true,
          numeroProcesso: true,
          clienteId: true,
          usuarioCriacaoId: true,
          usuariosResponsaveis: {
            select: { usuarioId: true },
          },
          status: {
            select: {
              id: true,
              codigoStatus: true,
            },
          },
        },
      });

      if (!processo) {
        throw new Error("Processo não encontrado");
      }

      logger.debug(
        `Identificado ${files.length} arquivos para upload no Cloudflare R2`,
      );

      const arquivosParaSalvar: { nome: string; caminhoArquivo: string }[] = [];

      // =========================================================================
      // FASE 1: UPLOAD DOS ARQUIVOS FÍSICOS PARA O CLOUDFLARE R2
      // =========================================================================
      await Promise.all(
        files.map(async (file) => {
          logger.debug(`Upload do arquivo ${file.originalname}`);

          // Sanitiza o nome do arquivo removendo caracteres especiais
          const nomeSeguro = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
          const timestamp = Date.now();

          // Mantém a mesma estrutura de pastas virtuais padronizada do sistema
          const caminhoNoStorage = `clientes/${processo.clienteId}/processos/${processo.numeroProcesso}/${timestamp}-${nomeSeguro}`;

          // Envia o buffer do arquivo diretamente ao R2
          await uploadFile(file.buffer, caminhoNoStorage, file.mimetype);

          // Armazena na memória os caminhos gerados com sucesso
          arquivosParaSalvar.push({
            nome: file.originalname,
            caminhoArquivo: caminhoNoStorage,
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
            processoId: processo.id,
          })),
        });

        // Lista os nomes formatados com um traço ou marcador
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

        // ====================================================================
        // FASE 2.5: LÓGICA DE NOTIFICAÇÃO (SOCKET E BANCO)
        // ====================================================================
        const destinatariosSet = new Set<string>();

        if (processo.usuarioCriacaoId) {
          destinatariosSet.add(processo.usuarioCriacaoId);
        }

        processo.usuariosResponsaveis.forEach((resp) => {
          destinatariosSet.add(resp.usuarioId);
        });

        // Remove o usuário que está fazendo o upload (ator)
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
                create: destinatariosFinal.map((id) => ({
                  usuarioId: id,
                })),
              },
            },
            include: {
              destinatarios: true,
            },
          });

          const perfilAtor = createAtualizacao.usuario?.perfil;
          const nomeCompleto = perfilAtor
            ? `${perfilAtor.nome || ""} ${perfilAtor.sobrenome || ""}`.trim()
            : "Usuário do Sistema";

          // Como já formatamos a URL da foto no createAtualizacao ali em cima, podemos apenas reaproveitar
          const fotoUrl = perfilAtor?.foto || null;

          // Emite o socket individualmente para cada destinatário
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
                  nome: nomeCompleto,
                  foto: fotoUrl,
                },
                processo: {
                  numeroProcesso: processo.numeroProcesso,
                  id: processoId,
                },
              },
            );
          });
        }
        // ====================================================================
      }

      // =========================================================================
      // FASE 3: RETORNO DOS ANEXOS ATUALIZADOS COM LINKS SEGUROS
      // =========================================================================
      const todosAnexos = await prisma.anexosProcesso.findMany({
        where: {
          processoId: processo.id,
        },
        select: {
          id: true,
          nome: true,
          caminhoArquivo: true,
        },
      });

      // Transforma o 'caminhoArquivo' interno em URLs pré-assinadas temporárias
      const anexosComLinksTemporarios = await Promise.all(
        todosAnexos.map(async (anexo) => {
          let urlSegura = "";
          if (anexo.caminhoArquivo) {
            urlSegura = await getSecureUrl(anexo.caminhoArquivo);
          }
          return {
            id: anexo.id,
            nome: anexo.nome,
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
    } finally {
      // Nota: Idealmente a conexão prisma não deve ser fechada com disconnect aqui
      // se a sua aplicação gerencia um singleton, mas mantive para não alterar o seu comportamento.
      await prisma.$disconnect();
    }
  }
}

export default new CreateAnexo();
