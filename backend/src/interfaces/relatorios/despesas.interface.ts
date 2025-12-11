// ==================== INTERFACES PARA RELATÓRIOS DE DESPESAS ====================

export interface IFiltroRelatorioDespesas {
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  tipo_periodo?: "dia" | "semana" | "mes" | "ano";
  solicitante?: number;
  aprovador?: number;
  departamento?: number;
  status?: string;
}

// 1. Análise Temporal
export interface IAnaliseTemporalDespesas {
  periodo: string;
  total_requisicoes: number;
  aprovadas: number;
  reprovadas: number;
  valor_total: number;
  ticket_medio: number;
}

// 2. Gastos por Departamento
export interface ISolicitanteDepartamento {
  id_solicitante: number;
  nome_solicitante: string;
  total_requisicoes: number;
  valor_total: number;
  valor_medio: number;
}

export interface IGastosPorDepartamento {
  id_departamento: number;
  departamento: string;
  total_requisicoes: number;
  valor_total: number;
  ticket_medio: number;
  solicitantes_unicos: number;
  top_solicitantes: ISolicitanteDepartamento[]; // Top 3
}

// 3. Comparativo de Cotações
export interface IComparativoCotacoes {
  requisicao_id: number;
  descricao: string;
  num_fornecedores: number;
  menor_valor: number;
  maior_valor: number;
  economia: number;
  percentual_economia: number;
  fornecedor_escolhido: string;
  data_requisicao: string;
}

// 4. Resumo Geral
export interface IResumoGeralDespesas {
  totais: {
    requisicoes: number;
    aprovadas: number;
    reprovadas: number;
    pendentes: number;
    valor_total_aprovado: number;
    ticket_medio: number;
    economia_total_gerada: number;
  };
}

// 5. Todas as Requisições
export interface IRequisicaoDespesaDetalhada {
  id: number;
  data_requisicao: string;
  descricao: string;
  departamento: string;
  nome_solicitante: string;
  status: string;
  valor: number;
  fornecedor_escolhido: string;
  impresso: boolean;
  data_aprovacao: string | null;
}

// Dados agregados para o PDF
export interface IDadosRelatoriosDespesasPDF {
  analiseTemporal?: IAnaliseTemporalDespesas[];
  gastosPorDepartamento?: IGastosPorDepartamento[];
  comparativoCotacoes?: IComparativoCotacoes[];
  resumoGeral?: IResumoGeralDespesas;
  todas?: IRequisicaoDespesaDetalhada[];
}

// Payload para geração de PDF
export interface IPayloadPDFRelatorioDespesas {
  relatorios: string[]; // ['analiseTemporal', 'gastosPorDepartamento', etc.]
  dataInicio: string;
  dataFim: string;
  tipo_periodo?: "dia" | "semana" | "mes" | "ano";
  solicitante?: number;
  aprovador?: number;
  departamento?: number;
  status?: "Pendente" | "Aprovada" | "Reprovada";
}
