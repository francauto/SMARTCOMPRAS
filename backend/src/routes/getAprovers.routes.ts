import { Router } from "express";
import { getFuncionariosController } from "../controllers/getAprovers.controller";

const router = Router();

router.get('/:tipo', getFuncionariosController);

export default router;