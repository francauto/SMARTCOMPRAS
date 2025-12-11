import { Router } from "express";
import RelatorioCombustivelEstoqueController from "../../controllers/relatorios/combustivel-estoque.controller";
import AuthMiddleware from "../../middlewares/auth.middleware";

const router = Router();
const authMiddleware = new AuthMiddleware();

/**
 * @route   GET /api/relatorios/combustivel-estoque/consumo-por-veiculo
 * @desc    Retorna análise de consumo por veículo (placa/chassi)
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   placa (opcional) - filtro por placa específica
 * @query   chassi (opcional) - filtro por chassi específico
 * @query   marca (opcional) - filtro por marca
 * @query   modelo (opcional) - filtro por modelo
 * @query   tipo_combustivel (opcional) - filtro por tipo de combustível
 * @query   departamento (opcional) - id do departamento
 * @access  Private
 */
router.get("/consumo-por-veiculo", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.getConsumoPorVeiculo(req, res)
);

/**
 * @route   GET /api/relatorios/combustivel-estoque/analise-temporal
 * @desc    Retorna análise temporal de consumo (agrupado por período)
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   tipo_periodo (opcional) - valores: dia, semana, mes, ano
 * @query   solicitante (opcional) - id do solicitante
 * @query   departamento (opcional) - id do departamento
 * @access  Private
 */
router.get("/analise-temporal", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.getAnaliseTemporal(req, res)
);

/**
 * @route   GET /api/relatorios/combustivel-estoque/por-tipo-combustivel
 * @desc    Retorna análise por tipo de combustível (Gasolina, Diesel, Etanol)
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   departamento (opcional) - id do departamento
 * @query   solicitante (opcional) - id do solicitante
 * @access  Private
 */
router.get("/por-tipo-combustivel", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.getPorTipoCombustivel(req, res)
);

/**
 * @route   GET /api/relatorios/combustivel-estoque/por-departamento
 * @desc    Retorna análise de consumo por departamento
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   tipo_combustivel (opcional) - filtro por tipo de combustível
 * @access  Private
 */
router.get("/por-departamento", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.getPorDepartamento(req, res)
);

/**
 * @route   GET /api/relatorios/combustivel-estoque/por-solicitante
 * @desc    Retorna análise de requisições por solicitante
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   departamento (opcional) - id do departamento
 * @query   tipo_combustivel (opcional) - filtro por tipo de combustível
 * @access  Private
 */
router.get("/por-solicitante", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.getPorSolicitante(req, res)
);

/**
 * @route   GET /api/relatorios/combustivel-estoque/por-marca-modelo
 * @desc    Retorna análise de consumo por marca e modelo de veículo
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   marca (opcional) - filtro por marca específica
 * @query   departamento (opcional) - id do departamento
 * @access  Private
 */
router.get("/por-marca-modelo", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.getPorMarcaModelo(req, res)
);

// tempo-aprovacao route - REMOVIDO

/**
 * @route   GET /api/relatorios/combustivel-estoque/resumo-geral
 * @desc    Retorna resumo geral consolidado de combustível estoque
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   departamento (opcional) - id do departamento
 * @access  Private
 */
router.get("/resumo-geral", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.getResumoGeral(req, res)
);

/**
 * @route   GET /api/relatorios/combustivel-estoque/todas
 * @desc    Retorna todas as requisições de combustível estoque com detalhes completos
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   placa (opcional) - filtro por placa
 * @query   chassi (opcional) - filtro por chassi
 * @query   solicitante (opcional) - id do solicitante
 * @query   aprovador (opcional) - id do aprovador
 * @query   status (opcional) - filtro por status
 * @access  Private
 */
router.get("/todas", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.getTodasRequisicoes(req, res)
);

/**
 * @route   POST /api/relatorios/combustivel-estoque/gerar-pdf
 * @desc    Gera PDF com relatórios selecionados e opcionalmente envia para impressão
 * @body    relatorios (obrigatório) - array com nomes dos relatórios
 * @body    dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @body    dataFim (obrigatório) - formato: YYYY-MM-DD
 * @body    tipo_periodo (opcional) - valores: dia, semana, mes, ano
 * @body    solicitante (opcional) - id do solicitante
 * @body    aprovador (opcional) - id do aprovador
 * @body    departamento (opcional) - id do departamento
 * @body    status (opcional) - filtro por status
 * @body    tipo_combustivel (opcional) - filtro por tipo de combustível
 * @body    placa (opcional) - filtro por placa
 * @body    chassi (opcional) - filtro por chassi
 * @body    marca (opcional) - filtro por marca
 * @body    modelo (opcional) - filtro por modelo
 * @body    printer_ip (opcional) - IP da impressora para envio automático
 * @access  Private
 */
router.post("/gerar-pdf", authMiddleware.authenticate, (req, res) =>
  RelatorioCombustivelEstoqueController.gerarPDFRelatorio(req, res)
);

export default router;
