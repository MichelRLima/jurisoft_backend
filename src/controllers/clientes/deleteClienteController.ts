import { Request, Response } from "express";

import deleteCliente from "../../models/clientes/deleteCliente";

class DeleteClienteController {
  async handle(req: Request, res: Response) {
    const { clienteId } = req.body;
    try {
      const response = await deleteCliente.execute(clienteId);
      res.status(200).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new DeleteClienteController();
