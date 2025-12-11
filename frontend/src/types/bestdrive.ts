export interface CarBestDrive {
  id_bestdrive: number;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  chassi: string | null;
  quilometragem_anterior: number;
  quilometragem_atual: number;
  status?: string;
}

export interface CarsBestDriveResponse {
  status: boolean;
  message: string;
  data: CarBestDrive[];
}

export interface HistoryRecordInternal {
  SolicitacaoID: number;
  CarroID: number;
  Marca: string;
  Modelo: string;
  Placa: string;
  Chassi: string | null;
  FuncionarioID: number;
  Status: string;
  KmSaida: number;
  KmChegada: number;
  MotivoSaida: string;
  DataSaida: string;
  DataChegada: string;
  Responsavel: number;
  KmRodados: number;
}

export interface HistoryRecordBestDrive {
  SolicitacaoID: number;
  CarroID: number;
  Marca: string;
  Modelo: string;
  Placa: string;
  Chassi: string | null;
  VendedorID: number;
  ClienteID: number;
  ClienteNome: string;
  Status: string;
  KmSaida: number;
  KmChegada: number;
  DataHoraSaida: string;
  DataHoraChegada: string;
  Responsavel: number;
  KmRodados: number;
}

export interface DataBestDriveHistory {
  internal: {
    total: number;
    history: HistoryRecordInternal[];
  };
  bestDrive: {
    total: number;
    history: HistoryRecordBestDrive[];
  };
  totalRecords: number;
}

export interface HistoryDataResponse {
  status: boolean;
  message: string;
  data?: DataBestDriveHistory;
}
