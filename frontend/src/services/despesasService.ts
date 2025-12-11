import { DespesaRequisicao } from "@/types/despesas";
import { api } from "./api";
import { toast } from "@/utils/toastEmitter";
import {
  DespesasListarResponse,
  AprovarCotaGerente,
  AprovarCotaDiretor,
  CriarRequisicaoDespesasPayload,
} from "@/types/despesas";

export interface DespesasFiltros {
  search?: string;
  dataInicio?: string;
  status?: string;
}

export const despesasService = {
  listar: async (
    page: number = 1,
    pageSize: number = 20,
    filtros?: DespesasFiltros
  ): Promise<DespesasListarResponse> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
    if (filtros?.status) params.append("status", filtros.status);

    const response = await api.get(`/despesas/requisicoes?${params.toString()}`);
    return response.data;
  },
  listarAprovador: async (
    page: number = 1,
    pageSize: number = 20,
    filtros?: DespesasFiltros
  ): Promise<DespesasListarResponse> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
    if (filtros?.status) params.append("status", filtros.status);

    const response = await api.get(`/despesas/requisicoes-aprovador?${params.toString()}`);
    return response.data;
  },
  buscarPorId: async (id: number) => {
    const response = await api.get(`/despesas/requisicao`, { params: { id } });
    return response.data;
  },
  aprovarCotaGerente: async (data: AprovarCotaGerente) => {
    try {
      const response = await api.post("/despesas/cota/aprovar-gerente", data);
      toast.success("Cota aprovada pelo gerente!");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao aprovar cota");
      throw error;
    }
  },
  aprovarCotaDiretor: async (data: AprovarCotaDiretor) => {
    try {
      const response = await api.put("/despesas/cota/aprovar-diretor", data);
      toast.success("Cota aprovada pelo diretor!");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao aprovar cota");
      throw error;
    }
  },
  recusarCota: async (data: { id_requisicao: number; id_cota: number }) => {
    try {
      const response = await api.put("/despesas/cota/recusar", data);
      toast.info("Cota recusada");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao recusar cota");
      throw error;
    }
  },
  criarRequisicao: async (data: CriarRequisicaoDespesasPayload) => {
    try {
      const response = await api.post("/despesas/requisicao", data);
      toast.success("Requisição de despesa criada com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao criar requisição de despesa"
      );
      throw error;
    }
  },
};
