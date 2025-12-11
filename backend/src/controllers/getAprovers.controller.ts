// controllers/funcionarios.controller.ts
import { Request, Response } from "express";
import { getAprovadores,getDiretoria,getGerentes } from "../services/getAprovers.service";

export async function getFuncionariosController(req: Request, res: Response) {
  try {
    const { tipo } = req.params;

    let data;
    switch (tipo) {
      case "diretoria":
        data = await getDiretoria();
        break;

      case "gerentes":
        data = await getGerentes();
        break;

      case "aprovadores":
        data = await getAprovadores();
        break;

      default:
        return res.status(400).json({ message: "Tipo inválido. Use: diretoria, gerentes ou aprovadores." });
    }

    res.json(data);
  } catch (error) {
    console.error("Erro no controller de funcionários:", error);
    res.status(500).json({ message: "Erro interno ao buscar funcionários." });
  }
}
