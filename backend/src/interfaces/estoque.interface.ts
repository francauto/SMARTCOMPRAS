import { RowDataPacket } from "mysql2";

export interface IEstoqueRequisicoes extends RowDataPacket {
  id: number;
  fornecedor: string;
  descricao: string;
  valor_custo: string;
  valor_custo_total?: number;
  cliente_venda: string;
  cod_cliente: string;
  valor_venda: string;
  id_aprovador: number;
  data_requisicao: Date;
  data_aprovacao: Date;
  entrega_direta: boolean;
  valor_frete: string;
  nome_solicitante: string;
  nome_aprovador: string;
  status: "Pendente" | "Aprovado" | "Reprovado";
  impresso: boolean;
  id_solicitante?: number;
  itens?: IItemEstoqueDetalhado[];
}

export interface IEstoqueRequisicoesDetalhada extends RowDataPacket {
  id: number;
  fornecedor: string;
  descricao: string;
  valor_custo: string;
  valor_custo_total?: number;
  cliente_venda: string;
  cod_cliente: string;
  valor_venda: string;
  data_requisicao: Date;
  id_aprovador: number;
  nome_solicitante: string;
  nome_aprovador: string;
  data_aprovacao: Date;
  entrega_direta: boolean;
  valor_frete: string;
  status: "Pendente" | "Aprovado" | "Reprovado";
  itens?: IItemEstoqueDetalhado[];
}

export interface IItemEstoqueDetalhado {
  id: number;
  descricao: string;
  valor_unitario: number;
  qtde: number;
}

export interface ICriarRequisicaoEstoque {
  fornecedor: string;
  Itens: IItensEstoque[];
  valor_custo: number;
  cliente_venda: string;
  cod_cliente: string;
  valor_venda: number;
  id_aprovador: number;
  id_solicitante: number;
  entrega_direta: boolean;
  valor_frete: number;
}

export interface IItensEstoque {
  descricao: string;
  valor_unitario: number;
  qtde: number;
}

export interface IRespostaRequisicao {
  id_requisicao: number;
  aprovado: boolean;
}
