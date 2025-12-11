import { Request, Response, NextFunction } from "express";
import AuthService from "../services/auth.services";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const token = req.cookies?.authToken;

      if (!token) {
        res.status(401).json({ error: "Token de acesso não fornecido." });
        return;
      }

      const decoded = this.authService.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error: any) {
      console.error("ERRO no middleware de autenticação:", error.message);
      res.status(401).json({ error: "Token inválido ou expirado." });
      return;
    }
  };

  public optionalAuth = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const token = req.cookies?.authToken;

      if (token) {
        const decoded = this.authService.verifyToken(token);
        req.user = decoded;
      }
      next();
    } catch (error) {
      next();
    }
  };

  public requireAdminRole = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const userCargo = req.user?.cargo;

      if (!userCargo) {
        res
          .status(403)
          .json({ error: "Acesso negado: cargo não identificado." });
        return;
      }

      const allowedRoles = ["admfun", "admger", "admdir"];

      if (!allowedRoles.includes(userCargo)) {
        res.status(403).json({
          error:
            "Acesso negado: apenas administradores podem acessar este recurso.",
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error("ERRO no middleware de autorização:", error.message);
      res.status(403).json({ error: "Acesso negado." });
      return;
    }
  };
}

export default AuthMiddleware;
