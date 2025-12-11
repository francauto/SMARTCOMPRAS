export interface IFiltroRelatorioEstoque {
  dataInicio: string;
  dataFim: string;
  tipo_periodo?: "dia" | "semana" | "mes" | "ano";
  fornecedor?: string;
  item?: string;
  solicitante?: number;
  entregaDireta?: boolean;
}

export interface IValorCompraVenda {
  periodo: string;
  valorTotalCompra: number;
  valorTotalVenda: number;
  margem: number;
  margemPercentual: number;
  quantidadeRequisicoes: number;
}

export interface IValorFrete {
  periodo: string;
  valorTotalFrete: number;
  quantidadeRequisicoes: number;
  mediaFretePorRequisicao: number;
}

export interface IRequisicaoPorSolicitante {
  solicitante: string;
  idSolicitante: number;
  quantidadeRequisicoes: number;
  valorBrutoGasto: number;
  valorVendido: number;
  margem: number;
}

export interface IItemRequisicao {
  item: string;
  quantidade: number;
  valorUnitarioMedio: number;
  valorTotal: number;
  quantidadeRequisicoes: number;
}

export interface IEntregaDireta {
  periodo: string;
  quantidadeEntregas: number;
  valorTotal: number;
  itens?: IItemRequisicao[];
}

export interface IResumoGeral {
  periodo: {
    inicio: string;
    fim: string;
  };
  totais: {
    requisicoes: number;
    valorCompra: number;
    valorVenda: number;
    valorFrete: number;
    margem: number;
    entregasDiretas: number;
  };
  topSolicitantes: IRequisicaoPorSolicitante[];
  topItens: IItemRequisicao[];
}

export interface IRequisicaoEstoqueDetalhada {
  id: number;
  fornecedor: string;
  valor_custo_total: number;
  cliente_venda: string;
  cod_cliente: string;
  valor_venda: number;
  data_requisicao: string;
  data_aprovacao: string | null;
  nome_solicitante: string;
  nome_aprovador: string | null;
  status: string;
  impresso: number;
  entrega_direta: number;
  valor_frete: number;
}

export interface IPayloadPDFRelatorio {
  relatorios: string[]; // Array com os nomes dos relatórios: "valorCompraVenda", "valorFrete", "porSolicitante", etc
  dataInicio: string; // Data inicial obrigatória no formato YYYY-MM-DD
  dataFim: string; // Data final obrigatória no formato YYYY-MM-DD
  tipo_periodo?: "dia" | "semana" | "mes" | "ano"; // Opcional: agrupamento dos dados
  fornecedor?: string; // Opcional: filtrar por fornecedor
  solicitante?: number; // Opcional: filtrar por ID do solicitante
  entregaDireta?: boolean;
}

export interface IDadosRelatoriosPDF {
  valorCompraVenda?: IValorCompraVenda[];
  valorFrete?: IValorFrete[];
  porSolicitante?: IRequisicaoPorSolicitante[];
  entregasDiretas?: IEntregaDireta[];
  entregasDiretasPorItem?: IItemRequisicao[];
  resumoGeral?: IResumoGeral;
  todas?: IRequisicaoEstoqueDetalhada[];
}
