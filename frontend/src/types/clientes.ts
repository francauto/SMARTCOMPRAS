export interface AprovarOuRecusarRequisicaoPayload {
  id_requisicao: number;
  aprovado: boolean;
}
export interface ClienteRequisicao {
  id: number;
  descricao: string;
  valor: number;
  status: string;
  data_solicitacao: string;
  data_aprovacao: string | null;
  id_solicitante: number;
  id_aprovador: number;
  nome_solicitante?: string;
  nome_aprovador?: string;
  solicitante_nome?: string;
  aprovador_nome?: string;
  impresso: number;
}

export interface NovaSolicitacaoCliente {
  descricao: string;
  valor: number;
  id_aprovador: number;
}

export interface Aprovador {
  id: number;
  nome: string;
}