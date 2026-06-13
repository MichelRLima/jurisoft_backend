import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { Payload } from "../middlewares/auth/Payload";
// Idealmente, importe o prisma de um arquivo de configuração central
// para evitar múltiplas instâncias (ex: import prisma from "../prisma")
import { PrismaClient } from "@prisma/client";
import cache from "../cache";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: Payload;
}

// 1. Adicionado o 'async' na declaração da função
export async function isAuthenticated(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const authToken = request.headers.authorization;

  if (!authToken) {
    response.status(401).json({ message: "Token missing" }).end();
    return;
  }

  const [, token] = authToken.split(" ");

  let decodedToken: Payload;

  // 2. Try/catch isolado apenas para a verificação do JWT
  try {
    decodedToken = verify(token, process.env.JWT_SECRET!) as Payload;
  } catch (error) {
    response.status(401).json({ message: "Token inválido ou expirado" }).end();
    return;
  }

  request.user = decodedToken;

  // 3. Try/catch para a comunicação com o banco
  try {
    let userActive = cache.get(`userActive_${decodedToken.sub}`);
    if (!userActive) {
      userActive = await prisma.usuario.findUnique({
        where: { id: decodedToken.sub },
        select: { status: true },
      });
      cache.set(`userActive_${decodedToken.sub}`, userActive, 60 * 60 * 24 * 7);
    }

    if (!userActive || userActive.status === 0) {
      response.status(403).json({ message: "Usuário inativo" }).end();
      return;
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar status do usuário:", error);
    response.status(500).json({ message: "Erro interno do servidor" }).end();
    return;
  }
}
