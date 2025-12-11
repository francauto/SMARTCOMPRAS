export interface ItemEstoqueDetalhado {
  id: number;
  descricao: string;
  valor_unitario: number;
  qtde: number;
}

export interface EstoqueRequisicaoDetalhada {
  data: any;
  id: number;
  fornecedor: string;
  cliente_venda: string;
  cod_cliente: string;
  valor_venda: number;
  data_requisicao: string;
  id_aprovador: number;
  id_solicitante: number;
  nome_solicitante: string;
  nome_aprovador: string;
  data_aprovacao: string | null;
  entrega_direta: number;
  valor_frete: number;
  valor_custo_total: number;
  status: string;
  descricao: string;
  valor_custo: number;
  impresso: number;
  itens: ItemEstoqueDetalhado[];
}
export interface AprovarOuRecusarRequisicaoPayload {
  id_requisicao: number;
  aprovado: boolean;
}

export interface EstoqueRequisicao {
  data(data: any): unknown;
  id: number;
  descricao: string;
  valor: number;
  status: string;
  data_requisicao: string;
  data_aprovacao: string;
  id_solicitante: number;
  id_aprovador: number;
  nome_solicitante: string;
  nome_aprovador: string;
  impresso: number;
}

export interface ItemEstoque {
  descricao: string;
  qtde: number;
  valor_unitario: number;
}

export interface NovaSolicitacaoEstoque {
  fornecedor: string;
  Itens: ItemEstoque[];
  cliente_venda: string;
  cod_cliente: string;
  valor_venda: number | null;
  id_aprovador: number;
  entrega_direta: boolean;
  valor_frete: number;
  valor_total: number;
  descricao: string;
  valor: number;
}

export interface Aprovador {
  id: number;
  nome: string;
}
