import { Response } from "express";
import editCliente from "../../models/clientes/editCliente";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class EditClienteController {
  async handle(req: AuthRequest, res: Response) {
    const { dataCliente, clienteId } = req.body;
    const usuarioId = req.user?.sub;
    try {
      const response = await editCliente.execute(
        dataCliente,
        clienteId,
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
export default new EditClienteController();
