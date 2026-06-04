import { Response } from "express";
import getClientes from "../../models/clientes/getClientes";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class getClientesController {
  async handle(req: AuthRequest, res: Response) {
    const usuarioId = req.user?.sub;
    try {
      const response = await getClientes.execute(String(usuarioId));
      res.status(200).json(response);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
    }
  }
}
export default new getClientesController();
