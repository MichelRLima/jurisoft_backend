import { AcaoLog } from "@prisma/client";
import { prisma } from "../../shared/database/prisma";
import logger from "../../utils/logger/logger";
import { auditEmitter } from "../../services/auditService";
import { encryptDado, decryptDado } from "../../utils/crypto/encryption"; // Importado decryptDado

// Tipagem ajustada para o formato do JSON enviado
type CampoAdicional = {
  id: string;
  label: string;
  value: string;
  type: string;
};

type DadoAdicional = {
  id: string;
  titulo: string;
  descricao: string;
  campos: CampoAdicional[];
  processoId: string;
};

class CreateDadoAdicional {
  async execute(dadoAdicional: DadoAdicional, usuarioId: string) {
    try {
      if (!dadoAdicional.titulo || !dadoAdicional.processoId) {
        throw new Error("Título e ID do processo são obrigatórios.");
      }

      let acaoLog: AcaoLog = AcaoLog.CREATE;
      let dadosAnteriores: any = null;

      if (dadoAdicional.id) {
        const dadoExistente = await prisma.dadoAdicional.findUnique({
          where: { id: dadoAdicional.id },
        });

        if (dadoExistente) {
          acaoLog = AcaoLog.UPDATE;
          dadosAnteriores = {
            titulo: dadoExistente.titulo,
            descricao: dadoExistente.descricao,
            campos: dadoExistente.campos,
          };
        }
      }

      // =========================================================================
      // INTERCEPTAÇÃO DE ENVIO: Criptografar campos do tipo 'password'
      // =========================================================================
      const camposProcessados = dadoAdicional.campos.map((campo) => {
        if (campo.type === "password" && campo.value) {
          return {
            ...campo,
            value: encryptDado(campo.value),
          };
        }
        return campo;
      });

      const createdDadoAdicional = await prisma.dadoAdicional.upsert({
        where: {
          id: dadoAdicional.id || "",
        },
        update: {
          titulo: dadoAdicional.titulo,
          descricao: dadoAdicional.descricao,
          campos: camposProcessados as any,
        },
        create: {
          titulo: dadoAdicional.titulo,
          descricao: dadoAdicional.descricao,
          campos: camposProcessados as any,
          processoId: dadoAdicional.processoId,
        },
      });

      logger.info(
        `Dado Adicional ${createdDadoAdicional.id} processado com sucesso (Ação: ${acaoLog})!`,
      );

      // Na auditoria, enviamos os dados processados (criptografados) para manter o log seguro
      auditEmitter.emit("AUDIT_LOG", {
        entidade: "DADO_ADICIONAL",
        entidadeId: createdDadoAdicional.id,
        acao: acaoLog,
        atorId: usuarioId,
        dadosAnteriores: dadosAnteriores,
        dadosNovos: {
          titulo: createdDadoAdicional.titulo,
          descricao: createdDadoAdicional.descricao,
          campos: camposProcessados,
        },
      });

      // =========================================================================
      // INTERCEPTAÇÃO DE RETORNO: Descriptografar para a resposta do Model
      // =========================================================================
      const camposBrutosRetorno =
        (createdDadoAdicional.campos as unknown as CampoAdicional[]) || [];

      const camposDescriptografados = camposBrutosRetorno.map((campo) => {
        if (campo.type === "password" && campo.value) {
          try {
            return {
              ...campo,
              value: decryptDado(campo.value), // Converte de volta para texto plano
            };
          } catch (decryptionError) {
            logger.error(
              `Falha ao descriptografar no retorno do upsert para o campo ${campo.id}:`,
              decryptionError,
            );
            return campo;
          }
        }
        return campo;
      });

      return {
        ...createdDadoAdicional,
        campos: camposDescriptografados,
      };
    } catch (error) {
      logger.error("Erro no Model de CreateDadoAdicional:", error);
      throw error;
    }
  }
}

export default new CreateDadoAdicional();
