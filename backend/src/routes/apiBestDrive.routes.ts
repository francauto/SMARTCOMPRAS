import {getCarsController, getHistoryCarsController, resBestDriveUsoController} from "../controllers/apiBestDrive.controller";
import { Router } from "express";
const router = Router();

router.post("/resBestDriveUso", resBestDriveUsoController);
router.get("/getCars", getCarsController);
router.get("/getHistory/:id_veiculo", getHistoryCarsController)

export default router;

