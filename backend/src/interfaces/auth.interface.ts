import { RowDataPacket } from "mysql2";

export interface IUser extends RowDataPacket {
  id?: number;
  nome?: string;
  sobrenome?: string;
  usuario?: string;
  senha?: string;
  mail?: string;
  cargo?: string;
  cod?: string;
  cod_date?: string;
  cargo_bestdrive?: string;
  id_departamento?: number;
  ativo?: number;
  master?: number;
  verificador?: number;
  telefone?: string;
  aut_wpp?: number;
  cargo_bestdrive_id?: number;
}

export interface IUserResponse {
  id: number;
  nome: string;
  sobrenome: string;
  usuario: string;
  mail: string;
  cargo: string;
  ativo?: number;
  master?: number;
  verificador?: number;
  cargo_bestdrive: string | null;
}

export interface ILoginRequest {
  usuario: string;
  senha: string;
}

export interface IAuthResponse {
  message: string;
  user?: {
    id: number;
    nome: string;
    sobrenome: string;
    usuario: string;
    mail: string;
    cargo: string;
  };
}

export interface IPasswordResetRequest {
  email?: string;
  usuario?: string;
}

export interface IPasswordResetVerify {
  email?: string;
  usuario?: string;
  codigo: string;
}

export interface IPasswordResetNew {
  email?: string;
  usuario?: string;
  codigo: string;
  novaSenha: string;
}

export interface IChangePasswordRequest {
  senhaAntiga: string;
  novaSenha: string;
  id: number;
}

export interface IUpdateWhatsAppConfigRequest {
  telefone: string;
  aut_wpp: boolean;
  id: number;
}
