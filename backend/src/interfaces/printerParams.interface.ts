type TablesName =
  | "combustivel_request"
  | "combustivel_request_estoque"
  | "cliente_request"
  | "requisicoes"
  | "requisicoes_estoque";

export interface PrinterParamsInterfaceAgent {
  id_requisicao: number;
  nametable: TablesName;
  printer_ip: string;
  file_url: string;
}

export interface interfaceResponseAgentPrinter {
  success: string;
  error?: string | null;
  id_requisicao: string;
  tipo: string;
}
