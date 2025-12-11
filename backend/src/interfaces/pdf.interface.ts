import { RowDataPacket } from "mysql2";

export interface IPdf {
  id_modulo: number;
  id_requisicao: number;
}

export interface IModulo extends RowDataPacket {
  id: string;
  descricao: string;
}
