import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // 1. Adicionada a referência do bucket

class FindAllUser {
  async execute() {
    try {
      const users = await prisma.usuario.findMany({
        include: {
          perfil: true,
          permissao: true,
        },
      });

      const formatUsers = users.map((user) => {
        // Extrai o perfil (lidando com o retorno em formato de array do Prisma)
        const perfil = user?.perfil;

        // Concatena a URL pública se o caminho da foto existir no banco
        const fotoUrlCompleta = perfil?.foto
          ? `${R2_PUBLIC_URL}/${perfil.foto}`
          : "";

        return {
          id: user?.id || "",
          login: user?.login || "",
          email: user?.email || "",
          permissao: user?.permissao || "",
          status: user?.status || false,
          perfil: {
            id: perfil?.id || "",
            foto: fotoUrlCompleta, // 2. Retorna a URL estática pronta
            nome: perfil?.nome || "",
            sobrenome: perfil?.sobrenome || "",
            telefone: perfil?.telefone || "",
          },
        };
      });

      return formatUsers || [];
    } catch (error) {
      console.error(error);
      throw error; // Importante manter o throw para o Controller capturar o status 500
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new FindAllUser();
