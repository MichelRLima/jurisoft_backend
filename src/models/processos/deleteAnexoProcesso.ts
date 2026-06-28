import { prisma } from "../../shared/database/prisma";
import logger from "../../utils/logger/logger";
import { deleteFile } from "../../services/storageService"; // Importando o serviço do Cloudflare R2

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

class DeleteAnexoProcesso {
  async execute(anexoId: string, usuarioId: string) {
    try {
      if (!anexoId) {
        throw new Error("Id do anexo ausente.");
      }
      if (!usuarioId) {
        throw new Error("Necessário informar o usuário.");
      }

      // 1. Busca o anexo incluindo os dados do processo para gerar a atualização
      const anexo = await prisma.anexosProcesso.findUnique({
        where: {
          id: anexoId,
        },
        include: {
          processo: {
            select: {
              id: true,
              status: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!anexo) {
        throw new Error("Anexo não encontrado");
      }

      // =========================================================================
      // FASE 1: REMOÇÃO DO ARQUIVO FÍSICO NO CLOUDFLARE R2
      // =========================================================================
      if (anexo.caminhoArquivo) {
        logger.debug(`Removendo arquivo físico do R2: ${anexo.caminhoArquivo}`);
        await deleteFile(anexo.caminhoArquivo);
      } else {
        logger.warn(
          `Anexo ${anexoId} não possui caminho de arquivo associado.`,
        );
      }

      // =========================================================================
      // FASE 2: REMOÇÃO DO REGISTRO NO BANCO DE DADOS
      // =========================================================================
      await prisma.anexosProcesso.delete({
        where: {
          id: anexo.id,
        },
      });

      // =========================================================================
      // FASE 3: CRIAÇÃO DA ATUALIZAÇÃO (SEM NOTIFICAÇÃO VIA SOCKET/BANCO)
      // =========================================================================
      const mensagem = `Anexo removido do processo:\n- ${anexo.nome}`;

      let createAtualizacao = await prisma.atualizacoesProcesso.create({
        data: {
          usuarioId,
          processoId: anexo.processo.id,
          conteudo: mensagem,
          statusId: anexo.processo.status.id,
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

      // Extraímos o perfil para uma variável para facilitar a leitura e checagem
      const perfilAtualizacao = createAtualizacao.usuario?.perfil;

      // Formatação segura da foto do usuário que apagou o anexo
      createAtualizacao = {
        ...createAtualizacao,
        usuario: {
          ...createAtualizacao.usuario,
          perfil: perfilAtualizacao
            ? {
                id: perfilAtualizacao.id,
                nome: perfilAtualizacao.nome,
                sobrenome: perfilAtualizacao.sobrenome,
                foto: perfilAtualizacao.foto
                  ? `${R2_PUBLIC_URL}/${perfilAtualizacao.foto}`
                  : null,
              }
            : null, // Passa null se o perfil não existir, mantendo a tipagem fiel ao Prisma
        },
      };
      logger.info(`Anexo ${anexoId} deletado com sucesso do sistema!`);

      // Retornamos a atualização junto para o front-end injetar na timeline
      return {
        message: "Anexo deletado com sucesso",
        atualizacao: createAtualizacao,
      };
    } catch (error) {
      logger.error("Erro no Model de DeleteAnexoProcesso:", error);
      throw error;
    }
  }
}

export default new DeleteAnexoProcesso();
