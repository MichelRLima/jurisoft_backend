import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class CreateAtualizacaoProcesso {
  async execute(
    usuarioId: string,
    processoId: string,
    conteudo: string,
    statusProcesso: string,
  ) {
    try {
      if (!usuarioId || !processoId || !conteudo || !statusProcesso) {
        throw new Error("Dados inválidos");
      }

      // Utiliza a transação interativa para agrupar as operações dependentes
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Busca o ID e o Nome do status informado (Nome útil para a notificação)
        const statusDetails = await tx.statusProcesso.findUnique({
          where: { codigoStatus: statusProcesso },
          select: { id: true, nomeStatus: true },
        });

        if (!statusDetails?.id) {
          throw new Error("Status inválido");
        }

        // 2. Busca os envolvidos no processo (Criador + Responsáveis)
        const processoDetails = await tx.processos.findUnique({
          where: { id: processoId },
          select: {
            usuarioCriacaoId: true,
            usuariosResponsaveis: {
              select: { usuarioId: true },
            },
          },
        });

        if (!processoDetails) {
          throw new Error("Processo não encontrado");
        }

        // 3. Cria o registro de atualização do processo e SELECIONA os dados de retorno
        const atualizacao = await tx.atualizacoesProcesso.create({
          data: {
            usuarioId,
            processoId,
            conteudo,
            statusId: statusDetails.id,
          },
          select: {
            id: true,
            conteudo: true,
            createdAt: true,
            usuario: {
              select: {
                id: true,
                email: true,
                login: true,
                permissao: {
                  select: {
                    /* ... omitido p/ brevidade na leitura, mantenha o seu */ id: true,
                    codigoPermissao: true,
                    nomePermissao: true,
                    descricaoPermissao: true,
                    ativo: true,
                    tipo: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                perfil: {
                  select: { id: true, nome: true, sobrenome: true, foto: true },
                },
              },
            },
            status: {
              select: { id: true, codigoStatus: true, nomeStatus: true },
            },
          },
        });

        // 4. Atualiza o status atual na tabela principal do processo
        await tx.processos.update({
          where: { id: processoId },
          data: { statusId: statusDetails.id },
        });

        // ====================================================================
        // 5. LÓGICA DE NOTIFICAÇÃO
        // ====================================================================

        // Usamos um Set para garantir que não haverá IDs duplicados
        const destinatariosSet = new Set<string>();

        // Adiciona o criador do processo
        if (processoDetails.usuarioCriacaoId) {
          destinatariosSet.add(processoDetails.usuarioCriacaoId);
        }

        // Adiciona todos os responsáveis
        processoDetails.usuariosResponsaveis.forEach((resp) => {
          destinatariosSet.add(resp.usuarioId);
        });

        // REGRA DE OURO: Remove o usuário que está fazendo a atualização agora
        destinatariosSet.delete(usuarioId);

        // Converte o Set de volta para Array
        const destinatariosFinal = Array.from(destinatariosSet);

        // Só cria a notificação se sobrar alguém na lista
        if (destinatariosFinal.length > 0) {
          await tx.notificacao.create({
            data: {
              tipo: "ATUALIZACAO_PROCESSO", // O Enum que configuramos no schema
              descricao: `adicionou uma nova atualização e alterou o status para "${statusDetails.nomeStatus}".`,
              usuarioAtorId: usuarioId,
              processoId: processoId,
              destinatarios: {
                create: destinatariosFinal.map((id) => ({
                  usuarioId: id,
                })),
              },
            },
          });
        }
        // ====================================================================

        // Retorna o resultado da criação para fora da transação
        return atualizacao;
      });

      const format = {
        ...resultado,
        usuario: {
          ...resultado.usuario,
          perfil: {
            ...resultado.usuario?.perfil,
            foto: `${R2_PUBLIC_URL}/${resultado.usuario?.perfil?.foto}`,
          },
        },
      };

      return format;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new CreateAtualizacaoProcesso();
