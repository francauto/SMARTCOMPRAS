import { Router } from "express";
import RelatorioClienteController from "../../controllers/relatorios/cliente.controller";
import AuthMiddleware from "../../middlewares/auth.middleware";

const router = Router();
const authMiddleware = new AuthMiddleware();

/**
 * @route   GET /api/relatorios/cliente/todas
 * @desc    Retorna todas as requisições de cliente com detalhes completos
 * @query   dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @query   dataFim (obrigatório) - formato: YYYY-MM-DD
 * @query   solicitante (opcional) - id do solicitante
 * @query   aprovador (opcional) - id do aprovador
 * @query   status (opcional) - filtro por status (Pendente, Aprovado, Reprovado)
 * @access  Private
 */
router.get("/todas", authMiddleware.authenticate, (req, res) =>
  RelatorioClienteController.getTodasRequisicoes(req, res)
);

/**
 * @route   POST /api/relatorios/cliente/gerar-pdf
 * @desc    Gera e retorna PDF com todas as requisições de cliente
 * @body    dataInicio (obrigatório) - formato: YYYY-MM-DD
 * @body    dataFim (obrigatório) - formato: YYYY-MM-DD
 * @body    solicitante (opcional) - id do solicitante
 * @body    aprovador (opcional) - id do aprovador
 * @body    status (opcional) - filtro por status
 * @access  Private
 */
router.post("/gerar-pdf", authMiddleware.authenticate, (req, res) =>
  RelatorioClienteController.gerarPDFRelatorio(req, res)
);

export default router;
