const { PrismaClient } = require("@prisma/client");

const client = new PrismaClient();

class CheckPerfil {
  async execute(usuarioId: string) {
    try {
      const perfilAlreadyExists = await client.perfil.findFirst({
        where: { usuarioId },
      });

      if (perfilAlreadyExists) {
        return {
          perfilAlreadyExists: true,
          perfil: perfilAlreadyExists,
        };
      } else {
        return { perfilAlreadyExists: false };
      }
    } catch (error) {
      console.error(error);
      // throw new Error(error);
    } finally {
      await client.$disconnect();
    }
  }
}

export default new CheckPerfil();
