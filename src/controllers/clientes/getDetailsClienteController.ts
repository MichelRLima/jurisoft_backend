import { Request, Response } from "express";
import getDetailsCliente from "../../models/clientes/getDetailsCliente";

class getDetailsClienteController {
  async handle(req: Request, res: Response) {
    const { clienteId } = req.body;

    try {
      const response = await getDetailsCliente.execute(clienteId);
      res.status(201).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new getDetailsClienteController();
