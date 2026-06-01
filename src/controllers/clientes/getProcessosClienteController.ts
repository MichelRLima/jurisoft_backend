import { Request, Response } from "express";

import getProcessosCliente from "../../models/clientes/getProcessosCliente";

class getProcessosClienteController {
  async handle(req: Request, res: Response) {
    const { clienteId } = req.body;
    try {
      const response = await getProcessosCliente.execute(clienteId);
      res.status(200).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new getProcessosClienteController();
