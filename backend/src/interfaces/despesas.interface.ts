import { RowDataPacket } from "mysql2";

export interface IDespesas {
  descricao: string;
  id_solicitante: number;
  id_diretor: number;
  departamentos: IDepartamentos[];
  fornecedores: IFornecedores[];
}
export interface GerenteDepartamentoRow extends RowDataPacket {
  id_gerente: number;
  id_departamento: number;
}

export interface relacionarGerentes {
  gerentes: number[];
  id_requisicao: number;
}

export interface IDepartamentos {
  id_departamento: number;
  percentual_rateio: number;
}

export interface IFornecedores {
  nome: string;
  valor_total: number;
  itens: IItens[];
}

export interface IItens {
  descricao_item: string;
  qtde: number;
  valor_unitario: number;
}

export interface IFornecedoresItens {
  id_fornecedor: number;
  id_item: number;
  valor_unitario: number;
  quantidade: number;
  id_cota?: number; // Opcional para retrocompatibilidade com dados antigos
}

export interface ICota {
  id_requisicao: number;
  id_fornecedor: number;
  valor_total: number;
}
