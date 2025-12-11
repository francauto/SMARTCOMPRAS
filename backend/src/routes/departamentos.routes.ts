import { getDepartamentosController } from "../controllers/getDepartamento.controller";
import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware";
const auth = new AuthMiddleware();
const router = Router();

router.get('/', auth.authenticate,getDepartamentosController);

export default router;
