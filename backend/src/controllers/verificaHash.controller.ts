import { buscaHashService,atualizaUsoHashService } from "../services/verificaHash.service";
import { Request, Response } from "express";


export async function buscarHashController(req: Request, res: Response) {
    const {hash} = req.body;

    if (!hash) {
        throw new Error("Hash não fornecido");
    }

    try {
        const resultado = await buscaHashService(hash);
        return res.status(200).json(resultado);
    } catch (error) {
        console.error("Erro ao buscar hash:", error);
        return res.status(500).json({ message: "Erro ao buscar hash" });
    }

}


export async function atualizarUsoHashController(req: Request, res: Response) {
    const { hash, funcionario_id } = req.body;

    if (!hash || funcionario_id === undefined) {
        return res.status(400).json({ message: "Hash ou validação não fornecido" });
    }

    try{
        const resultado = await atualizaUsoHashService(hash, funcionario_id);
        return res.status(200).json(resultado);
    }
    catch (error) {
        console.error("Erro ao atualizar uso do hash:", error);
        return res.status(500).json({ message: "Erro ao atualizar uso do hash" });
    }
}

