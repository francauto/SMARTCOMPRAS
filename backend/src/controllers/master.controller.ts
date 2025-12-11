import { Request, Response } from "express";
import masterService from "../services/master.service";

/**
 * MasterController - Controlador para rotas Master
 *
 * Todos os métodos assumem que:
 * 1. authMiddleware.authenticate já populou req.user
 * 2. masterMiddleware.validateMasterPermission já validou master = 1
 */

// ============================================================================
// MÓDULO: DESPESAS
// ============================================================================

export async function aprovarDespesasComoGerenteController(
  req: Request,
  res: Response
) {
  try {
    const { id_requisicao, id_cota } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao || !id_cota) {
      return res.status(400).json({
        error: "ID da requisição e ID da cota são obrigatórios",
      });
    }

    const resultado = await masterService.aprovarDespesasComoGerente(
      Number(id_requisicao),
      Number(id_cota),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao aprovar despesas como gerente (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes("ainda não") || error.message.includes("deve")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao aprovar despesas como gerente",
      details: error.message,
    });
  }
}

export async function aprovarDespesasComoDiretorController(
  req: Request,
  res: Response
) {
  try {
    const { id_requisicao, id_cota } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao || !id_cota) {
      return res.status(400).json({
        error: "ID da requisição e ID da cota são obrigatórios",
      });
    }

    const resultado = await masterService.aprovarDespesasComoDiretor(
      Number(id_requisicao),
      Number(id_cota),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao aprovar despesas como diretor (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    if (
      error.message.includes("ainda não") ||
      error.message.includes("primeiro")
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao aprovar despesas como diretor",
      details: error.message,
    });
  }
}

export async function recusarDespesasController(req: Request, res: Response) {
  try {
    const { id_requisicao } = req.params;
    const { motivo } = req.body;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.recusarDespesas(
      Number(id_requisicao),
      id_master,
      motivo
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao recusar despesas (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes("não é possível")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao recusar despesas",
      details: error.message,
    });
  }
}

// ============================================================================
// MÓDULO: COMBUSTÍVEL FROTA
// ============================================================================

export async function aprovarCombustivelFrotaController(
  req: Request,
  res: Response
) {
  try {
    const { id_requisicao } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.aprovarCombustivelFrota(
      Number(id_requisicao),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao aprovar combustível frota (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    if (
      error.message.includes("BestDrive") ||
      error.message.includes("controlador")
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao aprovar combustível frota",
      details: error.message,
    });
  }
}

export async function recusarCombustivelFrotaController(
  req: Request,
  res: Response
) {
  try {
    const { id_requisicao } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.recusarCombustivelFrota(
      Number(id_requisicao),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao recusar combustível frota (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    if (
      error.message.includes("BestDrive") ||
      error.message.includes("não é possível")
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao recusar combustível frota",
      details: error.message,
    });
  }
}

// ============================================================================
// MÓDULO: COMBUSTÍVEL ESTOQUE
// ============================================================================

export async function aprovarCombustivelEstoqueController(
  req: Request,
  res: Response
) {
  try {
    const { id_requisicao } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.aprovarCombustivelEstoque(
      Number(id_requisicao),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao aprovar combustível estoque (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao aprovar combustível estoque",
      details: error.message,
    });
  }
}

export async function recusarCombustivelEstoqueController(
  req: Request,
  res: Response
) {
  try {
    const { id_requisicao } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.recusarCombustivelEstoque(
      Number(id_requisicao),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao recusar combustível estoque (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes("não é possível")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao recusar combustível estoque",
      details: error.message,
    });
  }
}

// ============================================================================
// MÓDULO: ESTOQUE
// ============================================================================

export async function aprovarEstoqueController(req: Request, res: Response) {
  try {
    const { id_requisicao } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.aprovarEstoque(
      Number(id_requisicao),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao aprovar estoque (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao aprovar estoque",
      details: error.message,
    });
  }
}

export async function recusarEstoqueController(req: Request, res: Response) {
  try {
    const { id_requisicao } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.recusarEstoque(
      Number(id_requisicao),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao recusar estoque (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes("não é possível")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao recusar estoque",
      details: error.message,
    });
  }
}

// ============================================================================
// MÓDULO: CLIENTE
// ============================================================================

export async function aprovarClienteController(req: Request, res: Response) {
  try {
    const { id_requisicao } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.aprovarCliente(
      Number(id_requisicao),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao aprovar cliente (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao aprovar cliente",
      details: error.message,
    });
  }
}

export async function recusarClienteController(req: Request, res: Response) {
  try {
    const { id_requisicao } = req.params;
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!id_requisicao) {
      return res.status(400).json({
        error: "ID da requisição é obrigatório",
      });
    }

    const resultado = await masterService.recusarCliente(
      Number(id_requisicao),
      id_master
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao recusar cliente (Master):", error);

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes("já")) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes("não é possível")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao recusar cliente",
      details: error.message,
    });
  }
}

// ============================================================================
// CONSULTAS (GET)
// ============================================================================

/**
 * Listar requisições de um módulo específico
 *
 * Query params:
 * - modulo: despesas | combustivel-frota | combustivel-estoque | estoque | cliente
 * - page: número da página (default: 1)
 * - pageSize: itens por página (default: 20)
 * - search: busca por nome, descrição, etc
 * - status: filtrar por status
 * - dataInicio: filtrar por data de criação
 */
export async function listarRequisicoesPorModuloController(
  req: Request,
  res: Response
) {
  try {
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const { modulo } = req.query;

    if (!modulo) {
      return res.status(400).json({
        error: "Parâmetro 'modulo' é obrigatório",
      });
    }

    // Paginação
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    // Filtros
    const filtros = {
      search: (req.query.search as string) || undefined,
      status: (req.query.status as string) || undefined,
      dataInicio: (req.query.dataInicio as string) || undefined,
    };

    const resultado = await masterService.listarRequisicoesPorModulo(
      modulo as string,
      page,
      pageSize,
      filtros
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao listar requisições (Master):", error);

    if (error.message.includes("não reconhecido")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao listar requisições",
      details: error.message,
    });
  }
}

/**
 * Buscar requisição específica por ID e módulo
 *
 * Route params:
 * - modulo: despesas | combustivel-frota | combustivel-estoque | estoque | cliente
 * - id: ID da requisição
 */
export async function buscarRequisicaoPorIdController(
  req: Request,
  res: Response
) {
  try {
    const id_master = req.user?.id;

    if (!id_master) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const { modulo, id } = req.params;

    if (!modulo || !id) {
      return res.status(400).json({
        error: "Parâmetros 'modulo' e 'id' são obrigatórios",
      });
    }

    const requisicao = await masterService.buscarRequisicaoPorId(
      modulo,
      Number(id)
    );

    if (!requisicao) {
      return res.status(404).json({
        error: "Requisição não encontrada",
      });
    }

    res.status(200).json(requisicao);
  } catch (error: any) {
    console.error("Erro ao buscar requisição (Master):", error);

    if (error.message.includes("não reconhecido")) {
      return res.status(400).json({ error: error.message });
    }

    if (
      error.message.includes("não encontrada") ||
      error.message.includes("não encontrado")
    ) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: "Erro ao buscar requisição",
      details: error.message,
    });
  }
}
