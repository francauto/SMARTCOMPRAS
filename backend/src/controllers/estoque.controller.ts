import { Request, Response } from "express";
import {
  getRequisicoes,
  getRequisicoesPorAprovador,
  getRequisicaoPorId,
  criarRequisicaoEstoque,
  responderRequisicao,
} from "../services/estoque.service";
import {
  ICriarRequisicaoEstoque,
  IRespostaRequisicao,
} from "../interfaces/estoque.interface";

export async function getRequisicoesController(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
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

    const resultado = await getRequisicoes(userId, page, pageSize, filtros);

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar requisições:", error);
    res.status(500).json({ error: "Erro ao buscar requisições" });
  }
}

export async function getRequisicoesPorAprovadorController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
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
      userId,
      page,
      pageSize,
      filtros
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar requisições pendentes:", error);
    res.status(500).json({ error: "Erro ao buscar requisições pendentes" });
  }
}

export async function getRequisicaoPorIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID não fornecido" });
    }

    const requisicao = await getRequisicaoPorId(Number(id));

    if (!requisicao) {
      return res.status(404).json({ error: "Requisição não encontrada" });
    }

    res.status(200).json({
      message: "Requisição obtida com sucesso",
      data: [requisicao],
    });
  } catch (error) {
    console.error("Erro ao buscar requisição:", error);
    res.status(500).json({ error: "Erro ao buscar requisição" });
  }
}

export async function criarRequisicaoController(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const {
      fornecedor,
      Itens,
      cliente_venda,
      cod_cliente,
      valor_venda,
      id_aprovador,
      entrega_direta,
      valor_frete,
    } = req.body;

    // Validações dos campos obrigatórios
    if (!fornecedor || !cliente_venda || !cod_cliente || !id_aprovador) {
      return res.status(400).json({
        error:
          "Campos obrigatórios faltando: fornecedor, cliente_venda, cod_cliente, id_aprovador",
      });
    }

    // Validação do array de itens
    if (!Itens || !Array.isArray(Itens) || Itens.length === 0) {
      return res.status(400).json({
        error: "Campo 'Itens' é obrigatório e deve conter pelo menos 1 item",
      });
    }

    // Validação de cada item
    for (const item of Itens) {
      if (!item.descricao || !item.qtde || !item.valor_unitario) {
        return res.status(400).json({
          error: "Cada item deve ter: descricao, qtde e valor_unitario",
        });
      }
      if (item.qtde <= 0) {
        return res.status(400).json({
          error: "Quantidade de cada item deve ser maior que 0",
        });
      }
      if (item.valor_unitario <= 0) {
        return res.status(400).json({
          error: "Valor unitário de cada item deve ser maior que 0",
        });
      }
    }

    const requisicaoId = await criarRequisicaoEstoque({
      fornecedor,
      Itens,
      valor_custo: 0, // Será calculado automaticamente
      cliente_venda,
      cod_cliente,
      valor_venda: valor_venda || 0,
      id_aprovador,
      id_solicitante: userId,
      entrega_direta: entrega_direta || false,
      valor_frete: valor_frete || 0,
    });

    res.status(201).json({
      message: "Solicitação de estoque enviada com sucesso",
      id: requisicaoId,
    });
  } catch (error) {
    console.error("Erro ao processar a solicitação de estoque:", error);
    res
      .status(500)
      .json({ error: "Erro ao processar a solicitação de estoque" });
  }
}

export async function responderRequisicaoController(
  req: Request,
  res: Response
) {
  try {
    const { id_requisicao, aprovado } = req.body;

    if (!id_requisicao || typeof aprovado !== "boolean") {
      return res.status(400).json({
        error: "Campos obrigatórios faltando (id_requisicao, aprovado)",
      });
    }

    const dados: IRespostaRequisicao = {
      id_requisicao,
      aprovado,
    };

    const result = await responderRequisicao(dados);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao processar resposta da requisição:", error);

    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }

    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }

    res
      .status(500)
      .json({ error: "Erro ao processar a resposta da requisição" });
  }
}
