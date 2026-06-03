import { Request, Response } from "express";
import findPermissao from "../../models/user/findPermissao";

class FindPermissaoController {
  async handle(req: Request, res: Response) {
    try {
      const result = await findPermissao.execute();

      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new FindPermissaoController();
