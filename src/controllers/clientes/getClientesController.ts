import { Request, Response } from "express";
import getClientes from "../../models/clientes/getClientes";

class getClientesController {
  async handle(req: Request, res: Response) {
    try {
      const response = await getClientes.execute();
      res.status(201).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new getClientesController();
