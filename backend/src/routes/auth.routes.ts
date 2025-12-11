import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthMiddleware from "../middlewares/auth.middleware";

const auth = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
auth.post("/register", authController.register);
auth.post("/login", authController.login);
auth.post("/logout", authController.logout);

// Password reset routes (public)
auth.post("/password-reset", authController.requestPasswordReset);
auth.get("/password-reset/:codigo", authController.verifyResetCode);
auth.post("/password-reset/new", authController.resetPassword);

// Protected routes
auth.get("/profile", authMiddleware.authenticate, authController.getProfile);
auth.post(
  "/change-password",
  authMiddleware.authenticate,
  authController.changePassword
);
auth.put(
  "/whatsapp-config",
  authMiddleware.authenticate,
  authController.updateWhatsAppConfig
);

export default auth;
