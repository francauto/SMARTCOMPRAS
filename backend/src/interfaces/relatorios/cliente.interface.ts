import { RowDataPacket } from "mysql2";

// Filtros para relatórios de cliente
export interface IFiltroRelatorioCliente {
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  solicitante?: number;
  aprovador?: number;
  status?: string;
}

// Requisição de Cliente Detalhada
export interface IRequisicaoClienteDetalhada extends RowDataPacket {
  id: number;
  descricao: string;
  valor: number;
  data_solicitacao: string;
  data_aprovacao: string | null;
  status: string;
  nome_solicitante: string;
  nome_aprovador: string | null;
  impresso: number;
}

// Dados para PDF
export interface IDadosRelatoriosClientePDF {
  todas?: IRequisicaoClienteDetalhada[];
}

// Payload para geração de PDF
export interface IPayloadPDFRelatorioCliente {
  dataInicio: string;
  dataFim: string;
  solicitante?: number;
  aprovador?: number;
  status?: "Pendente" | "Aprovado" | "Reprovado";
}
