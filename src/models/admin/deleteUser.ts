import { PrismaClient, AcaoLog } from "@prisma/client";
import { auditEmitter } from "../../services/auditService";

const prisma = new PrismaClient();

class DeleteUser {
  async execute(userId: string, status: Boolean, atorId: string) {
    try {
      const user = await prisma.usuario.findUnique({ where: { id: userId } });
      if (!user) throw new Error("Usuário não encontrado");

      // Soft Delete: Em vez de prisma.usuario.delete, mudamos o status para 0
      const userInativado = await prisma.usuario.update({
        where: { id: userId },
        data: { status: Number(status) },
      });

      // Disparar Log
      auditEmitter.emit("AUDIT_LOG", {
        entidade: "USUARIO",
        entidadeId: userId,
        acao: AcaoLog.DELETE,
        atorId,
        dadosAnteriores: { login: user.login, status: user.status },
        dadosNovos: { status: 0 },
      });

      return { message: "Usuário inativado (soft delete) com sucesso!" };
    } catch (error) {
      throw error;
    }
  }
}

export default new DeleteUser();
