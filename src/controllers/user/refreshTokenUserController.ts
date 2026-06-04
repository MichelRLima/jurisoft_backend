import { Request, Response } from "express";
import refreshTokenUser from "../../models/user/refreshTokenUser";

class RefreshTokenController {
  async handle(req: Request, res: Response) {
    // Pegamos a chave exata que você configurou no frontend: { refresh_token: idDoRefreshToken }
    const { refresh_token } = req.body;

    try {
      const tokens = await refreshTokenUser.execute(refresh_token);

      // Devolve o JSON com o novo Access Token e o novo Refresh Token
      res.status(200).json(tokens);
    } catch (error: any) {
      // Se for um erro conhecido da nossa classe, devolve o status correto (ex: 401)
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        message: error.message || "Erro interno no servidor ao renovar token",
      });
    }
  }
}

export default new RefreshTokenController();
