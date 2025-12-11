import { Router } from "express";
import {
  getFrotaPendenteController,
  getFrotaPendenteSolicitanteController,
  getSolicitacaoFrotaByIdContrtoller,
  analyzeCupomFrotaController,
  confirmCupomFrotaController,
  resRequestFrotaController,
  sendRequestFrotaController,
} from "../controllers/frota.controller";
import multer from "multer";
import authMiddleware from "../middlewares/auth.middleware";
const auth = new authMiddleware();
const router = Router();

router.post("/sendFrotaRequest", auth.authenticate, sendRequestFrotaController);
router.get(
  "/getFrotaPendente/:idAprovador",
  auth.authenticate,
  getFrotaPendenteController
);
router.get(
  "/getFrotaPendenteSolicitante/:idSolicitante",
  auth.authenticate,
  getFrotaPendenteSolicitanteController
);
router.get(
  "/getSolicitacaoFrotaById/:id",
  auth.authenticate,
  getSolicitacaoFrotaByIdContrtoller
);
router.post(
  "/resRequestFrota/:id_requisicao",
  auth.authenticate,
  resRequestFrotaController
);
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Rota 1: Analisa o cupom e retorna os dados extraídos
router.post(
  "/analyzeCupom/:id_requisicao",
  auth.authenticate,
  upload.single("imagePath"),
  analyzeCupomFrotaController
);

// Rota 2: Confirma e salva os dados do cupom
router.post(
  "/confirmCupom/:id_requisicao",
  auth.authenticate,
  confirmCupomFrotaController
);

export default router;
