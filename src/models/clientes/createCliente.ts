import { AcaoLog } from "@prisma/client"; // Adicionado AcaoLog
import { Cliente } from "../../types/cliente";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { prisma } from "../../shared/database/prisma";

class CreateCliente {
  // 👇 Adicionado o usuarioId para o rastreio de auditoria
  async execute(dataCliente: Cliente, usuarioId: string) {
    try {
      if (!dataCliente?.nome || !dataCliente?.documento) {
        throw new Error(
          "Necessário preencher campos obrigatórios (nome e documento)",
        );
      }

      const clienteExistente = await prisma.clientes.findFirst({
        where: {
          documento: {
            equals: dataCliente.documento.trim(),
            mode: "insensitive",
          },
        },
      });

      if (clienteExistente) {
        throw new Error("Cliente já cadastrado no sistema.");
      }

      const response = await prisma.clientes.create({
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

      logger.info(`Cliente criado com sucesso!`);

      // =========================================================================
      // TRILHA DE AUDITORIA (FIRE-AND-FORGET)
      // =========================================================================

      // 👇 Dispara o log silenciosamente em background
      auditEmitter.emit("AUDIT_LOG", {
        entidade: "CLIENTE",
        entidadeId: response.id,
        acao: AcaoLog.CREATE,
        atorId: usuarioId, // ID do usuário logado vindo do controller
        dadosAnteriores: null, // Como é criação, não havia nada antes
        dadosNovos: {
          nome: response.nome,
          documento: response.documento,
          email: response.email,
          contato: response.contato,
          cidade: response.cidade,
          estado: response.estado,
          indicacao: response.indicacao,
          docIndicacao: response.docIndicacao,
        },
      });

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new CreateCliente();
