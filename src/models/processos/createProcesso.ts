import { PrismaClient } from "@prisma/client";
import googleCreateFolder from "../googleDrive/googleCreateFolder";
import logger from "../../utils/logger/logger";
import googleUploadFile from "../googleDrive/googleUploadFile";
import googlePermissionFolder from "../googleDrive/googlePermissionFolder";
import { connect } from "node:net";

// Definimos o que o Model espera receber
interface CreateProcessoRequest {
  processo: any;
  files: Express.Multer.File[];
  usuarioId: string;
}

const prisma = new PrismaClient();
function formatarProcesso(numero: string) {
  // Remove qualquer caractere que não seja número, caso a entrada venha suja
  const limpo = numero.replace(/\D/g, "");

  // Verifica se tem os 20 dígitos necessários
  if (limpo.length !== 20) {
    return "Número inválido (deve conter 20 dígitos)";
  }

  // Aplica a máscara: NNNNNNN-DD.AAAA.J.TR.OOOO
  return limpo.replace(
    /^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/,
    "$1-$2.$3.$4.$5.$6",
  );
}

class CreateProcesso {
  // Tipamos o objeto de entrada
  async execute({ processo, files = [], usuarioId }: CreateProcessoRequest) {
    try {
      if (
        !processo?.clienteName ||
        !processo?.numeroDoc ||
        !processo?.numeroProcesso ||
        !processo?.status ||
        !processo?.descricao
      ) {
        throw new Error("Dados insuficientes para abertura de processo");
      }

      const userCreate = await prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },
      });

      if (!userCreate || !userCreate?.email) {
        throw new Error("Usuário nao encontrado ou sem email");
      }

      const pastaName = `Processo: ${formatarProcesso(processo?.numeroProcesso)} - ${processo?.clienteName}`;
      logger.debug(`Criando pasta do processo: ${pastaName}`);
      const pastaDrive = await googleCreateFolder.execute(pastaName);
      if (!pastaDrive || !pastaDrive.id) {
        throw new Error(
          "Falha ao criar pasta no Google Drive. O processo não pode ser salvo.",
        );
      }
      logger.info(`Pasta criada no Google Drive: ${pastaDrive.id}`);
      logger.debug(
        "Adicionando permissão de compartilhamento para o usuário de criação do processo:" +
          userCreate.email,
      );

      const responseDrivePermissao = await googlePermissionFolder.addPermission(
        pastaDrive.id,
        userCreate.email,
        "writer",
      );

      if (!responseDrivePermissao?.id) {
        throw new Error(
          "Falha ao adicionar permissão de compartilhamento. O processo não pode ser salvo.",
        );
      }

      logger.info(
        `Permissão de compartilhamento adicionada para: ${userCreate.email}`,
      );

      logger.debug(
        "Adicionando permissão de compartilhamento para os responsáveis",
      );

      await Promise.all(
        processo?.responsaveis?.map(async (responsavel: any) => {
          if (!pastaDrive?.id) {
            throw new Error("ID da pasta nao encontrado para o upload.");
          }
          const responseDrivePermissao =
            await googlePermissionFolder.addPermission(
              pastaDrive.id,
              responsavel.email,
              "writer",
            );

          if (!responseDrivePermissao?.id) {
            throw new Error(
              "Falha ao adicionar permissão de compartilhamento. O processo não pode ser salvo.",
            );
          }

          logger.info(
            `Permissão de compartilhamento adicionada para: ${responsavel.email}`,
          );
        }),
      );

      logger.debug(`Criando processo no banco de dados`);
      const result = await prisma.$transaction(async (prisma) => {
        if (!pastaDrive?.id || !responseDrivePermissao.id) {
          throw new Error("Informações incompletas para abertura de processo");
        }
        const newProcesso = await prisma.processos.create({
          data: {
            numeroProcesso: processo.numeroProcesso,
            clienteName: processo.clienteName,
            clienteDoc: processo.numeroDoc,
            descricao: processo.descricao,
            contato: processo.contato,
            email: processo.email,
            pastaDriveId: pastaDrive?.id,
            usuarioCriacao: {
              connect: {
                id: userCreate?.id,
              },
            },
            usuariosResponsaveis: {
              create: processo.responsaveis.map(
                (responsavel: { id: string }) => ({
                  usuario: {
                    connect: { id: responsavel?.id },
                  },
                }),
              ),
            },
            status: {
              connect: {
                codigoStatus: processo.status,
              },
            },
          },
        });
        logger.debug(`Processo criado no banco de dados: ${newProcesso.id}`);
        if (files.length > 0) {
          logger.debug(`Identificado ${files?.length} arquivos para upload`);

          await Promise.all(
            files.map(async (file) => {
              // Verificação explícita dentro do novo escopo
              if (!pastaDrive?.id) {
                throw new Error("ID da pasta não encontrado para o upload.");
              }

              logger.debug(`Upload do arquivo ${file.originalname}`);
              const responseDriveUpload = await googleUploadFile.execute(
                file,
                pastaDrive.id,
              );

              if (
                !responseDriveUpload?.id ||
                !responseDriveUpload?.name ||
                !responseDriveUpload?.webViewLink
              ) {
                throw new Error("Arquivo incosistente no Google Drive.");
              }
              await prisma.anexosProcesso.create({
                data: {
                  nome: responseDriveUpload?.name,
                  anexoDriveId: responseDriveUpload?.id,
                  processoId: newProcesso.id,
                  link: responseDriveUpload?.webViewLink,
                },
              });

              return responseDriveUpload;
            }),
          );
        } else {
          logger.debug(`Nenhum arquivo identificado para upload`);
        }

        logger.debug(
          `Criando permissão de acesso ao processo no banco de dados`,
        );
        await prisma.permissaoDrive?.create({
          data: {
            pastaDriveId: pastaDrive.id,
            permissaoId: responseDrivePermissao.id,
            usuarioId: userCreate.id,
            processoId: newProcesso.id,
          },
        });
        logger.debug(
          `Permissão de acesso ao processo criado no banco de dados`,
        );

        logger.debug(
          `Criando permissão de acesso aos responsáveis no banco de dados`,
        );
        await prisma.permissaoDrive.createMany({
          data: processo.responsaveis?.map((responsavel: { id: string }) => ({
            pastaDriveId: pastaDrive.id,
            permissaoId: responseDrivePermissao.id,
            usuarioId: responsavel.id,
            processoId: newProcesso.id,
          })),
        });
        logger.debug(
          `Permissão de acesso aos responsáveis criado no banco de dados`,
        );

        logger.debug(`Finalizado abertura do processo: ${newProcesso.id}`);
        const findProcesso = await prisma.processos.findUnique({
          where: {
            id: newProcesso.id,
          },
          select: {
            id: true,
            numeroProcesso: true,
            clienteName: true,
            clienteDoc: true,
            contato: true,
            email: true,
            descricao: true,
            usuarioCriacao: {
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
            status: {
              select: {
                id: true,
                codigoStatus: true,
                nomeStatus: true,
              },
            },
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
            _count: {
              select: {
                anexosProcesso: true,
              },
            },
          },
        });
        if (!findProcesso) {
          throw new Error("Processo nao encontrado");
        }

        const format = {
          ...findProcesso,
          anexos: findProcesso?._count?.anexosProcesso || 0,
          usuariosResponsaveis: findProcesso.usuariosResponsaveis.map(
            (responsavel) => {
              return {
                ...responsavel?.usuario,
                perfil: responsavel?.usuario?.perfil?.[0],
              };
            },
          ),
        };

        return format;
      });

      return result;
    } catch (error) {
      console.error("Erro no Model:", error);
      throw error;
    }
  }
}

export default new CreateProcesso();
