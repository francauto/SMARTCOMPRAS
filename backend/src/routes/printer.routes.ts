import { getPrinterController, printerRequestController } from "../controllers/printerRequest.controller";
import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware";

const router = Router()
const auth = new AuthMiddleware();

router.post('/sendAgent', auth.authenticate, printerRequestController);
router.get("/getPrinter",auth.authenticate , getPrinterController)

export default router;