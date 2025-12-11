import { Router } from "express";
import RelatorioDespesasController from "../../controllers/relatorios/despesas.controller";
import AuthMiddleware from "../../middlewares/auth.middleware";

const router = Router();
const authMiddleware = new AuthMiddleware();

/**
 * @route   GET /api/relatorios/despesas/analise-temporal
 * @desc    Análise temporal de despesas (por dia/semana/mês/ano)
 * @access  Private
 * @query   dataInicio, dataFim, tipo_periodo?, solicitante?, aprovador?, departamento?, status?
 */
router.get(
  "/analise-temporal",
  authMiddleware.authenticate,
  RelatorioDespesasController.getAnaliseTemporal.bind(
    RelatorioDespesasController
  )
);

/**
 * @route   GET /api/relatorios/despesas/gastos-por-departamento
 * @desc    Gastos por departamento com top 3 solicitantes por departamento
 * @access  Private
 * @query   dataInicio, dataFim, solicitante?, aprovador?, departamento?, status?
 */
router.get(
  "/gastos-por-departamento",
  authMiddleware.authenticate,
  RelatorioDespesasController.getGastosPorDepartamento.bind(
    RelatorioDespesasController
  )
);

/**
 * @route   GET /api/relatorios/despesas/comparativo-cotacoes
 * @desc    Comparativo de cotações mostrando economia gerada
 * @access  Private
 * @query   dataInicio, dataFim, solicitante?, aprovador?, departamento?, status?
 */
router.get(
  "/comparativo-cotacoes",
  authMiddleware.authenticate,
  RelatorioDespesasController.getComparativoCotacoes.bind(
    RelatorioDespesasController
  )
);

/**
 * @route   GET /api/relatorios/despesas/resumo-geral
 * @desc    Resumo geral com totais agregados
 * @access  Private
 * @query   dataInicio, dataFim, solicitante?, aprovador?, departamento?, status?
 */
router.get(
  "/resumo-geral",
  authMiddleware.authenticate,
  RelatorioDespesasController.getResumoGeral.bind(RelatorioDespesasController)
);

/**
 * @route   GET /api/relatorios/despesas/todas
 * @desc    Todas as requisições de despesas detalhadas
 * @access  Private
 * @query   dataInicio, dataFim, solicitante?, aprovador?, departamento?, status?
 */
router.get(
  "/todas",
  authMiddleware.authenticate,
  RelatorioDespesasController.getTodasRequisicoes.bind(
    RelatorioDespesasController
  )
);

/**
 * @route   POST /api/relatorios/despesas/gerar-pdf
 * @desc    Gerar PDF com relatórios de despesas selecionados
 * @access  Private
 * @body    { relatorios: string[], dataInicio, dataFim, tipo_periodo?, solicitante?, aprovador?, departamento?, status? }
 */
router.post(
  "/gerar-pdf",
  authMiddleware.authenticate,
  RelatorioDespesasController.gerarPDFRelatorio.bind(
    RelatorioDespesasController
  )
);

export default router;
