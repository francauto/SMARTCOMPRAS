import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware";
import masterMiddleware from "../middlewares/master.middleware";
import * as masterController from "../controllers/master.controller";

const router = Router();
const authMiddleware = new AuthMiddleware();

/**
 * TODAS AS ROTAS MASTER REQUEREM:
 * 1. Autenticação (authMiddleware.authenticate)
 * 2. Permissão Master (masterMiddleware.validateMasterPermission)
 */

const masterAuthChain = [
  authMiddleware.authenticate,
  masterMiddleware.validateMasterPermission,
];

// ============================================================================
// MÓDULO: DESPESAS
// ============================================================================

/**
 * @route   POST /api/master/despesas/aprovar-gerente/:id_requisicao/:id_cota
 * @desc    Aprovar despesas como gerente (Master sobrescreve aprovação)
 * @access  Private (Master only)
 */
router.post(
  "/despesas/aprovar-gerente/:id_requisicao/:id_cota",
  masterAuthChain,
  masterController.aprovarDespesasComoGerenteController
);

/**
 * @route   POST /api/master/despesas/aprovar-diretor/:id_requisicao/:id_cota
 * @desc    Aprovar despesas como diretor (Master sobrescreve aprovação)
 * @access  Private (Master only)
 */
router.post(
  "/despesas/aprovar-diretor/:id_requisicao/:id_cota",
  masterAuthChain,
  masterController.aprovarDespesasComoDiretorController
);

/**
 * @route   POST /api/master/despesas/recusar/:id_requisicao
 * @desc    Recusar despesas (Master pode recusar com motivo opcional)
 * @access  Private (Master only)
 * @body    { motivo?: string }
 */
router.post(
  "/despesas/recusar/:id_requisicao",
  masterAuthChain,
  masterController.recusarDespesasController
);

// ============================================================================
// MÓDULO: COMBUSTÍVEL FROTA
// ============================================================================

/**
 * @route   POST /api/master/combustivel-frota/aprovar/:id_requisicao
 * @desc    Aprovar requisição de combustível frota (valida BestDrive primeiro)
 * @access  Private (Master only)
 */
router.post(
  "/combustivel-frota/aprovar/:id_requisicao",
  masterAuthChain,
  masterController.aprovarCombustivelFrotaController
);

/**
 * @route   POST /api/master/combustivel-frota/recusar/:id_requisicao
 * @desc    Recusar requisição de combustível frota (valida BestDrive primeiro)
 * @access  Private (Master only)
 * @body    { motivo?: string }
 */
router.post(
  "/combustivel-frota/recusar/:id_requisicao",
  masterAuthChain,
  masterController.recusarCombustivelFrotaController
);

// ============================================================================
// MÓDULO: COMBUSTÍVEL ESTOQUE
// ============================================================================

/**
 * @route   POST /api/master/combustivel-estoque/aprovar/:id_requisicao
 * @desc    Aprovar requisição de combustível estoque
 * @access  Private (Master only)
 */
router.post(
  "/combustivel-estoque/aprovar/:id_requisicao",
  masterAuthChain,
  masterController.aprovarCombustivelEstoqueController
);

/**
 * @route   POST /api/master/combustivel-estoque/recusar/:id_requisicao
 * @desc    Recusar requisição de combustível estoque
 * @access  Private (Master only)
 * @body    { motivo?: string }
 */
router.post(
  "/combustivel-estoque/recusar/:id_requisicao",
  masterAuthChain,
  masterController.recusarCombustivelEstoqueController
);

// ============================================================================
// MÓDULO: ESTOQUE
// ============================================================================

/**
 * @route   POST /api/master/estoque/aprovar/:id_requisicao
 * @desc    Aprovar requisição de estoque
 * @access  Private (Master only)
 */
router.post(
  "/estoque/aprovar/:id_requisicao",
  masterAuthChain,
  masterController.aprovarEstoqueController
);

/**
 * @route   POST /api/master/estoque/recusar/:id_requisicao
 * @desc    Recusar requisição de estoque
 * @access  Private (Master only)
 * @body    { motivo?: string }
 */
router.post(
  "/estoque/recusar/:id_requisicao",
  masterAuthChain,
  masterController.recusarEstoqueController
);

// ============================================================================
// MÓDULO: CLIENTE
// ============================================================================

/**
 * @route   POST /api/master/cliente/aprovar/:id_requisicao
 * @desc    Aprovar requisição de cliente
 * @access  Private (Master only)
 */
router.post(
  "/cliente/aprovar/:id_requisicao",
  masterAuthChain,
  masterController.aprovarClienteController
);

/**
 * @route   POST /api/master/cliente/recusar/:id_requisicao
 * @desc    Recusar requisição de cliente
 * @access  Private (Master only)
 * @body    { motivo?: string }
 */
router.post(
  "/cliente/recusar/:id_requisicao",
  masterAuthChain,
  masterController.recusarClienteController
);

// ============================================================================
// CONSULTAS (GET)
// ============================================================================

/**
 * @route   GET /api/master/requisicoes?modulo=despesas&page=1&pageSize=20&search=...&status=...&dataInicio=...
 * @desc    Listar requisições de um módulo específico com filtros
 * @access  Private (Master only)
 * @query   modulo (required): despesas | combustivel-frota | combustivel-estoque | estoque | cliente
 * @query   page (optional): Número da página (default: 1)
 * @query   pageSize (optional): Itens por página (default: 20)
 * @query   search (optional): Busca por nome, descrição, placa, etc
 * @query   status (optional): Filtrar por status (Pendente, Aprovado, Reprovado, etc)
 * @query   dataInicio (optional): Filtrar por data de criação (formato: YYYY-MM-DD)
 */
router.get(
  "/requisicoes",
  masterAuthChain,
  masterController.listarRequisicoesPorModuloController
);

/**
 * @route   GET /api/master/requisicoes/:modulo/:id
 * @desc    Buscar detalhes de uma requisição específica
 * @access  Private (Master only)
 * @params  modulo (required): despesas | combustivel-frota | combustivel-estoque | estoque | cliente
 * @params  id (required): ID da requisição
 */
router.get(
  "/requisicoes/:modulo/:id",
  masterAuthChain,
  masterController.buscarRequisicaoPorIdController
);

export default router;
