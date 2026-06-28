import { AcaoLog } from "@prisma/client"; // Adicionado AcaoLog
import { Cliente } from "../../types/cliente";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { prisma } from "../../shared/database/prisma";

class EditCliente {
  // 👇 Adicionado o usuarioId como terceiro parâmetro
  async execute(dataCliente: Cliente, clienteId: string, usuarioId: string) {
    try {
      if (!dataCliente?.nome || !dataCliente?.documento) {
        throw new Error(
          "Necessário preencher campos obrigatórios (nome e documento)",
        );
      }

      // 1. A FOTOGRAFIA DO ANTES: Buscamos o cliente como ele é hoje
      const clienteAntigo = await prisma.clientes.findUnique({
        where: { id: clienteId },
      });

      if (!clienteAntigo) {
        throw new Error("Cliente não encontrado");
      }

      // 2. A MUDANÇA: Fazemos o update no banco
      const response = await prisma.clientes.update({
        where: {
          id: clienteId,
        },
        data: {
          nome: dataCliente?.nome?.trim(),
          documento: dataCliente?.documento?.trim(),
          contato: dataCliente?.contato?.trim(),
          email: dataCliente?.email?.trim(),
          cep: dataCliente?.cep?.trim(),
          logradouro: dataCliente?.rua?.trim(),
          numero: dataCliente?.numero?.trim(),
          complemento: dataCliente?.complemento?.trim(),
          bairro: dataCliente?.bairro?.trim(),
          cidade: dataCliente?.cidade?.trim(),
          estado: dataCliente?.estado?.trim(),
          indicacao: dataCliente?.indicacao?.trim(),
          docIndicacao: dataCliente?.docIndicacao?.trim(),
        },
      });

      // Correção do texto do logger
      logger.info(`Cliente editado com sucesso!`);

      // =========================================================================
      // 3. TRILHA DE AUDITORIA (FIRE-AND-FORGET)
      // =========================================================================

      auditEmitter.emit("AUDIT_LOG", {
        entidade: "CLIENTE",
        entidadeId: response.id,
        acao: AcaoLog.UPDATE,
        atorId: usuarioId, // ID extraído do token
        dadosAnteriores: {
          nome: clienteAntigo.nome,
          documento: clienteAntigo.documento,
          email: clienteAntigo.email,
          contato: clienteAntigo.contato,
          cidade: clienteAntigo.cidade,
          estado: clienteAntigo.estado,
          logradouro: clienteAntigo.logradouro,
          numero: clienteAntigo.numero,
          indicacao: clienteAntigo.indicacao,
          docIndicacao: clienteAntigo.docIndicacao,
        },
        dadosNovos: {
          nome: response.nome,
          documento: response.documento,
          email: response.email,
          contato: response.contato,
          cidade: response.cidade,
          estado: response.estado,
          logradouro: response.logradouro,
          numero: response.numero,
          indicacao: response.indicacao,
          docIndicacao: response.docIndicacao,
        },
      });

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
    // O bloco finally foi removido permanentemente.
  }
}

export default new EditCliente();
