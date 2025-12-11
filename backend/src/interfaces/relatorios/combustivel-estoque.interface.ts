import { RowDataPacket } from "mysql2/promise";

// ==================== FILTROS ====================

export interface IFiltroRelatorioCombustivelEstoque {
  dataInicio: string;
  dataFim: string;
  tipo_periodo?: "dia" | "semana" | "mes" | "ano";
  solicitante?: number;
  aprovador?: number;
  departamento?: number;
  status?: string;
  tipo_combustivel?: string;
  placa?: string;
  chassi?: string;
  marca?: string;
  modelo?: string;
}

// ==================== DADOS DOS RELATÓRIOS ====================

// 1. Consumo por Veículo
export interface IConsumoPorVeiculo extends RowDataPacket {
  identificacao: string; // placa ou chassi
  placa: string | null;
  chassi: string | null;
  marca: string;
  modelo: string;
  tipo_combustivel: string | null;
  totalLitros: number;
  quantidadeRequisicoes: number;
  mediaLitrosPorRequisicao: number;
  departamento_nome: string | null;
}

// 2. Análise Temporal
export interface IAnaliseTemporalCombustivel extends RowDataPacket {
  periodo: string;
  totalLitros: number;
  quantidadeRequisicoes: number;
  mediaLitrosPorRequisicao: number;
  veiculosUnicos: number;
}

// 3. Por Tipo de Combustível
export interface IPorTipoCombustivel extends RowDataPacket {
  tipo_combustivel: string;
  totalLitros: number;
  quantidadeRequisicoes: number;
  percentualTotal: number;
  mediaLitrosPorRequisicao: number;
}

// 4. Por Departamento
export interface IPorDepartamentoCombustivel extends RowDataPacket {
  departamento_nome: string;
  id_departamento: number;
  totalLitros: number;
  quantidadeRequisicoes: number;
  veiculosUnicos: number;
  mediaLitrosPorRequisicao: number;
}

// 5. Por Solicitante
export interface IPorSolicitanteCombustivel extends RowDataPacket {
  solicitante: string;
  id_solicitante: number;
  totalLitros: number;
  quantidadeRequisicoes: number;
  mediaLitrosPorRequisicao: number;
}

// 6. Por Marca/Modelo
export interface IPorMarcaModelo extends RowDataPacket {
  marca: string;
  modelo: string;
  totalLitros: number;
  quantidadeRequisicoes: number;
  veiculosUnicos: number;
  mediaLitrosPorVeiculo: number;
}

// 7. Tempo de Aprovação
export interface ITempoAprovacao extends RowDataPacket {
  status: string;
  quantidadeRequisicoes: number;
  tempoMedioAprovacaoHoras: number | null;
  tempoMinimoHoras: number | null;
  tempoMaximoHoras: number | null;
  aprovador_nome: string | null;
}

// 8. Resumo Geral
export interface IResumoGeralCombustivel {
  totais: {
    requisicoes: number;
    litros: number;
    veiculosUnicos: number;
    mediaLitrosPorRequisicao: number;
  };
  porTipoCombustivel?: IPorTipoCombustivel[];
  topSolicitantes?: IPorSolicitanteCombustivel[];
  topVeiculos?: IConsumoPorVeiculo[];
}

// 9. Requisição Completa Detalhada
export interface IRequisicaoCombustivelDetalhada extends RowDataPacket {
  id: number;
  chassi: string | null;
  placa: string | null;
  modelo: string;
  marca: string;
  quantidade_litros: number;
  tipo_combustivel: string | null;
  data_solicitacao: string;
  data_aprovacao: string | null;
  status: string;
  nome_solicitante: string;
  nome_aprovador: string | null;
  departamento_nome: string | null;
  impresso: number;
}

// ==================== PDF ====================

export interface IDadosRelatoriosCombustivelPDF {
  consumoPorVeiculo?: IConsumoPorVeiculo[];
  analiseTemporal?: IAnaliseTemporalCombustivel[];
  porTipoCombustivel?: IPorTipoCombustivel[];
  porDepartamento?: IPorDepartamentoCombustivel[];
  porSolicitante?: IPorSolicitanteCombustivel[];
  porMarcaModelo?: IPorMarcaModelo[];
  tempoAprovacao?: ITempoAprovacao[];
  resumoGeral?: IResumoGeralCombustivel;
  todas?: IRequisicaoCombustivelDetalhada[];
}

export interface IPayloadPDFRelatorioCombustivel {
  relatorios: string[];
  dataInicio: string;
  dataFim: string;
  tipo_periodo?: "dia" | "semana" | "mes" | "ano";
  solicitante?: number;
  aprovador?: number;
  departamento?: number;
  status?: "Pendente" | "Aprovado" | "Reprovado";
  tipo_combustivel?: string;
  placa?: string;
  chassi?: string;
  marca?: string;
  modelo?: string;
}
