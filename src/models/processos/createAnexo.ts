import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { uploadFile, getSecureUrl } from "../../services/storageService"; // Importando o serviço do R2

const prisma = new PrismaClient();

class CreateAnexo {
  async execute(processoId: string, files: Express.Multer.File[]) {
    try {
      if (!files || files.length === 0) {
        throw new Error("Nenhum anexo para salvar");
      }

      // Busca dados essenciais do processo para montar o caminho estruturado das pastas no R2
      const processo = await prisma.processos.findUnique({
        where: {
          id: processoId,
        },
        select: {
          id: true,
          numeroProcesso: true,
          clienteId: true,
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
          const escritorio = process.env.ESCRITORIO_NAME || "JuriSoft";
          // Mantém a mesma estrutura de pastas virtuais padronizada do sistema
          const caminhoNoStorage = `escritorios/${escritorio}/clientes/${processo.clienteId}/processos/${processo.numeroProcesso}/${timestamp}-${nomeSeguro}`;

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
      // FASE 2: GRAVAÇÃO DAS REFERÊNCIAS NO BANCO DE DADOS (PRISMA)
      // =========================================================================
      if (arquivosParaSalvar.length > 0) {
        logger.debug("Salvando novos anexos no banco de dados...");
        await prisma.anexosProcesso.createMany({
          data: arquivosParaSalvar.map((arquivo) => ({
            nome: arquivo.nome,
            caminhoArquivo: arquivo.caminhoArquivo,
            processoId: processo.id,
          })),
        });
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
            url: urlSegura, // Nova propriedade contendo o link pronto para uso imediato no front-end
          };
        }),
      );

      return anexosComLinksTemporarios;
    } catch (error) {
      logger.error("Erro no Model de CreateAnexo:", error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new CreateAnexo();
