import { PrismaClient } from "@prisma/client";

import { getSecureUrl } from "../../services/storageService"; // Importando o serviço do R2

const prisma = new PrismaClient();

class FindAnexos {
  async execute(processoId: string) {
    try {
      if (!processoId) {
        throw new Error("Necessário informar o processo");
      }

      const anexos = await prisma.anexosProcesso.findMany({
        where: {
          processoId: processoId,
        },
        select: {
          id: true,
          nome: true,
          caminhoArquivo: true,
        },
      });

      const anexosComLinksTemporarios = await Promise.all(
        anexos.map(async (anexo) => {
          let urlSegura = "";

          if (anexo.caminhoArquivo) {
            urlSegura = await getSecureUrl(anexo.caminhoArquivo);
          }

          return {
            id: anexo.id,
            nome: anexo.nome,
            url: urlSegura,
          };
        }),
      );

      return anexosComLinksTemporarios;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}

export default new FindAnexos();
