import { Request, Response } from "express";
import AuthService from "../services/auth.services";
import {
  IUser,
  ILoginRequest,
  IPasswordResetRequest,
  IPasswordResetVerify,
  IPasswordResetNew,
  IChangePasswordRequest,
  IUpdateWhatsAppConfigRequest,
} from "../interfaces/auth.interface";

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // ==================== REGISTRO E AUTENTICAÇÃO ====================

  public register = async (req: Request, res: Response): Promise<Response> => {
    const { nome, sobrenome, usuario, senha, mail } = req.body;
    const usuarioPattern = /^[a-zA-Z]+\.[a-zA-Z]+$/;

    if (!usuarioPattern.test(usuario)) {
      return res
        .status(400)
        .json({ error: 'Formato de usuário inválido. Use "nome.sobrenome"' });
    }

    try {
      const payload = {
        nome: nome,
        sobrenome: sobrenome,
        usuario: usuario,
        senha: senha,
        mail: mail,
      } as unknown as IUser;
      const message = await this.authService.register(payload);
      return res.status(201).json(message);
    } catch (err: any) {
      if (
        err.message === "User already exists." ||
        err.message === "Email already registered"
      ) {
        return res.status(409).json({ error: err.message });
      }
      console.error("Erro ao registrar usuário:", err);
      return res
        .status(500)
        .json({ error: "Erro ao registrar usuário no banco de dados" });
    }
  };

  public login = async (req: Request, res: Response): Promise<Response> => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res
        .status(400)
        .json({ error: "Usuário e senha são obrigatórios." });
    }

    try {
      const payload: ILoginRequest = { usuario, senha };
      const { token, user } = await this.authService.login(payload);

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: "Login realizado com sucesso.",
        token: token,
        user: user,
      });
    } catch (err: any) {
      console.error("Erro no login:", err);
      return res.status(401).json({ error: err.message });
    }
  };

  public logout = async (req: Request, res: Response): Promise<Response> => {
    try {
      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return res.status(200).json({ message: "Logout realizado com sucesso." });
    } catch (err: any) {
      console.error("Erro no logout:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  };

  public getProfile = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      return res.status(200).json({
        message: "Perfil obtido com sucesso.",
        user: {
          id: user.id,
          nome: user.nome,
          sobrenome: user.sobrenome || "",
          usuario: user.usuario,
          mail: user.mail,
          cargo: user.cargo,
          cargo_bestdrive: user.cargo_bestdrive,
          ativo: user.ativo,
          master: user.master,
          verificador: user.verificador,
        },
      });
    } catch (err: any) {
      console.error("Erro ao obter perfil:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  };

  // ==================== RECUPERAÇÃO DE SENHA ====================

  public requestPasswordReset = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, usuario } = req.body;

    try {
      const payload: IPasswordResetRequest = { email, usuario };
      const result = await this.authService.requestPasswordReset(payload);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("Erro ao solicitar recuperação de senha:", err);
      if (
        err.message === "É necessário informar Email ou usuário" ||
        err.message === "Usuário não encontrado"
      ) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Erro no banco de dados" });
    }
  };

  public verifyResetCode = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { codigo } = req.params;
    const { email, usuario } = req.query;

    try {
      const payload: IPasswordResetVerify = {
        email: email as string,
        usuario: usuario as string,
        codigo,
      };
      const result = await this.authService.verifyResetCode(payload);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("Erro ao verificar código:", err);
      if (
        err.message === "É necessário informar Email ou usuário" ||
        err.message === "Usuário não encontrado" ||
        err.message === "Nenhum código de recuperação solicitado" ||
        err.message === "Código inválido ou expirado"
      ) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Erro no banco de dados" });
    }
  };

  public resetPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, usuario, codigo, novaSenha } = req.body;

    try {
      const payload: IPasswordResetNew = { email, usuario, codigo, novaSenha };
      const result = await this.authService.resetPassword(payload);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("Erro ao alterar senha:", err);
      if (
        err.message === "É necessário informar Email ou usuário" ||
        err.message === "Usuário não encontrado" ||
        err.message === "Nenhum código de recuperação solicitado" ||
        err.message === "Código inválido ou expirado"
      ) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "Erro no banco de dados" });
    }
  };

  // ==================== ALTERAÇÃO DE SENHA ====================

  public changePassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { senhaAntiga, novaSenha } = req.body;
    const userId = req.user?.id;

    if (!senhaAntiga || !novaSenha) {
      return res
        .status(400)
        .json({ error: "Senha antiga e nova senha são obrigatórias" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      const payload: IChangePasswordRequest = {
        senhaAntiga,
        novaSenha,
        id: userId,
      };
      const result = await this.authService.changePassword(payload);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("Erro ao alterar senha:", err);
      if (
        err.message === "Usuário não encontrado" ||
        err.message === "Senha antiga incorreta"
      ) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: "Erro ao alterar a senha" });
    }
  };

  // ==================== CONFIGURAÇÃO WHATSAPP ====================

  public updateWhatsAppConfig = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { telefone, aut_wpp } = req.body;
    const userId = req.user?.id;

    if (!telefone) {
      return res.status(400).json({ error: "Telefone é obrigatório" });
    }

    if (typeof aut_wpp !== "boolean") {
      return res.status(400).json({ error: "aut_wpp deve ser um booleano" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    try {
      const payload: IUpdateWhatsAppConfigRequest = {
        telefone,
        aut_wpp,
        id: userId,
      };
      const result = await this.authService.updateWhatsAppConfig(payload);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("Erro ao atualizar configurações do WhatsApp:", err);
      if (
        err.message === "Usuário não encontrado" ||
        err.message === "Telefone deve ter 10 ou 11 dígitos"
      ) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(500)
        .json({ error: "Erro ao atualizar configurações do WhatsApp" });
    }
  };
}

export default AuthController;
