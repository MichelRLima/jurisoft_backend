import { Response } from "express";
import findPrazosCliente from "../../models/prazos/findPrazosCliente";
import { AuthRequest } from "../../middlewares/isAuthenticated";

class FindPrazosClienteController {
  async handle(req: AuthRequest, res: Response) {
    const { clienteId } = req.body;
    const usuarioId = req.user?.sub;
    if (!usuarioId) {
      res.status(401).json({ error: "Usuário não identificado." });
    }

    if (!clienteId) {
      res.status(400).json({ error: "Cliente não informado" });
    }

    try {
      const prazos = await findPrazosCliente.execute(
        String(usuarioId),
        clienteId,
      );
      res.status(200).json(prazos);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new FindPrazosClienteController();
