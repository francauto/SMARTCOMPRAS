import { Router } from "express";
import RelatorioEstoqueController from "../../controllers/relatorios/estoque.controller";
import AuthMiddleware from "../../middlewares/auth.middleware";

const router = Router();
const authMiddleware = new AuthMiddleware();

/**
 * @route   GET /api/relatorios/estoque/valor-compra-venda
 * @desc    Retorna comparativo entre valor de compra e valor de venda
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   tipo_periodo (opcional) - valores: dia, semana, mes, ano
 * @query   fornecedor (opcional) - filtro por fornecedor
 * @query   item (opcional) - filtro por item
 * @query   solicitante (opcional) - id do solicitante
 * @access  Private
 */
router.get("/valor-compra-venda", authMiddleware.authenticate, (req, res) =>
  RelatorioEstoqueController.getValorCompraVenda(req, res)
);

/**
 * @route   GET /api/relatorios/estoque/valor-frete
 * @desc    Retorna valor total de frete por período
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   tipo_periodo (opcional) - valores: dia, semana, mes, ano
 * @query   fornecedor (opcional) - filtro por fornecedor
 * @access  Private
 */
router.get("/valor-frete", authMiddleware.authenticate, (req, res) =>
  RelatorioEstoqueController.getValorFrete(req, res)
);

/**
 * @route   GET /api/relatorios/estoque/por-solicitante
 * @desc    Retorna quantidade de requisições e valores por solicitante
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   solicitante (opcional) - id do solicitante específico
 * @access  Private
 */
router.get("/por-solicitante", authMiddleware.authenticate, (req, res) =>
  RelatorioEstoqueController.getRequisicoesPorSolicitante(req, res)
);

/**
 * @route   GET /api/relatorios/estoque/entregas-diretas
 * @desc    Retorna quantidade de entregas diretas por período
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   tipo_periodo (opcional) - valores: dia, semana, mes, ano
 * @query   fornecedor (opcional) - filtro por fornecedor
 * @access  Private
 */
router.get("/entregas-diretas", authMiddleware.authenticate, (req, res) =>
  RelatorioEstoqueController.getEntregasDiretas(req, res)
);

/**
 * @route   GET /api/relatorios/estoque/resumo-geral
 * @desc    Retorna resumo geral com totais e top rankings
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   fornecedor (opcional) - filtro por fornecedor
 * @access  Private
 */
router.get("/resumo-geral", authMiddleware.authenticate, (req, res) =>
  RelatorioEstoqueController.getResumoGeral(req, res)
);

/**
 * @route   GET /api/relatorios/estoque/todas
 * @desc    Retorna todas as requisições de estoque com detalhes completos
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   fornecedor (opcional) - filtro por fornecedor
 * @query   solicitante (opcional) - id do solicitante
 * @access  Private
 */
router.get("/todas", authMiddleware.authenticate, (req, res) =>
  RelatorioEstoqueController.getTodasRequisicoes(req, res)
);

/**
 * @route   POST /api/relatorios/estoque/gerar-pdf
 * @desc    Gera PDF com relatórios selecionados e opcionalmente envia para impressão
 * @body    relatorios (obrigatório) - array com nomes dos relatórios
 * @body    dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @body    dataFim (obrigatório) - formato: YYYY-MM-DD
 * @body    tipo_periodo (opcional) - valores: dia, semana, mes, ano
 * @body    fornecedor (opcional) - filtro por fornecedor
 * @body    solicitante (opcional) - id do solicitante
 * @body    entregaDireta (opcional) - filtro por entrega direta (true/false)
 * @body    printer_ip (opcional) - IP da impressora para envio automático
 * @access  Private
 */
router.post("/gerar-pdf", authMiddleware.authenticate, (req, res) =>
  RelatorioEstoqueController.gerarPDFRelatorio(req, res)
);

export default router;
