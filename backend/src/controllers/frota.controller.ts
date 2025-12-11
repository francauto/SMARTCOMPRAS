import { Request, Response } from "express";
import {
  getFrotaPendente,
  getFrotaPendenteSolicitante,
  getSolicitacaoFrotaById,
  analyzeCupomFrota,
  confirmCupomFrota,
  resRequestFrota,
  sendRequest,
} from "../services/frotaCombustivel.service";
import { sendFrotaRequest } from "../interfaces/frotaCombustivel.interface";
import { printRequestsAgentService } from "../services/printer.service";
import fs from "fs";

export async function sendRequestFrotaController(req: Request, res: Response) {
  const payload: sendFrotaRequest = req.body;

  if (!payload) {
    return res.status(400).json({ message: "Payload inválido" });
  }
  try {
    const result = await sendRequest(payload);

    return res
      .status(201)
      .json({ message: "Solicitação de frota criada com sucesso" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erro ao criar solicitação de frota" + error });
  }
}

export async function getFrotaPendenteController(req: Request, res: Response) {
  try {
    const idAprovador = Number(req.params.idAprovador);
    if (!idAprovador || isNaN(idAprovador) || idAprovador <= 0) {
      return res.status(400).json({ message: "ID do aprovador inválido" });
    }
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const status = req.query.status ? String(req.query.status) : "";
    const search = req.query.search ? String(req.query.search) : "";

    const filtros = { status, search };
    const result = await getFrotaPendente(idAprovador, page, pageSize, filtros);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar solicitações de frota:", error);
    return res.status(500).json({
      message: "Erro ao buscar solicitações de frota",
      error: (error as Error).message,
    });
  }
}

export async function getFrotaPendenteSolicitanteController(
  req: Request,
  res: Response
) {
  try {
    const idSolicitante = Number(req.params.idSolicitante);
    if (!idSolicitante || isNaN(idSolicitante) || idSolicitante <= 0) {
      return res.status(400).json({ message: "ID do solicitante inválido" });
    }
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const status = req.query.status ? String(req.query.status) : "";
    const search = req.query.search ? String(req.query.search) : "";

    const filtros = { status, search };
    const result = await getFrotaPendenteSolicitante(
      idSolicitante,
      page,
      pageSize,
      filtros
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar solicitações de frota:", error);
    return res.status(500).json({
      message: "Erro ao buscar solicitações de frota",
      error: (error as Error).message,
    });
  }
}

export async function getSolicitacaoFrotaByIdContrtoller(
  req: Request,
  res: Response
) {
  const id = Number(req.params.id);
  if (!id || isNaN(id) || id <= 0) {
    return res.status(400).json({ message: "ID da solicitação inválido" });
  }
  try {
    const result: any = await getSolicitacaoFrotaById(id);
    res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erro ao buscar solicitação de frota por ID" + error });
  }
}

export async function resRequestFrotaController(req: Request, res: Response) {
  const id_requisicao = Number(req.params.id_requisicao);
  const { aprovado } = req.body;
  if (!id_requisicao || isNaN(id_requisicao) || id_requisicao <= 0) {
    return res.status(400).json({ message: "ID da requisição inválido" });
  }
  try {
    await resRequestFrota(id_requisicao, aprovado);
    return res.status(200).json({
      message: "Resposta da requisição de frota registrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao registrar resposta da requisição de frota" + error,
    });
  }
}

// Controller 1: Analisa o cupom e retorna os dados extraídos
export async function analyzeCupomFrotaController(req: Request, res: Response) {
  try {
    const id_requisicao = Number(req.params.id_requisicao);
    if (!id_requisicao || isNaN(id_requisicao) || id_requisicao <= 0) {
      return res.status(400).json({ message: "ID da requisição inválido." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }
    console.log("📸 Recebendo imagem:", req.file.originalname);

    const result = await analyzeCupomFrota(id_requisicao, req.file.path);

    // Remove o arquivo após análise
    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      success: true,
      message: "Cupom analisado com sucesso.",
      dados: result.dados,
    });
  } catch (error: any) {
    console.error("❌ Erro ao analisar cupom:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao analisar cupom.",
    });
  }
}

// Controller 2: Confirma e salva os dados do cupom
export async function confirmCupomFrotaController(req: Request, res: Response) {
  try {
    const id_requisicao = Number(req.params.id_requisicao);
    const { litros, valor_por_litro, valor_total } = req.body;

    if (!id_requisicao || isNaN(id_requisicao) || id_requisicao <= 0) {
      return res.status(400).json({ message: "ID da requisição inválido." });
    }

    if (!litros || !valor_por_litro || !valor_total) {
      return res.status(400).json({
        message:
          "Dados incompletos. Informe litros, valor_por_litro e valor_total.",
      });
    }

    const result = await confirmCupomFrota(
      id_requisicao,
      Number(litros),
      Number(valor_por_litro),
      Number(valor_total)
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      dados: result.dados,
    });
  } catch (error: any) {
    console.error("❌ Erro ao confirmar cupom:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao confirmar cupom.",
    });
  }
}
