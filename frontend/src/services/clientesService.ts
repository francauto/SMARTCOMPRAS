import { NovaSolicitacaoCliente } from "@/types/clientes";
import { ClienteRequisicao } from "@/types/clientes";
import { AprovarOuRecusarRequisicaoPayload } from "@/types/clientes";
import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export interface ClientesFiltros {
  search?: string;
  dataInicio?: string;
  status?: string;
}

export interface ClientesListarResponse {
  data: ClienteRequisicao[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filtros?: ClientesFiltros;
}

export const clientesService = {
  async listar(
    page: number = 1,
    pageSize: number = 20,
    filtros?: ClientesFiltros
  ): Promise<ClientesListarResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
    if (filtros?.status) params.append("status", filtros.status);

    const response = await api.get(`/clientes/requisicoes?${params.toString()}`);
    return response.data;
  },
  async criarSolicitacao(data: NovaSolicitacaoCliente) {
    try {
      const response = await api.post("/clientes/requisicao", data);
      toast.success("Solicitação de cliente criada com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao criar solicitação de cliente"
      );
      throw error;
    }
  },

  async listarAprovador(
    page: number = 1,
    pageSize: number = 20,
    filtros?: ClientesFiltros
  ): Promise<ClientesListarResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
    if (filtros?.status) params.append("status", filtros.status);

    const response = await api.get(`/clientes/requisicoes-aprovador?${params.toString()}`);
    return response.data;
  },

  async aprovarOuRecusarRequisicao(payload: AprovarOuRecusarRequisicaoPayload) {
    try {
      const response = await api.put("/clientes/requisicao/resposta", payload);
      if (payload.aprovado) {
        toast.success("Requisição aprovada com sucesso!");
      } else {
        toast.info("Requisição reprovada");
      }
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Erro ao ${payload.aprovado ? "aprovar" : "reprovar"} requisição`
      );
      throw error;
    }
  },

  async buscarPorId(id: number): Promise<ClienteRequisicao | null> {
    const response = await api.get(`/clientes/requisicao`, { params: { id } });
    if (response.data && typeof response.data === "object") {
      // Se vier { data: {...} }
      if (response.data.data) return response.data.data;
      // Se vier direto o objeto
      return response.data;
    }
    return null;
  },
};
