import { Request, Response } from "express";
import createCliente from "../../models/clientes/createCliente";

class CreateClienteController {
  async handle(req: Request, res: Response) {
    const { dataCliente } = req.body;
    try {
      const response = await createCliente.execute(dataCliente);
      res.status(201).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new CreateClienteController();
