import { RowDataPacket } from "mysql2/promise";

export interface ICombustivelEstoqueRequisicao extends RowDataPacket {
  id: number;
  chassi?: string;
  placa?: string;
  modelo: string;
  marca: string;
  quantidade_litros: number;
  tipo_combustivel?: string;
  data_solicitacao: Date;
  data_aprovacao?: Date;
  id_solicitante: number;
  nome_solicitante: string;
  id_aprovador: number;
  nome_aprovador: string;
  id_departamento?: number;
  departamento_nome?: string;
  status: "Pendente" | "Aprovado" | "Reprovado";
  impresso: number;
  aprovado?: number;
}

export interface ICombustivelEstoqueRequisicaoDetalhada extends RowDataPacket {
  id: number;
  chassi?: string;
  placa?: string;
  modelo: string;
  marca: string;
  quantidade_litros: number;
  tipo_combustivel?: string;
  data_solicitacao: Date;
  data_aprovacao?: Date;
  id_solicitante: number;
  solicitante_nome: string;
  id_aprovador: number;
  aprovador_nome?: string;
  id_departamento?: number;
  departamento_nome?: string;
  status: "Pendente" | "Aprovado" | "Reprovado";
  impresso: number;
}

export interface ICriarRequisicaoCombustivelEstoque {
  chassi?: string;
  placa?: string;
  modelo: string;
  marca: string;
  quantidade_litros: number;
  tipo_combustivel?: string;
  id_aprovador: number;
  id_solicitante: number;
  id_departamento?: number;
}

export interface IRespostaRequisicaoCombustivelEstoque {
  id_requisicao: number;
  aprovado: boolean;
}
