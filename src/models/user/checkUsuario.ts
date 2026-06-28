import { prisma } from "../../shared/database/prisma";

class CheckUsuario {
  async execute(id: string) {
    try {
      const usuarioExists = await prisma.usuario.findFirst({
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
    }
  }
}

export default new CheckUsuario();
