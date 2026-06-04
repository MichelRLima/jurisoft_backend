import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { Payload } from "../middlewares/auth/Payload";

// Precisamos estender o Request para o TypeScript aceitar o 'user'
export interface AuthRequest extends Request {
  user?: Payload;
}

export function isAuthenticated(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
): void {
  const authToken = request.headers.authorization;

  if (!authToken) {
    response.status(401).json({ message: "Token missing" }).end();
    return;
  }

  const [, token] = authToken.split(" ");

  try {
    // 1. Em vez de só rodar o verify, nós SALVAMOS o resultado dele
    const decodedToken = verify(token, process.env.JWT_SECRET!) as Payload;

    // 2. Injetamos o payload decodificado e 100% seguro dentro do request
    request.user = decodedToken;

    next();
  } catch (error) {
    response.status(401).end();
    return;
  }
}
