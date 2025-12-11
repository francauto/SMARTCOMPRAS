import { Request, Response } from "express";
import { IUpdateUsuario } from "../interfaces/admin.interface";
import {
  getAllUsuarios,
  updateUsuario,
  resetSenhaUsuario,
} from "../services/admin.service";

export async function getAllUsuariosController(req: Request, res: Response) {
  try {
    const usuarios = await getAllUsuarios();

    res.status(200).json({
      message: "Usuários obtidos com sucesso",
      data: usuarios,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
}

export async function updateUsuarioController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID do usuário não fornecido" });
    }

    const dados: IUpdateUsuario = {
      nome: req.body.nome,
      sobrenome: req.body.sobrenome,
      usuario: req.body.usuario,
      cargo: req.body.cargo,
      mail: req.body.mail,
      telefone: req.body.telefone,
      aut_wpp: req.body.aut_wpp,
      ativo: req.body.ativo,
      id_departamento: req.body.id_departamento,
      master: req.body.master,
      verificador: req.body.verificador,
      cargo_bestdrive_id: req.body.cargo_bestdrive_id,
      cargo_bestdrive: req.body.cargo_bestdrive,
    };

    // Remover campos undefined
    Object.keys(dados).forEach((key) => {
      if (dados[key as keyof IUpdateUsuario] === undefined) {
        delete dados[key as keyof IUpdateUsuario];
      }
    });

    const result = await updateUsuario(Number(id), dados);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao atualizar usuário:", error);

    if (error.message === "Usuário não encontrado") {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === "Nenhum campo fornecido para atualização") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
}

export async function resetSenhaUsuarioController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID do usuário não fornecido" });
    }

    const result = await resetSenhaUsuario(Number(id));

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao resetar senha do usuário:", error);

    if (error.message === "Usuário não encontrado") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: "Erro ao resetar senha do usuário" });
  }
}
