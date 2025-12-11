import {buscarHashController, atualizarUsoHashController} from "../controllers/verificaHash.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { Router } from "express";
const auth = new AuthMiddleware();
const router = Router();

router.post("/buscar",auth.authenticate, buscarHashController);
router.post("/atualizarUso",auth.authenticate, atualizarUsoHashController);

export default router;