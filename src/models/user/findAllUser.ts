import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class FindAllUser {
  async execute(usuarioId: string) {
    try {
      const users = await prisma.usuario.findMany({
        where: {
          id: {
            not: usuarioId,
          },
        },
        include: {
          perfil: true,
        },
      });

      const formatUsers = users.map((user) => {
        return {
          id: user?.id || "",
          login: user?.login || "",
          email: user?.email || "",

          perfil: {
            id: user?.perfil?.[0]?.id || "",
            foto: user?.perfil?.[0]?.foto || "",
            nome: user?.perfil?.[0]?.nome || "",
            sobrenome: user?.perfil?.[0]?.sobrenome || "",
            telefone: user?.perfil?.[0]?.telefone || "",
          },
        };
      });

      return formatUsers || [];
    } catch (error) {
      console.error(error);
      // throw new Error(error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new FindAllUser();
