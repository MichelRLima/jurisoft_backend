import { PrismaClient, AcaoLog } from "@prisma/client";
import { auditEmitter } from "../../services/auditService";

const prisma = new PrismaClient();

class UpdateUser {
  async execute(
    userId: string,
    login: string,
    email: string,
    telefone: string,
    nome: string,
    sobrenome: string,
    permissaoId: string,
    atorId: string,
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        const userAntigo = await tx.usuario.findUnique({
          where: { id: userId },
          include: { perfil: true },
        });

        if (!userAntigo)
          throw Object.assign(new Error("Usuário não encontrado!"), {
            status: 404,
          });

        const userAtualizado = await tx.usuario.update({
          where: { id: userId },
          data: {
            login,
            email,
            permissaoId,
            perfil: {
              upsert: {
                create: { telefone, nome, sobrenome },
                update: { telefone, nome, sobrenome },
              },
            },
          },
        });

        // Disparar Log
        auditEmitter.emit("AUDIT_LOG", {
          entidade: "USUARIO",
          entidadeId: userId,
          acao: AcaoLog.UPDATE,
          atorId,
          dadosAnteriores: {
            login: userAntigo.login,
            email: userAntigo.email,
            permissaoId: userAntigo.permissaoId,
            nome: userAntigo.perfil?.nome,
            sobrenome: userAntigo.perfil?.sobrenome,
            telefone: userAntigo.perfil?.telefone,
          },
          dadosNovos: { login, email, permissaoId, nome, sobrenome, telefone },
        });

        return userAtualizado;
      });
    } catch (error) {
      throw error;
    }
  }
}
export default new UpdateUser();
