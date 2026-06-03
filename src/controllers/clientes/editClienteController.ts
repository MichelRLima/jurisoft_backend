import { Request, Response } from "express";
import editCliente from "../../models/clientes/editCliente";

class EditClienteController {
  async handle(req: Request, res: Response) {
    const { dataCliente, clienteId } = req.body;
    try {
      const response = await editCliente.execute(dataCliente, clienteId);
      res.status(201).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new EditClienteController();
