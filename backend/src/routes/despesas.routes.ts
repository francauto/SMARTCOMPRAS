import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import {
  getRequisicoesController,
  getRequisicoesPorAprovadorController,
  getRequisicaoPorIdController,
  criarSolicitacaoController,
  aprovarCotaGerenteController,
  aprovarCotaDiretorController,
  recusarCotaController,
} from "../controllers/despesas.controller";

const router = Router();
const auth = new authMiddleware();

router.get("/requisicoes", auth.authenticate, getRequisicoesController);

router.get(
  "/requisicoes-aprovador",
  auth.authenticate,
  getRequisicoesPorAprovadorController
);

router.get("/requisicao", auth.authenticate, getRequisicaoPorIdController);

router.post("/requisicao", auth.authenticate, criarSolicitacaoController);

router.post(
  "/cota/aprovar-gerente",
  auth.authenticate,
  aprovarCotaGerenteController
);

router.put(
  "/cota/aprovar-diretor",
  auth.authenticate,
  aprovarCotaDiretorController
);

router.put("/cota/recusar", auth.authenticate, recusarCotaController);

export default router;
