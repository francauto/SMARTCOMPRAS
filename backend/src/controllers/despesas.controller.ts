import { Request, Response } from "express";
import despesasService from "../services/despesas.service";
import { IDespesas } from "../interfaces/despesas.interface";

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

    const result = await despesasService.getRequisicoes(
      userId,
      page,
      pageSize,
      filtros
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar requisições de despesas:", error);
    res.status(500).json({ error: "Erro ao buscar requisições de despesas" });
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

    const result = await despesasService.getRequisicoesPorAprovador(
      userId,
      page,
      pageSize,
      filtros
    );

    if (result.data.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhuma requisição encontrada." });
    }

    res.status(200).json(result);
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
      return res.status(400).json({ error: "ID da requisição não fornecido" });
    }

    const requisicao = await despesasService.getRequisicaoPorId(Number(id));

    if (!requisicao) {
      return res.status(404).json({ error: "Solicitação não encontrada" });
    }

    res.status(200).json(requisicao);
  } catch (error) {
    console.error("Erro ao consultar a solicitação:", error);
    res.status(500).json({ error: "Erro ao consultar a solicitação" });
  }
}

export async function criarSolicitacaoController(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { descricao, id_diretor, fornecedores, departamentos } = req.body;

    if (!descricao || !id_diretor || !fornecedores || !departamentos) {
      return res.status(400).json({
        error:
          "Campos obrigatórios: descricao, id_diretor, fornecedores, departamentos",
      });
    }

    if (!Array.isArray(fornecedores) || fornecedores.length === 0) {
      return res.status(400).json({
        error: "Deve haver pelo menos um fornecedor com itens",
      });
    }

    if (!Array.isArray(departamentos) || departamentos.length === 0) {
      return res.status(400).json({
        error: "Deve haver pelo menos um departamento para rateio",
      });
    }

    const totalPercentual = departamentos.reduce(
      (acc, dep) => acc + (dep.percentual_rateio || 0),
      0
    );
    if (totalPercentual !== 100) {
      return res.status(400).json({
        error: "A soma dos percentuais de rateio deve ser igual a 100%",
      });
    }

    for (const fornecedor of fornecedores) {
      if (
        !fornecedor.nome ||
        !fornecedor.itens ||
        fornecedor.itens.length === 0
      ) {
        return res.status(400).json({
          error: "Cada fornecedor deve ter nome e pelo menos um item",
        });
      }

      for (const item of fornecedor.itens) {
        if (
          !item.descricao_item ||
          !item.qtde ||
          item.qtde <= 0 ||
          !item.valor_unitario ||
          item.valor_unitario <= 0
        ) {
          return res.status(400).json({
            error:
              "Cada item deve ter descricao_item, qtde (maior que 0) e valor_unitario (maior que 0)",
          });
        }
      }
    }

    const payload: IDespesas = {
      descricao,
      id_solicitante: userId,
      id_diretor: Number(id_diretor),
      fornecedores,
      departamentos,
    };

    const result = await despesasService.criarSolicitacao(payload);

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Erro ao criar solicitação de despesa:", error);

    if (error.message?.includes("Nenhum gerente atribuído")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao criar solicitação de despesa",
      details: error.message,
    });
  }
}

export async function aprovarCotaGerenteController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { id_cota, id_requisicao } = req.body;

    if (!id_cota || !id_requisicao) {
      return res.status(400).json({
        error: "Campos obrigatórios: id_cota, id_requisicao",
      });
    }

    const result = await despesasService.aprovarCotaGerente(
      Number(id_cota),
      userId,
      Number(id_requisicao)
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao aprovar cota pelo gerente:", error);

    if (
      error.message?.includes("não encontrada") ||
      error.message?.includes("já aprovou") ||
      error.message?.includes("Já existe uma cota aprovada")
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao aprovar cota pelo gerente",
      details: error.message,
    });
  }
}

export async function aprovarCotaDiretorController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { id_requisicao, id_cota } = req.body;

    if (!id_requisicao || !id_cota) {
      return res.status(400).json({
        error: "Campos obrigatórios: id_requisicao, id_cota",
      });
    }

    const result = await despesasService.aprovarCotaDiretor(
      Number(id_requisicao),
      Number(id_cota),
      userId
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao aprovar cota pelo diretor:", error);

    if (
      error.message?.includes("inválida") ||
      error.message?.includes("não encontrada") ||
      error.message?.includes("já foi aprovada") ||
      error.message?.includes("não foi aprovada por gerentes")
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao aprovar cota pelo diretor",
      details: error.message,
    });
  }
}

export async function recusarCotaController(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { id_requisicao, id_cota } = req.body;

    if (!id_requisicao || !id_cota) {
      return res.status(400).json({
        error: "Campos obrigatórios: id_requisicao, id_cota",
      });
    }

    const result = await despesasService.recusarCota(
      Number(id_requisicao),
      Number(id_cota),
      userId
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao recusar cota:", error);

    if (
      error.message?.includes("não encontrada") ||
      error.message?.includes("não encontrado") ||
      error.message?.includes("já foi aprovada")
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao recusar cota",
      details: error.message,
    });
  }
}
