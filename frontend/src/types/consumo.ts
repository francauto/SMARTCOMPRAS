// Tipos para os dados de consumo dos veículos

export interface VehicleConsumption {
  veiculo_id: number;
  placa: string;
  modelo?: string;
  km_inicial: number;
  km_final: number;
  km_rodado: number;
  litros_abastecidos: number;
  valor_gasto: number;
  consumo_medio_km_por_litro: number;
  custo_por_km: number;
  data_ultimo_abastecimento: string;
  tipo_combustivel: string;
}

export interface AnaliseIA {
  resumo: string;
  alertas: string[];
  recomendacoes: string[];
}

export interface VehicleConsumptionResponse {
  status: boolean;
  total: number;
  data: VehicleConsumption[];
  analiseIA: AnaliseIA;
}

export interface ConsumptionByDepartment {
  departamento: string;
  totalKm: number;
  totalLitros: number;
  consumoMedio: number;
  custoTotal: number;
  quantidadeVeiculos: number;
}

export interface ConsumptionByVehicle {
  placa: string;
  modelo: string;
  totalKm: number;
  totalLitros: number;
  consumoMedio: number;
  custoTotal: number;
  quantidadeAbastecimentos: number;
}

export interface MonthlyConsumption {
  mes: string;
  ano: number;
  totalKm: number;
  totalLitros: number;
  consumoMedio: number;
  custoTotal: number;
}

export interface ConsumptionSummary {
  totalVeiculos: number;
  totalKmPercorrido: number;
  totalLitrosConsumidos: number;
  consumoMedioGeral: number;
  custoTotalGeral: number;
  mediaAbastecimentosPorVeiculo: number;
}

export interface ConsumptionFilters {
  dataInicio?: string;
  dataFim?: string;
  departamento?: string;
  placa?: string;
}

export interface ConsumptionResponse {
  status: boolean;
  total: number;
  data: VehicleConsumption[];
  analiseIA: AnaliseIA;
  summary?: ConsumptionSummary;
  byDepartment?: ConsumptionByDepartment[];
  byVehicle?: ConsumptionByVehicle[];
  monthly?: MonthlyConsumption[];
  vehicles?: VehicleConsumption[];
}
