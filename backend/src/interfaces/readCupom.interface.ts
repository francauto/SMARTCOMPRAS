export interface CupomAnalysisResult {
  sucesso: boolean;
  resultado: {
    raw_output: string;
    error?: string;
    parsed?: {
      litros: number;
      valor_por_litro: number;
      valor_total: number;
      placa: string;
      condutor: string;
    };
  };
}

