import { Request, Response } from "express";
import {
  getRequisicoesPorSolicitante,
  getRequisicoesPorAprovador,
  getRequisicaoPorId,
  criarRequisicaoCliente,
  responderRequisicao,
} from "../services/cliente.service";
import {
  ICriarRequisicaoCliente,
  IRespostaRequisicaoCliente,
} from "../interfaces/cliente.interface";

export async function getRequisicoesPorSolicitanteController(
  req: Request,
  res: Response
) {
  try {
    const id_solicitante = req.user?.id;

    if (!id_solicitante) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Paginação
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    // Filtros
    const filtros = {
      search: (req.query.search as string) || undefined,
      dataInicio: (req.query.dataInicio as string) || undefined,
      status: (req.query.status as string) || undefined,
    };

    const resultado = await getRequisicoesPorSolicitante(
      id_solicitante,
      page,
      pageSize,
      filtros
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar requisições do solicitante:", error);
    res.status(500).json({ error: "Erro ao buscar requisições" });
  }
}

export async function getRequisicoesPorAprovadorController(
  req: Request,
  res: Response
) {
  try {
    const id_aprovador = req.user?.id;

    if (!id_aprovador) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Paginação
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    // Filtros
    const filtros = {
      search: (req.query.search as string) || undefined,
      dataInicio: (req.query.dataInicio as string) || undefined,
      status: (req.query.status as string) || undefined,
    };

    const resultado = await getRequisicoesPorAprovador(
      id_aprovador,
      page,
      pageSize,
      filtros
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar requisições do aprovador:", error);
    res.status(500).json({ error: "Erro ao buscar requisições" });
  }
}

export async function getRequisicaoPorIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID da requisição não fornecido" });
    }

    const requisicao = await getRequisicaoPorId(Number(id));

    if (!requisicao) {
      return res.status(404).json({ error: "Requisição não encontrada" });
    }

    res.status(200).json({
      message: "Requisição obtida com sucesso",
      data: requisicao,
    });
  } catch (error) {
    console.error("Erro ao buscar requisição:", error);
    res.status(500).json({ error: "Erro ao buscar requisição" });
  }
}

export async function criarRequisicaoClienteController(
  req: Request,
  res: Response
) {
  try {
    const id_solicitante = req.user?.id;

    if (!id_solicitante) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { descricao, valor, id_aprovador } = req.body;

    if (!descricao || !valor || !id_aprovador) {
      return res.status(400).json({
        error: "Campos obrigatórios: descricao, valor, id_aprovador",
      });
    }

    const dados: ICriarRequisicaoCliente = {
      descricao,
      valor: Number(valor),
      id_aprovador: Number(id_aprovador),
      id_solicitante,
    };

    const requisicaoId = await criarRequisicaoCliente(dados);

    res.status(201).json({
      message: "Requisição criada com sucesso",
      id_requisicao: requisicaoId,
    });
  } catch (error: any) {
    console.error("Erro ao criar requisição:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    res.status(500).json({ error: "Erro ao criar requisição" });
  }
}

export async function responderRequisicaoController(
  req: Request,
  res: Response
) {
  try {
    const { id_requisicao, aprovado } = req.body;

    if (!id_requisicao || aprovado === undefined) {
      return res.status(400).json({
        error: "Campos obrigatórios: id_requisicao, aprovado",
      });
    }

    const dados: IRespostaRequisicaoCliente = {
      id_requisicao: Number(id_requisicao),
      aprovado: Boolean(aprovado),
    };

    const result = await responderRequisicao(dados);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao responder requisição:", error);

    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }

    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }

    if (error.statusCode === 500) {
      return res.status(500).json({ error: error.message });
    }

    res.status(500).json({ error: "Erro ao processar resposta da requisição" });
  }
}
