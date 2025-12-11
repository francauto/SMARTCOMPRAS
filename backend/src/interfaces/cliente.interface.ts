import { RowDataPacket } from "mysql2/promise";

export interface IClienteRequisicao extends RowDataPacket {
  id: number;
  descricao: string;
  valor: number;
  data_solicitacao: Date;
  data_aprovacao?: Date;
  id_solicitante: number;
  nome_solicitante?: string;
  id_aprovador: number;
  nome_aprovador?: string;
  status: "Pendente" | "Aprovado" | "Reprovado";
  impresso: number;
}

export interface IClienteRequisicaoDetalhada extends RowDataPacket {
  id: number;
  descricao: string;
  valor: number;
  data_solicitacao: Date;
  data_aprovacao?: Date;
  id_solicitante: number;
  solicitante_nome: string;
  id_aprovador?: number;
  aprovador_nome?: string;
  status: "Pendente" | "Aprovado" | "Reprovado";
  impresso: number;
}

export interface ICriarRequisicaoCliente {
  descricao: string;
  valor: number;
  id_aprovador: number;
  id_solicitante: number;
}

export interface IRespostaRequisicaoCliente {
  id_requisicao: number;
  aprovado: boolean;
}
