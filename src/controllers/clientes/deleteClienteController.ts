import { Response } from "express";

import deleteCliente from "../../models/clientes/deleteCliente";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class DeleteClienteController {
  async handle(req: AuthRequest, res: Response) {
    const { clienteId } = req.body;
    const usuarioId = req.user?.sub;
    try {
      const response = await deleteCliente.execute(
        clienteId,
        String(usuarioId),
      );
      res.status(200).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new DeleteClienteController();
