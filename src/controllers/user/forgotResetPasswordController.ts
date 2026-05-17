import { Request, Response } from "express";
import forgotResetPassword from "../../models/user/forgotResetPassword";

class forgotResetPasswordController {
  async handle(req: Request, res: Response) {
    const { email, code, newPassword } = req.body;

    try {
      if (!email || !code || !newPassword) {
        res.status(400).json({
          error:
            "Todos os campos (email, código e nova senha) são obrigatórios.",
        });
      }

      const result = await forgotResetPassword.execute({
        email,
        code,
        newPassword,
      });

      if (!result.success) {
        res.status(result.status).json({ error: result.error });
      }

      res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new forgotResetPasswordController();
