import { Response } from "express";
import createCliente from "../../models/clientes/createCliente";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class CreateClienteController {
  async handle(req: AuthRequest, res: Response) {
    const { dataCliente } = req.body;
    const usuarioId = req.user?.sub;

    try {
      const response = await createCliente.execute(
        dataCliente,
        String(usuarioId),
      );
      res.status(201).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new CreateClienteController();
