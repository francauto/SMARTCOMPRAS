import {getDepartamentosService} from "../services/getDepartamentos.service";
import { Request, Response } from "express";

export async function getDepartamentosController(req: Request, res: Response) {
    try {
        const departamentos = await getDepartamentosService();
        return res.status(200).json(departamentos);
    } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        return res.status(500).json({ message: "Erro ao buscar departamentos" });
    }}