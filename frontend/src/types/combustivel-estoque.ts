// Interfaces para Combustível Estoque

export interface CombustivelEstoqueRequisicao {
  id: number;
  chassi?: string;
  placa?: string;
  modelo: string;
  marca: string;
  quantidade_litros: number;
  tipo_combustivel?: string;
  data_solicitacao: string;
  data_aprovacao?: string;
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

export interface CombustivelEstoqueRequisicaoDetalhada {
  id: number;
  chassi: string | null;
  placa: string | null;
  modelo: string;
  marca: string;
  quantidade_litros: number;
  tipo_combustivel: string | null;
  data_solicitacao: string;
  data_aprovacao: string | null;
  id_solicitante: number;
  solicitante_nome: string;
  id_aprovador: number;
  aprovador_nome: string;
  id_departamento: number | null;
  departamento_nome: string | null;
  status: "Pendente" | "Aprovado" | "Reprovado";
  impresso: number;
}

export interface CriarRequisicaoCombustivelEstoque {
  chassi?: string;
  placa?: string;
  modelo: string;
  marca: string;
  quantidade_litros: number;
  tipo_combustivel?: string;
  id_aprovador: number;
  id_departamento?: number;
}

export interface RespostaRequisicaoCombustivelEstoque {
  id_requisicao: number;
  aprovado: boolean;
}

export interface CombustivelEstoqueFiltros {
  search?: string;
  dataInicio?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CombustivelEstoqueListResponse {
  data: CombustivelEstoqueRequisicao[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filtros?: CombustivelEstoqueFiltros;
}

export interface CombustivelEstoqueResponse {
  message: string;
  data?: CombustivelEstoqueRequisicaoDetalhada;
  id_requisicao?: number;
}
