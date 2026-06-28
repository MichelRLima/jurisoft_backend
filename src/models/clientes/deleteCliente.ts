import { PrismaClient, AcaoLog } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { deleteFile } from "../../services/storageService"; // Importado para apagar do R2
import { auditEmitter } from "../../services/auditService";

const prisma = new PrismaClient();

class DeleteCliente {
  async execute(clienteId: string, usuarioId: string) {
    try {
      if (!clienteId) {
        throw new Error("Necessário informar um cliente");
      }

      // 1. A FOTOGRAFIA DO ANTES: Buscamos o cliente e TODOS os seus processos/anexos
      const cliente = await prisma.clientes.findUnique({
        where: { id: clienteId },
        include: {
          processos: {
            include: {
              anexosProcesso: true,
            },
          },
        },
      });

      if (!cliente) {
        throw new Error("Cliente não encontrado");
      }

      // =========================================================================
      // FASE INTERMEDIÁRIA: DELETAR ANEXOS DOS PROCESSOS NO STORAGE (R2)
      // =========================================================================
      if (cliente?.processos && cliente?.processos?.length > 0) {
        // Coletamos todos os caminhos de arquivos válidos de uma vez só
        const caminhosArquivos = cliente.processos
          ?.flatMap((proc) => proc.anexosProcesso || [])
          ?.map((anexo) => anexo.caminhoArquivo)
          ?.filter(Boolean) as string[];

        if (caminhosArquivos.length > 0) {
          logger.debug(
            `Encontrados ${caminhosArquivos.length} arquivos nos processos do cliente para deletar no R2. Iniciando exclusão...`,
          );

          await Promise.all(
            caminhosArquivos.map(async (caminho) => {
              await deleteFile(caminho);
              logger.debug(`Arquivo do processo removido do R2: ${caminho}`);
            }),
          );

          logger.info(
            "Todos os arquivos do R2 vinculados aos processos do cliente foram excluídos!",
          );
        }
      }

      // =========================================================================
      // 2. A MUDANÇA: Excluímos do banco de dados (Dispara o ON DELETE CASCADE)
      // =========================================================================
      await prisma.clientes.delete({
        where: {
          id: clienteId,
        },
      });

      logger.info(`Cliente e seus vínculos excluídos com sucesso!`);

      // =========================================================================
      // 3. TRILHA DE AUDITORIA (FIRE-AND-FORGET)
      // =========================================================================
      auditEmitter.emit("AUDIT_LOG", {
        entidade: "CLIENTE",
        entidadeId: cliente.id,
        acao: AcaoLog.DELETE,
        atorId: usuarioId,
        dadosAnteriores: {
          nome: cliente.nome,
          documento: cliente.documento,
          email: cliente.email,
          contato: cliente.contato,
          cidade: cliente.cidade,
          estado: cliente.estado,
        },
        dadosNovos: null,
      });

      // Opcional: Se quiser disparar auditoria individual para cada processo deletado em cascata,
      // você pode fazer um `.map` no `cliente.processos` aqui emitindo "PROCESSO" como DELETED.

      return { message: "Cliente excluido com sucesso" };
    } catch (error) {
      logger.error("Erro no Model de DeleteCliente:", error);
      throw error;
    }
  }
}

export default new DeleteCliente();
