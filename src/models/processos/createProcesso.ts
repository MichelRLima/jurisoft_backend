import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger/logger";
import { uploadFile } from "../../services/storageService"; // Importe o serviço do R2 criado anteriormente
import formatarProcesso from "../../utils/formatarProcesso/formatarProcesso";

// Definimos o que o Model espera receber
interface CreateProcessoRequest {
  processo: any;
  files: Express.Multer.File[];
  usuarioId: string;
}

// Interface auxiliar para forçar o TS a enxergar os relacionamentos do select dentro da transaction
interface IFindProcessoResult {
  id: string;
  numeroProcesso: string;
  descricao: string;
  usuarioCriacao: {
    id: string;
    email: string;
    login: string;
    perfil: any; // Alterado para any temporariamente para aceitar a validação de array nativa do Prisma
  };
  status: {
    id: string;
    codigoStatus: string;
    nomeStatus: string;
  };
  tipo: {
    id: string;
    codigoTipo: string;
    nomeTipo: string;
  };
  usuariosResponsaveis: {
    usuario: {
      id: string;
      email: string;
      login: string;
      perfil: any;
    };
  }[];
  cliente: {
    id: string;
    nome: string;
    documento: string;
  };
  _count: {
    anexosProcesso: number;
  };
}

const prisma = new PrismaClient();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

