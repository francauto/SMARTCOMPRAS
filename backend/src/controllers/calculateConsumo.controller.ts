import { Request, Response } from "express";
import { getCarsConsumo, getConsumoVeiculos } from "../services/calculateConsumo.service";

export async function listarConsumo(req: Request, res: Response) {
  try {
    const { veiculo_id, dataInicio, dataFim, departamento, limite } = req.query;

    const resultado = await getConsumoVeiculos({
      veiculo_id: veiculo_id ? Number(veiculo_id) : undefined,
      dataInicio: dataInicio as string,
      dataFim: dataFim as string,
      departamento: departamento ? Number(departamento) : undefined,
      limite: limite ? Number(limite) : 2,
    });

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro no controller de consumo:", error);
    res.status(500).json({
      status: false,
      message: "Erro ao calcular consumo dos veículos",
    });
  }
}

export async function getCarsConsumoController(req:Request,res:Response){
    try{
        const response = await getCarsConsumo();
         res.status(200).json(response);
    }catch(error){
         res.status(500).json(error);
    }
}