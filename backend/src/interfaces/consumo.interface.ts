export interface ConsumoVeiculo {
  veiculo_id: number;
  km_inicial: number;
  km_final: number;
  km_rodado: number;
  litros_abastecidos: number;
  valor_gasto: number;
  consumo_medio_km_por_litro: number;
  custo_por_km: number;
  data_ultimo_abastecimento: Date;
  tipo_combustivel: string;
  placa: string;
  modelo: string;
}

export interface AnaliseConsumoIA {
  resumo: string;
  alertas: string[];
  recomendacoes?: string[];
}

export interface RespostaConsumo {
  status: boolean;
  total: number;
  data: ConsumoVeiculo[];
  analiseIA?: AnaliseConsumoIA;
}
