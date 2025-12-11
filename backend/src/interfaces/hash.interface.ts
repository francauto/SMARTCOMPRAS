export interface Ihash {
  tabela:
    | "cliente_request_id"
    | "combustivel_request_id"
    | "combustivel_request_estoque_id"
    | "requisicoes_id"
    | "requisicoes_estoque_id";
  id_requisicao: number;
}
