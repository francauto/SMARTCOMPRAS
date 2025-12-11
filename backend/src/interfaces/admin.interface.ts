import { RowDataPacket } from "mysql2/promise";

export interface IUsuario extends RowDataPacket {
  id: number;
  nome: string;
  sobrenome: string;
  usuario?: string;
  cargo: string;
  mail: string;
  telefone?: string;
  aut_wpp: number;
  ativo: number;
  id_departamento?: number;
  master?: number;
  verificador?: number;
  cargo_bestdrive_id?: number;
  cargo_bestdrive?: string;
}

export interface IUpdateUsuario {
  nome?: string;
  sobrenome?: string;
  usuario?: string;
  cargo?: string;
  mail?: string;
  telefone?: string;
  aut_wpp?: number;
  ativo?: number;
  id_departamento?: number;
  master?: number;
  verificador?: number;
  cargo_bestdrive_id?: number;
  cargo_bestdrive?: string;
}
