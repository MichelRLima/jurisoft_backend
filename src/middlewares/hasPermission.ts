import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "./isAuthenticated"; // Importe a interface do seu arquivo de autenticação

// Nota: Em produção, é recomendado importar o prisma de um arquivo central (ex: prismaClient.ts)
// para evitar múltiplas instâncias de conexão.
const prisma = new PrismaClient();

export function ensurePermission(permissoesPermitidas: string[]) {
  return async (
    req: AuthRequest, // <-- 1. Tipagem alterada para reconhecer o req.user
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // 🔥 2. A MÁGICA DA SEGURANÇA 🔥
      // Pegamos o ID diretamente do token decodificado pelo middleware anterior.
      // Ignoramos completamente qualquer header 'x-user-id'.
      // Obs: Se no seu token (Payload) a propriedade se chamar 'id' em vez de 'sub', basta trocar aqui.
      const usuarioId = req.user?.sub;

      if (!usuarioId) {
        res
          .status(401)
          .json({
            message: "Falha na autenticação: ID do usuário inválido no token.",
          })
          .end();
        return;
      }

      // Busca o usuário e inclui os dados da permissão atrelada a ele
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
          permissao: {
            select: { codigoPermissao: true },
          },
        },
      });

      const codigoPermissao =
        usuario?.permissao?.codigoPermissao?.toUpperCase();

      if (!codigoPermissao) {
        res
          .status(403)
          .json({
            message:
              "Falha na autorização: Este usuário não possui permissões vinculadas.",
          })
          .end();
        return;
      }

      // Verifica se a permissão do banco bate com a exigida pela rota
      if (!permissoesPermitidas.includes(codigoPermissao)) {
        res
          .status(403)
          .json({
            message:
              "Falha na autorização: Este usuário não possui esta permissão.",
          })
          .end();
        return;
      }

      // Se passou por todas as validações, segue para o Controller
      return next();
    } catch (error) {
      console.error("Erro no middleware de permissões:", error);
      res
        .status(500)
        .json({ message: "Erro interno ao validar permissões." })
        .end();
      return;
    }
  };
}
