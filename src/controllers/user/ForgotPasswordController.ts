import { Request, Response } from "express";
import forgotPassword from "../../models/user/forgotPassword";

class ForgotPasswordController {
  async handle(req: Request, res: Response) {
    const { email } = req.body;

    try {
      if (!email) {
        res.status(400).json({ error: "O e-mail é obrigatório." });
      }

      const result = await forgotPassword.execute(email);

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

export default new ForgotPasswordController();
