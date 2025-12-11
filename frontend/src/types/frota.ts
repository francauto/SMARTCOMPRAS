export interface FrotaRequisicao {
  id: number;
  veiculo_nome: string;
  veiculo_placa: string;
  solicitante_nome: string;
  km_veiculo: number;
  quantidade_litros: number;
  status: string;
  tanque_cheio: boolean;
  data_solicitacao: string;
  tipo_combustivel: string;
  respondido_bestdrive: boolean;
  impresso: number;
  data_aprovacao: string | null;
  departamento_nome: string;
}

export interface FrotaRequisicaoDetalhada extends FrotaRequisicao {
  veiculo_id: number;
  nome_solicitante: string;
  id_solicitante: number;
  id_aprovador: number;
  nome_aprovador: string;
  modelo: string;
  placa: string;
}

export interface SendFrotaRequest {
  veiculo: number;
  km: number;
  litro: number;
  id_aprovador: number;
  id_solicitante: number;
  tipo_combustivel: string;
  departamento: number;
  tanquecheio: boolean;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
}

export interface FrotaListResponse {
  data: FrotaRequisicao[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filtros?: {
    status?: string;
    placa?: string;
  };
}
