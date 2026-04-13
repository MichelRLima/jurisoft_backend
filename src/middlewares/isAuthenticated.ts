import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { Payload } from "../middlewares/auth/Payload";

export function isAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const authToken = request.headers.authorization;

  if (!authToken) {
    response.status(401).json({ message: "Token missing" }).end();
    return; // apenas retorna, sem retornar response
  }

  const [, token] = authToken.split(" ");

  try {
    verify(token, process.env.JWT_SECRET!) as Payload;
    next();
  } catch (error) {
    response.status(401).end();
    return; // sem retornar o response
  }
}
