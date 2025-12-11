import pool from "../config/db";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import moment from "moment";
import { RowDataPacket } from "mysql2";
import {
  IUser,
  ILoginRequest,
  IAuthResponse,
  IPasswordResetRequest,
  IPasswordResetVerify,
  IPasswordResetNew,
  IChangePasswordRequest,
  IUserResponse,
  IUpdateWhatsAppConfigRequest,
} from "../interfaces/auth.interface";
import EmailService from "../utils/email";

class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private emailService: EmailService;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";
    this.emailService = new EmailService();
  }

  // ==================== REGISTRO E AUTENTICAÇÃO ====================

  public async register(payload: IUser): Promise<{ message: string }> {
    const [existingUser] = await pool.query<IUser[]>(
      "SELECT * FROM Funcionarios WHERE usuario = ?",
      [payload.usuario]
    );
    if (existingUser.length > 0) {
      throw new Error("Usuário já existe.");
    }

    const [existingMail] = await pool.query<IUser[]>(
      "SELECT * FROM Funcionarios WHERE mail = ?",
      [payload.mail]
    );
    if (existingMail.length > 0) {
      throw new Error("Email já cadastrado");
    }

    if (!payload.senha) {
      throw new Error("Senha é obrigatória.");
    }

    const hashedPassword = await bcrypt.hash(payload.senha, 10);

    await pool.query(
      "INSERT INTO Funcionarios (nome, sobrenome, usuario, senha, mail, cargo) VALUES (?, ?, ?, ?, ?, ?)",
      [
        payload.nome,
        payload.sobrenome,
        payload.usuario,
        hashedPassword,
        payload.mail,
        "fun",
      ]
    );

    return { message: "Usuário registrado com sucesso." };
  }

  public async login(
    payload: ILoginRequest
  ): Promise<{ token: string; user: IUserResponse }> {
    const query = `
    SELECT 
      f.id, f.nome, f.sobrenome, f.usuario, f.mail, f.cargo, f.ativo, f.senha,
      f.ativo, f.verificador, f.master,
      cb.cargo AS cargo_bestdrive 
    FROM Funcionarios f 
    LEFT JOIN cargos_bestdrive cb ON f.cargo_bestdrive_id = cb.id 
    WHERE f.usuario = ?;
  `;

    const [users] = await pool.query<IUser[]>(query, [payload.usuario]);

    if (users.length === 0) {
      throw new Error("Usuário ou senha inválidos.");
    }

    const user = users[0];

    if (!user.ativo) {
      throw new Error("Este usuário está inativo. Contate o administrador.");
    }

    if (!user.senha) {
      throw new Error("Conta de usuário corrompida. Senha não encontrada.");
    }

    if (
      typeof user.id === "undefined" ||
      !user.nome ||
      !user.usuario ||
      !user.mail ||
      !user.cargo ||
      !user.cargo_bestdrive
    ) {
      throw new Error("Dados essenciais do usuário não encontrados.");
    }

    const isPasswordValid = await bcrypt.compare(payload.senha, user.senha);

    if (!isPasswordValid) {
      throw new Error("Usuário ou senha inválidos.");
    }

    const userResponse: IUserResponse = {
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
    };

    const token = jwt.sign(userResponse, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);

    return { token, user: userResponse };
  }

  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error("Token inválido.");
    }
  }

  // ==================== RECUPERAÇÃO DE SENHA ====================

  public async requestPasswordReset(
    payload: IPasswordResetRequest
  ): Promise<{ message: string }> {
    const { email, usuario } = payload;

    if (!email && !usuario) {
      throw new Error("É necessário informar Email ou usuário");
    }

    const [rows] = await pool.query<IUser[]>(
      "SELECT * FROM Funcionarios WHERE mail = ? OR usuario = ?",
      [email, usuario]
    );

    if (rows.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const user = rows[0];
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const codDate = moment().format("YYYY-MM-DD HH:mm:ss");

    await pool.query(
      "UPDATE Funcionarios SET cod = ?, cod_date = ? WHERE id = ?",
      [hashedCode, codDate, user.id]
    );

    await this.emailService.sendEmail(
      user.mail!,
      "Código de Recuperação de Senha",
      `Seu código de recuperação é: ${code}`
    );

    return { message: "Código de recuperação enviado para o email" };
  }

  public async verifyResetCode(
    payload: IPasswordResetVerify
  ): Promise<{ message: string }> {
    const { email, usuario, codigo } = payload;

    if (!email && !usuario) {
      throw new Error("É necessário informar Email ou usuário");
    }

    const [rows] = await pool.query<IUser[]>(
      "SELECT cod, cod_date FROM Funcionarios WHERE mail = ? OR usuario = ?",
      [email, usuario]
    );

    if (rows.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const user = rows[0];

    if (!user.cod || !user.cod_date) {
      throw new Error("Nenhum código de recuperação solicitado");
    }

    const isMatch = await bcrypt.compare(codigo, user.cod);
    const codDate = moment(user.cod_date);
    const now = moment();
    const diffMinutes = now.diff(codDate, "minutes");

    if (!isMatch || diffMinutes >= 5) {
      throw new Error("Código inválido ou expirado");
    }

    return { message: "Código válido" };
  }

  public async resetPassword(
    payload: IPasswordResetNew
  ): Promise<{ message: string }> {
    const { email, usuario, codigo, novaSenha } = payload;

    if (!email && !usuario) {
      throw new Error("É necessário informar Email ou usuário");
    }

    const [rows] = await pool.query<IUser[]>(
      "SELECT cod, cod_date FROM Funcionarios WHERE mail = ? OR usuario = ?",
      [email, usuario]
    );

    if (rows.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const user = rows[0];

    if (!user.cod || !user.cod_date) {
      throw new Error("Nenhum código de recuperação solicitado");
    }

    const isMatch = await bcrypt.compare(codigo, user.cod);
    const codDate = moment(user.cod_date);
    const now = moment();
    const diffMinutes = now.diff(codDate, "minutes");

    if (!isMatch || diffMinutes >= 5) {
      throw new Error("Código inválido ou expirado");
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query(
      "UPDATE Funcionarios SET senha = ?, cod = NULL, cod_date = NULL WHERE mail = ? OR usuario = ?",
      [novaSenhaHash, email, usuario]
    );

    return { message: "Senha alterada com sucesso" };
  }

  // ==================== ALTERAÇÃO DE SENHA ====================

  public async changePassword(
    payload: IChangePasswordRequest
  ): Promise<{ message: string }> {
    const { senhaAntiga, novaSenha, id } = payload;

    const [user] = await pool.query<IUser[]>(
      "SELECT senha FROM Funcionarios WHERE id = ?",
      [id]
    );

    if (user.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const senhaValida = await bcrypt.compare(senhaAntiga, user[0].senha!);

    if (!senhaValida) {
      throw new Error("Senha antiga incorreta");
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query("UPDATE Funcionarios SET senha = ? WHERE id = ?", [
      novaSenhaHash,
      id,
    ]);

    return { message: "Senha alterada com sucesso" };
  }

  // ==================== CONFIGURAÇÃO WHATSAPP ====================

  public async updateWhatsAppConfig(
    payload: IUpdateWhatsAppConfigRequest
  ): Promise<{ message: string; telefone: string; aut_wpp: boolean }> {
    const { telefone, aut_wpp, id } = payload;

    // Validar formato do telefone (apenas números, 10-11 dígitos)
    const telefoneNumeros = telefone.replace(/\D/g, "");

    if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
      throw new Error("Telefone deve ter 10 ou 11 dígitos");
    }

    // Verificar se usuário existe
    const [user] = await pool.query<IUser[]>(
      "SELECT id FROM Funcionarios WHERE id = ?",
      [id]
    );

    if (user.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    // Atualizar telefone e autorização WhatsApp
    // Salvar apenas os números no banco (sem formatação)
    await pool.query(
      "UPDATE Funcionarios SET telefone = ?, aut_wpp = ? WHERE id = ?",
      [telefoneNumeros, aut_wpp ? 1 : 0, id]
    );

    return {
      message: "Configurações do WhatsApp atualizadas com sucesso",
      telefone: telefoneNumeros,
      aut_wpp,
    };
  }
}

export default AuthService;
