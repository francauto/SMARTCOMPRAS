import { Router } from "express";
import {
  getRequisicoesController,
  getRequisicoesPorAprovadorController,
  getRequisicaoPorIdController,
  criarRequisicaoController,
  responderRequisicaoController,
} from "../controllers/estoque.controller";
import AuthMiddleware from "../middlewares/auth.middleware";

const router = Router();
const authMiddleware = new AuthMiddleware();

router.get(
  "/requisicoes",
  authMiddleware.authenticate,
  getRequisicoesController
);

router.get(
  "/requisicoes-aprovador",
  authMiddleware.authenticate,
  getRequisicoesPorAprovadorController
);

router.get(
  "/requisicao",
  authMiddleware.authenticate,
  getRequisicaoPorIdController
);

router.post(
  "/requisicao",
  authMiddleware.authenticate,
  criarRequisicaoController
);

router.put(
  "/requisicao/resposta",
  authMiddleware.authenticate,
  responderRequisicaoController
);

export default router;
