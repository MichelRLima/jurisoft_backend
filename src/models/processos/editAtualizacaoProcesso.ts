import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class EditAtualizacaoProcesso {
  async execute(usuarioId: string, id: string, conteudo: string) {
    try {
      if (!usuarioId || !id || !conteudo) {
        throw new Error("Dados inválidos");
      }

      // 1. Busca a atualização apenas para verificar a autoria (otimizado)
      const atualizacaoExistente = await prisma.atualizacoesProcesso.findUnique(
        {
          where: { id },
          select: { usuarioId: true },
        },
      );

      if (!atualizacaoExistente) {
        throw new Error("Atualização não encontrada");
      }

      // 2. Trava de segurança: Verifica se quem está editando é o criador
      if (atualizacaoExistente.usuarioId !== usuarioId) {
        throw new Error(
          "Operação negada: Você só pode editar as suas próprias atualizações.",
        );
      }

      // 3. Atualiza o conteúdo e já retorna o objeto com a estrutura completa populada
      const atualizacaoEditada = await prisma.atualizacoesProcesso.update({
        where: { id },
        data: { conteudo },
        select: {
          id: true,
          conteudo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return atualizacaoEditada;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new EditAtualizacaoProcesso();
