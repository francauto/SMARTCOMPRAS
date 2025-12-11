export interface BestDriveUsoResponse {
    id_veiculo_bd: number;
    status: string;
    id_solicitacao_sc: number;
}


export interface BestDriveOpenRequest {
    funcionario_id: number;
    motivo: string;
    carro_id: number;
    kmatual: number;
    solicitante_nome: string;
    id_solicitacao_sc: number;

}


export interface carsBestDrive{
    status: boolean;
    message: string;
    data: carsBestDriveData[];
}


export interface carsBestDriveData{
    id_bestdrive: number;
    marca: string;
    modelo: string;
    ano: number;
    placa: string;
    chassi: string | null;
    quilometragem_anterior: number;
    status: string;
    quilometragem_atual: number;
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

export interface dataBestDriveHistory {
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

export interface HistoryData {
  status: boolean;
  message: string;
  data?: dataBestDriveHistory;
}
