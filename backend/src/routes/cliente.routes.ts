import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import {
  getRequisicoesPorSolicitanteController,
  getRequisicoesPorAprovadorController,
  getRequisicaoPorIdController,
  criarRequisicaoClienteController,
  responderRequisicaoController,
} from "../controllers/cliente.controller";

const router = Router();
const auth = new authMiddleware();

// Todas as rotas são protegidas
router.get(
  "/requisicoes",
  auth.authenticate,
  getRequisicoesPorSolicitanteController
);

router.get(
  "/requisicoes-aprovador",
  auth.authenticate,
  getRequisicoesPorAprovadorController
);

router.get("/requisicao", auth.authenticate, getRequisicaoPorIdController);

router.post("/requisicao", auth.authenticate, criarRequisicaoClienteController);

router.put(
  "/requisicao/resposta",
  auth.authenticate,
  responderRequisicaoController
);

export default router;
