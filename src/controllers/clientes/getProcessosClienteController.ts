import { Response } from "express";

import getProcessosCliente from "../../models/clientes/getProcessosCliente";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class getProcessosClienteController {
  async handle(req: AuthRequest, res: Response) {
    const { clienteId } = req.body;
    const usuarioId = req.user?.sub;
    try {
      const response = await getProcessosCliente.execute(
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
export default new getProcessosClienteController();
