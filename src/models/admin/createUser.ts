import { PrismaClient, AcaoLog } from "@prisma/client";
import bcrypt from "bcryptjs";
import { auditEmitter } from "../../services/auditService";

const prisma = new PrismaClient();

class CreateUser {
  async execute(
    login: string,
    senha: string,
    email: string,
    permissaoId: string,
    atorId: string,
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const userAlreadyExists = await tx.usuario.findFirst({
          where: { OR: [{ login }, { email }] },
        });
        console.log(userAlreadyExists);

        if (userAlreadyExists) {
          throw Object.assign(new Error("Usuário já existe!"), { status: 409 });
        }

        const passwordHash = await bcrypt.hash(senha, 8);
        const newUser = await tx.usuario.create({
          data: { login, senha: passwordHash, email, status: 1, permissaoId },
        });

        // Disparar Log
        auditEmitter.emit("AUDIT_LOG", {
          entidade: "USUARIO",
          entidadeId: newUser.id,
          acao: AcaoLog.CREATE,
          atorId,
          dadosNovos: { login, email, permissaoId },
        });

        return newUser;
      });
      return result;
    } catch (error) {
      throw error;
    }
  }
}
export default new CreateUser();
