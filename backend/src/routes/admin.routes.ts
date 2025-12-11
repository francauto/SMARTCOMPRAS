import { Router } from "express";
import {
  getAllUsuariosController,
  updateUsuarioController,
  resetSenhaUsuarioController,
} from "../controllers/admin.controller";
import AuthMiddleware from "../middlewares/auth.middleware";

const router = Router();
const authMiddleware = new AuthMiddleware();

// Todas as rotas exigem autenticação E cargo administrativo
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireAdminRole);

// ==================== ROTAS DE ADMINISTRAÇÃO ====================

// GET - Buscar todos os usuários
router.get("/usuarios", getAllUsuariosController);

// PUT - Atualizar dados do usuário (exceto senha)
router.put("/usuarios/:id", updateUsuarioController);

// PUT - Resetar senha para "Tr0c@r123"
router.put("/usuarios/:id/reset-senha", resetSenhaUsuarioController);

export default router;
