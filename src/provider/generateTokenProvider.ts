import { sign } from "jsonwebtoken";
import "dotenv/config";

class GenerateToken {
  async execute(userId: string): Promise<string> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        "Erro interno: Variável de ambiente JWT_TOKEN não definida.",
      );
    }

    const token = sign({}, secret, {
      subject: userId,
      expiresIn: "15m",
    });

    return token;
  }
}
export default new GenerateToken();
