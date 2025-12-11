import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export interface MasterFiltros {
  search?: string;
  status?: string;
  dataInicio?: string;
}

export interface MasterRequisicao {
  id: number;
  descricao?: string;
  nome_solicitante?: string;
  solicitante?: string;
  status: string;
  data_requisicao?: string;
  data_solicitacao?: string;
  data_resposta?: string;
  [key: string]: any;
}

export interface MasterListarResponse {
  data: MasterRequisicao[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export type Modulo =
  | "despesas"
  | "combustivel-frota"
  | "combustivel-estoque"
  | "estoque"
  | "cliente";

class MasterService {
  /**
   * Lista requisições por módulo
   */
  async listarRequisicoes(
    modulo: Modulo,
    page: number = 1,
    pageSize: number = 20,
    filtros?: MasterFiltros
  ): Promise<MasterListarResponse> {
    try {
      const params: any = {
        modulo,
        page,
        pageSize,
        ...filtros,
      };

      const response = await api.get("/master/requisicoes", { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          data: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
          message: "Nenhuma requisição encontrada.",
        };
      }
      toast.error(error.response?.data?.error || "Erro ao listar requisições");
      throw error;
    }
  }

  /**
   * Busca requisição por ID e módulo
   */
  async buscarRequisicaoPorId(
    modulo: Modulo,
    id_requisicao: number
  ): Promise<any> {
    try {
      const response = await api.get(
        `/master/requisicoes/${modulo}/${id_requisicao}`
      );
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao buscar requisição");
      throw error;
    }
  }

  /**
   * Aprovar requisição (qualquer módulo exceto despesas)
   */
  async aprovarRequisicao(modulo: Modulo, id_requisicao: number): Promise<any> {
    try {
      const response = await api.post(
        `/master/${modulo}/aprovar/${id_requisicao}`
      );
      toast.success("Requisição aprovada com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao aprovar requisição");
      throw error;
    }
  }

  /**
   * Recusar requisição (qualquer módulo exceto despesas)
   */
  async recusarRequisicao(modulo: Modulo, id_requisicao: number): Promise<any> {
    try {
      const response = await api.post(
        `/master/${modulo}/recusar/${id_requisicao}`
      );
      toast.success("Requisição recusada com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao recusar requisição");
      throw error;
    }
  }

  /**
   * Aprovar despesas - gerente (cota específica)
   */
  async aprovarDespesasGerente(
    id_requisicao: number,
    id_cota: number
  ): Promise<any> {
    try {
      const response = await api.post(
        `/master/despesas/aprovar-gerente/${id_requisicao}/${id_cota}`
      );
      toast.success("Cota aprovada como gerente!");
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Erro ao aprovar despesas (gerente)"
      );
      throw error;
    }
  }

  /**
   * Aprovar despesas - diretor
   */
  async aprovarDespesasDiretor(
    id_requisicao: number,
    id_cota: number
  ): Promise<any> {
    try {
      const response = await api.post(
        `/master/despesas/aprovar-diretor/${id_requisicao}/${id_cota}`
      );
      toast.success("Cota aprovada como diretor!");
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Erro ao aprovar despesas (diretor)"
      );
      throw error;
    }
  }

  /**
   * Recusar despesas
   */
  async recusarDespesas(id_requisicao: number, motivo?: string): Promise<any> {
    try {
      const response = await api.post(
        `/master/despesas/recusar/${id_requisicao}`,
        { motivo }
      );
      toast.success("Despesas recusadas com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao recusar despesas");
      throw error;
    }
  }
}

export const masterService = new MasterService();
