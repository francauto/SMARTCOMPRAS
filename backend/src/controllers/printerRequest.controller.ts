import {
  interfaceResponseAgentPrinter,
  PrinterParamsInterfaceAgent,
} from "../interfaces/printerParams.interface";
import { getPrinters, printRequestsAgentService } from "../services/printer.service";
import { Request, Response } from "express";

export async function printerRequestController(
  req: Request,
  res: Response
): Promise<Response<interfaceResponseAgentPrinter>> {
  const payload: PrinterParamsInterfaceAgent = req.body;

  if (!payload.id_requisicao && !payload.nametable && !payload.printer_ip) {
    return res.status(500).json("O payload de envio esta errado.");
  }
  try {
    const callPrinter = await printRequestsAgentService(payload);

    if (callPrinter.success === true) {
      return res.status(200).json({
        success: true,
        error: null,
        id_requisicao: payload.id_requisicao,
        tipo: payload.nametable,
      });
    }
    return res.status(500).json({
      success: false,
      error: "A impressão falhou",
      id_requisicao: payload.id_requisicao,
      tipo: payload.nametable,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erro interno, contatar time de TI",
      id_requisicao: payload.id_requisicao,
      tipo: payload.nametable,
    });
  }
}


export async function getPrinterController(req:Request,res:Response){
    try{
        const getPrinter = await getPrinters();
        return res.status(200).json(getPrinter);
    }catch (error){
        return res.status(500).json("Erro ao buscar impressora" + error)
    }
}