class CreateProcesso {
  async execute({ processo, files = [], usuarioId }: CreateProcessoRequest) {
    try {
      if (
        !processo?.clienteId ||
        !processo?.numeroProcesso ||
        !processo?.status ||
        !processo?.descricao ||
        !processo?.tipo
      ) {
        throw new Error("Dados insuficientes para abertura de processo");
      }

      const userCreate = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!userCreate || !userCreate?.email) {
        throw new Error("Usuário nao encontrado ou sem email");
      }

      const cliente = await prisma.clientes.findUnique({
        where: { id: processo?.clienteId },
      });

      if (!cliente) {
        throw new Error("Cliente não encontrado");
      }

      // =========================================================================
      // FASE 1: COMUNICAÇÃO EXTERNA (CLOUDFLARE R2) - FORA DA TRANSAÇÃO
      // =========================================================================

      const arquivosParaSalvar: {
        nome: string;
        caminhoArquivo: string;
      }[] = [];

      if (files.length > 0) {
        logger.debug(
          `Identificado ${files?.length} arquivos para upload. Iniciando envio para o Cloudflare R2...`,
        );

        await Promise.all(
          files?.map(async (file) => {
            logger.debug(`Upload do arquivo ${file.originalname}`);

            const nomeSeguro = file.originalname.replace(
              /[^a-zA-Z0-9.-]/g,
              "_",
            );
            const timestamp = Date.now();

            const caminhoNoStorage = `clientes/${cliente.id}/processos/${processo.numeroProcesso}/${timestamp}-${nomeSeguro}`;

            await uploadFile(file.buffer, caminhoNoStorage, file.mimetype);

            arquivosParaSalvar.push({
              nome: file.originalname,
              caminhoArquivo: caminhoNoStorage,
            });
          }),
        );
        logger.debug("Uploads no Cloudflare R2 concluídos com sucesso.");
      }

      // =========================================================================
      // FASE 2: TRANSAÇÃO DE BANCO DE DADOS (PRISMA) - EXTREMAMENTE RÁPIDA
      // =========================================================================

      logger.debug(`Criando processo no banco de dados`);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Cria o processo
        const newProcesso = await tx.processos.create({
          data: {
            numeroProcesso: processo.numeroProcesso,
            descricao: processo.descricao,
            usuarioCriacao: { connect: { id: userCreate.id } },
            status: { connect: { codigoStatus: processo.status } },
            tipo: { connect: { codigoTipo: processo.tipo } },
            cliente: { connect: { id: cliente.id } },
            usuariosResponsaveis: {
              create: processo.responsaveis.map(
                (responsavel: { id: string }) => ({
                  usuario: { connect: { id: responsavel.id } },
                }),
              ),
            },
          },
        });

        logger.debug(`Processo criado no banco de dados: ${newProcesso.id}`);

        // 2. Salva os anexos (se houverem) usando createMany
        if (arquivosParaSalvar?.length > 0) {
          logger.debug("Salvando registros dos anexos no banco de dados...");
          await tx.anexosProcesso.createMany({
            data: arquivosParaSalvar?.map((arquivo) => ({
              nome: arquivo.nome,
              caminhoArquivo: arquivo.caminhoArquivo,
              processoId: newProcesso.id,
            })),
          });
        }

        logger.debug(
          `Finalizado inserções. Buscando processo completo: ${newProcesso.id}`,
        );

        // 3. Retorna os dados completos do processo formatados
        const findProcesso = (await tx.processos.findUnique({
          where: { id: newProcesso.id },
          select: {
            id: true,
            numeroProcesso: true,
            descricao: true,
            usuarioCriacao: {
              select: {
                id: true,
                email: true,
                login: true,
                perfil: {
                  select: { id: true, nome: true, sobrenome: true, foto: true },
                },
              },
            },
            status: {
              select: { id: true, codigoStatus: true, nomeStatus: true },
            },
            tipo: { select: { id: true, codigoTipo: true, nomeTipo: true } },
            usuariosResponsaveis: {
              select: {
                usuario: {
                  select: {
                    id: true,
                    email: true,
                    login: true,
                    perfil: {
                      select: {
                        id: true,
                        nome: true,
                        sobrenome: true,
                        foto: true,
                      },
                    },
                  },
                },
              },
            },
            cliente: { select: { id: true, nome: true, documento: true } },
            _count: { select: { anexosProcesso: true } },
          },
        })) as unknown as IFindProcessoResult;

        if (!findProcesso) {
          throw new Error("Processo não encontrado após criação");
        }

        // Tratamento seguro do perfil do criador (Lida se vier como Array ou Objeto)
        const pCriacaoRaw = findProcesso.usuarioCriacao?.perfil;
        const perfilCriacao = Array.isArray(pCriacaoRaw)
          ? pCriacaoRaw[0]
          : pCriacaoRaw;
        const fotoCriacaoUrl = perfilCriacao?.foto
          ? `${R2_PUBLIC_URL}/${perfilCriacao.foto}`
          : "";

        return {
          ...findProcesso,
          usuarioCriacao: findProcesso.usuarioCriacao
            ? {
                ...findProcesso.usuarioCriacao,
                perfil: perfilCriacao
                  ? {
                      id: perfilCriacao.id,
                      nome: perfilCriacao.nome,
                      sobrenome: perfilCriacao.sobrenome,
                      foto: fotoCriacaoUrl, // URL estática perfeita e sem o objeto "0"
                    }
                  : null,
              }
            : findProcesso.usuarioCriacao,
          anexos: findProcesso._count?.anexosProcesso || 0,
          usuariosResponsaveis: findProcesso.usuariosResponsaveis?.map(
            (responsavel: any) => {
              // Tratamento seguro do perfil dos responsáveis
              const pRespRaw = responsavel.usuario?.perfil;
              const perfilResp = Array.isArray(pRespRaw)
                ? pRespRaw[0]
                : pRespRaw;
              const fotoRespUrl = perfilResp?.foto
                ? `${R2_PUBLIC_URL}/${perfilResp.foto}`
                : "";

              return {
                ...responsavel.usuario,
                perfil: perfilResp
                  ? {
                      id: perfilResp.id,
                      nome: perfilResp.nome,
                      sobrenome: perfilResp.sobrenome,
                      foto: fotoRespUrl, // URL estática perfeita e sem o objeto "0"
                    }
                  : null,
              };
            },
          ),
        };
      });

      return result;
    } catch (error) {
      logger.error("Erro no Model de CreateProcesso:", error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new CreateProcesso();
