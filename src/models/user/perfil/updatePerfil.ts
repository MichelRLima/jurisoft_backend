import { PrismaClient } from "@prisma/client";
import uploadFotoPerfil from "../../superBase/uploadFotoPerfil";
import deleteFotoPerfil from "../../superBase/deleteFotoPerfil";

const client = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class UpdatePerfil {
  async execute(
    foto: string,
    nome: string,
    sobrenome: string,
    email: string,
    telefone: string,
    usuarioId: string,
  ) {
    try {
      // 1. Busca perfil atual para verificar se há foto antiga
      const perfilAtual = await client.perfil.findUnique({
        where: { usuarioId },
      });

      let caminhoParaSalvar = perfilAtual?.foto || "";
      const isBase64 = foto.startsWith("data:");

      // 2. Se for Base64, processa o upload
      if (isBase64) {
        if (perfilAtual?.foto) {
          await deleteFotoPerfil.execute(perfilAtual.foto);
        }
        caminhoParaSalvar = await uploadFotoPerfil.execute(foto);
      } else {
        caminhoParaSalvar = foto;
      }

      // 3. Executa a transação
      const result = await client.$transaction(async (transactionClient) => {
        await transactionClient.usuario.update({
          where: { id: usuarioId },
          data: { email },
        });

        const updatePerfil = await transactionClient.perfil.upsert({
          where: { usuarioId },
          create: {
            foto: caminhoParaSalvar,
            nome,
            sobrenome,
            telefone,
            usuarioId,
          },
          update: { foto: caminhoParaSalvar, nome, sobrenome, telefone },
        });

        return { updatePerfil };
      });

      // 4. Monta o link completo para o retorno
      const fotoCompleta = caminhoParaSalvar
        ? `${R2_PUBLIC_URL}/${caminhoParaSalvar}`
        : "";

      return {
        ...result.updatePerfil,
        foto: fotoCompleta,
      };
    } catch (error: any) {
      if (!error.path) {
        error.path = "src/models/internal/perfil/updatePerfil.ts";
      }
      throw error;
    } finally {
      await client.$disconnect();
    }
  }
}

export default new UpdatePerfil();
