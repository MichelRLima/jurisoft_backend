const { PrismaClient } = require("@prisma/client");

const client = new PrismaClient();

class CheckUsuario {
  async execute(id: string) {
    try {
      const usuarioExists = await client.usuario.findFirst({
        where: { id },
        select: {
          id: true,
          login: true,
          email: true,
          status: true,

          permissao: {
            select: {
              id: true,
              codigoPermissao: true,
              nomePermissao: true,
              descricaoPermissao: true,
              ativo: true,
              tipo: true,
            },
          },
        },
      });
      if (usuarioExists) {
        return usuarioExists;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    } finally {
      await client.$disconnect();
    }
  }
}

export default new CheckUsuario();
