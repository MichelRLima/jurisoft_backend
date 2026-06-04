import { PrismaClient, AcaoLog } from "@prisma/client"; // Importado o AcaoLog
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";

// Mantenha a instância do cliente fora da classe para ser reutilizada (Singleton)
const prisma = new PrismaClient();

class DeleteCliente {
  // 👇 Adicionado o usuarioId para o registro
  async execute(clienteId: string, usuarioId: string) {
    try {
      if (!clienteId) {
        throw new Error("Necessário informar um cliente");
      }

      // 1. A FOTOGRAFIA DO ANTES: Buscamos o cliente para salvar no log
      const cliente = await prisma.clientes.findUnique({
        where: { id: clienteId },
      });

      if (!cliente) {
        throw new Error("Cliente não encontrado");
      }

      // 2. A MUDANÇA: Excluímos do banco de dados
      await prisma.clientes.delete({
        where: {
          id: clienteId,
        },
      });

      logger.info(`Cliente excluido com sucesso!`);

      // =========================================================================
      // 3. TRILHA DE AUDITORIA (FIRE-AND-FORGET)
      // =========================================================================

      auditEmitter.emit("AUDIT_LOG", {
        entidade: "CLIENTE",
        entidadeId: cliente.id,
        acao: AcaoLog.DELETE,
        atorId: usuarioId, // A identidade blindada de quem fez a exclusão
        dadosAnteriores: {
          nome: cliente.nome,
          documento: cliente.documento,
          email: cliente.email,
          contato: cliente.contato,
          cidade: cliente.cidade,
          estado: cliente.estado,
        },
        dadosNovos: null, // Como foi apagado, o estado novo é nulo
      });

      return { message: "Cliente excluido com sucesso" };
    } catch (error) {
      console.error(error);
      throw error;
    }
    // O bloco finally foi removido permanentemente para manter a conexão Prisma ativa
  }
}

export default new DeleteCliente();
