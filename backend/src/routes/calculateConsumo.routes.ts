import { Router } from "express";
import { getCarsConsumoController, listarConsumo } from "../controllers/calculateConsumo.controller";

const router = Router();

router.get("/edit", listarConsumo);
router.get('/cars',getCarsConsumoController)

export default router;
