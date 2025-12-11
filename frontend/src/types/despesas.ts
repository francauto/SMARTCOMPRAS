export interface FornecedorRequisicao {
  nome: string;
  itens: FornecedorItem[];
}

export interface DepartamentoRateio {
  id_departamento: number;
  percentual_rateio: number;
}

export interface CriarRequisicaoDespesasPayload {
  descricao: string;
  id_diretor: number;
  fornecedores: FornecedorRequisicao[];
  departamentos: DepartamentoRateio[];
}
export interface FornecedorItem {
  id?: number;
  descricao?: string;
  descricao_item?: string;
  qtde: number;
  valor_unitario: number;
}

export interface GerenteAprovador {
  id: number;
  nome: string;
}

export interface Fornecedor {
  id?: number;
  id_cota?: number;
  nome?: string;
  valor_total?: number;
  status?: string;
  gerentes_aprovadores?: GerenteAprovador[];
  itens?: FornecedorItem[];
}

export interface Departamento {
  id?: number;
  nome?: string;
  valor_gasto?: number | null;
  percent?: number;
}

export interface Gerente {
  id?: number;
  nome?: string;
  aprovou?: number;
  aprovado_via_master?: boolean;
  departamentos?: { id: number | null; nome: string }[];
}

export interface DespesaRequisicao {
  id: number;
  usuario_recusador?: string;
  descricao: string;
  nome_solicitante?: string;
  status: string;
  data_solicitacao?: string;
  data_aprovacao?: string;
  impresso?: number;
  data_requisicao?: string;
  id_solicitante?: number;
  aprovado_diretor?: number;
  id_aprovador_diretor?: number;
  data_aprovacao_diretor?: string;
  rateada?: number;
  data_recusa?: string | null;
  solicitante?: string;
  data_resposta?: string;
  departamento?: string;
  nome_aprovador_gerente?: string;
  nome_aprovador_diretor?: string;
  departamentos?: Departamento[];
  fornecedores?: Fornecedor[];
  gerentes?: Gerente[];
  todos_gerentes_aprovaram?: boolean;
}

export interface DespesasListarResponse {
  data: DespesaRequisicao[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  message?: string;
}

export interface ModalNovaSolicitacaoDespesasProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface AprovarCotaGerente {
  id_cota: number;
  id_requisicao: number;
}

export interface AprovarCotaDiretor {
  id_requisicao: number;
  id_cota: number;
}
