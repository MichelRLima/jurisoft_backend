import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class CheckPerfil {
  async execute(usuarioId: string) {
    try {
      const perfil = await client.perfil.findFirst({
        where: { usuarioId },
      });

      if (perfil) {
        // Concatena a URL pública se a foto existir
        const urlFotoCompleta = perfil.foto
          ? `${R2_PUBLIC_URL}/${perfil.foto}`
          : "";

        return {
          perfilAlreadyExists: true,
          perfil: {
            ...perfil, // Copia todos os dados (nome, telefone, etc)
            foto: urlFotoCompleta, // Sobrescreve apenas a foto com o link completo
          },
        };
      } else {
        return { perfilAlreadyExists: false };
      }
    } catch (error) {
      console.error("Erro no CheckPerfil:", error);
      throw error; // Importante para o Controller conseguir capturar e retornar status 500
    } finally {
      await client.$disconnect();
    }
  }
}

export default new CheckPerfil();
