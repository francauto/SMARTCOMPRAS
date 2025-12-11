import { resBestDriveUso, getCarsBestDrive, getHistoryCars } from "../services/apibestdrive.service";
import { Request, Response } from "express";
import { BestDriveUsoResponse } from "../interfaces/bestDriveApi.interface";

export async function resBestDriveUsoController(req: Request, res: Response) {
    const responseBody: BestDriveUsoResponse = req.body;

    if (!responseBody) {
        return res.status(400).json({ message: "Payload inválido" });
    }
    try {
        await resBestDriveUso(responseBody);
        return res.status(200).json({ message: "Resposta do BestDrive processada com sucesso" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao processar resposta do BestDrive: " + error });
    }
    
}


export async function getCarsController(req: Request, res: Response) {

    try{
        const carsResponse = await getCarsBestDrive();
       
        return res.status(200).json(carsResponse);
    }catch(error){
        return res.status(500).json({ message: "Erro ao buscar carros do BestDrive: " + error });
    }
}


export async function getHistoryCarsController(req:Request, res:Response){
    const id_veiculo = req.params.id_veiculo
    try{
        const historyResponse = await getHistoryCars(Number(id_veiculo))

        return res.status(200).json(historyResponse)
    }catch(error){
        return res.status(500).json({message: "Erro ao recuperar historico do BestDrive" + error})
    }
}

