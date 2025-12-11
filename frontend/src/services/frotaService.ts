import { api } from "./api";
import { toast } from "@/utils/toastEmitter";
import {
  FrotaRequisicao,
  FrotaRequisicaoDetalhada,
  SendFrotaRequest,
  FrotaListResponse,
} from "@/types/frota";

export interface FrotaFiltros {
  search?: string;
  dataInicio?: string;
  status?: string;
}

export const frotaService = {
  // Listar solicitações pendentes por aprovador
  listarPorAprovador: async (
    idAprovador: number,
    page: number,
    pageSize: number,
    filtros?: FrotaFiltros
  ): Promise<FrotaListResponse> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
    if (filtros?.status) params.append("status", filtros.status);

    const response = await api.get(
      `/frota/getFrotaPendente/${idAprovador}?${params.toString()}`
    );
    return response.data;
  },

  // Listar solicitações do solicitante
  listarPorSolicitante: async (
    idSolicitante: number,
    page: number,
    pageSize: number,
    filtros?: FrotaFiltros
  ): Promise<FrotaListResponse> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
    if (filtros?.status) params.append("status", filtros.status);

    const response = await api.get(
      `/frota/getFrotaPendenteSolicitante/${idSolicitante}?${params.toString()}`
    );
    return response.data;
  },

  // Buscar solicitação por ID
  buscarPorId: async (id: number): Promise<FrotaRequisicaoDetalhada> => {
    const response = await api.get(`/frota/getSolicitacaoFrotaById/${id}`);
    return response.data[0];
  },

  // Enviar nova solicitação
  enviarSolicitacao: async (payload: SendFrotaRequest): Promise<void> => {
    try {
      await api.post("/frota/sendFrotaRequest", payload);
      toast.success("Solicitação de combustível enviada com sucesso!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao enviar solicitação"
      );
      throw error;
    }
  },

  // Aprovar ou recusar requisição
  aprovarOuRecusar: async (id: number, aprovado: boolean): Promise<void> => {
    try {
      await api.post(`/frota/resRequestFrota/${id}`, { aprovado });
      if (aprovado) {
        toast.success("Requisição aprovada com sucesso!");
      } else {
        toast.info("Requisição reprovada");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Erro ao ${aprovado ? "aprovar" : "reprovar"} requisição`
      );
      throw error;
    }
  },

  // Atualizar status de impressão
  marcarImpresso: async (id: number): Promise<void> => {
    try {
      await api.post(`/frota/printFrotaRequests/${id}`);
      toast.success("Requisição marcada como impressa!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao marcar como impressa"
      );
      throw error;
    }
  },

  // Analisar cupom (envia imagem e retorna dados extraídos)
  analisarCupom: async (id: number, arquivo: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append("imagePath", arquivo);
      const response = await api.post(`/frota/analyzeCupom/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Cupom analisado com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao analisar cupom");
      throw error;
    }
  },

  // Confirmar cupom (envia dados validados para salvar)
  confirmarCupom: async (
    id: number,
    dados: {
      litros: number;
      valor_por_litro: number;
      valor_total: number;
    }
  ): Promise<any> => {
    try {
      const response = await api.post(`/frota/confirmCupom/${id}`, dados);
      toast.success("Cupom confirmado com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao confirmar cupom");
      throw error;
    }
  },
};
