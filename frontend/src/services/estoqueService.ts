import {
  EstoqueRequisicao,
  EstoqueRequisicaoDetalhada,
  NovaSolicitacaoEstoque,
  AprovarOuRecusarRequisicaoPayload,
} from "@/types/estoque";
import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export interface EstoqueFiltros {
  search?: string;
  dataInicio?: string;
  status?: string;
}

export interface EstoqueListarResponse {
  data: EstoqueRequisicao[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filtros?: EstoqueFiltros;
}

export const estoqueService = {
  async listar(
    page: number = 1,
    pageSize: number = 20,
    filtros?: EstoqueFiltros
  ): Promise<EstoqueListarResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
    if (filtros?.status) params.append("status", filtros.status);

    const response = await api.get(`/estoque/requisicoes?${params.toString()}`);
    return response.data;
  },

  async buscarPorId(id: number): Promise<EstoqueRequisicaoDetalhada> {
    const response = await api.get(`/estoque/requisicao`, { params: { id } });
    return response.data;
  },
  async criarSolicitacao(data: NovaSolicitacaoEstoque) {
    try {
      const response = await api.post("/estoque/requisicao", data);
      toast.success("Solicitação de estoque criada com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao criar solicitação de estoque"
      );
      throw error;
    }
  },
  async listarAprovador(
    page: number = 1,
    pageSize: number = 20,
    filtros?: EstoqueFiltros
  ): Promise<EstoqueListarResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
    if (filtros?.status) params.append("status", filtros.status);

    const response = await api.get(`/estoque/requisicoes-aprovador?${params.toString()}`);
    return response.data;
  },
  async aprovarOuRecusarRequisicao(payload: AprovarOuRecusarRequisicaoPayload) {
    try {
      const response = await api.put("/estoque/requisicao/resposta", payload);
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
};
