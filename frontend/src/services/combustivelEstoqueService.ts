import { api } from "./api";
import { toast } from "@/utils/toastEmitter";
import {
  CombustivelEstoqueListResponse,
  CombustivelEstoqueFiltros,
  CombustivelEstoqueResponse,
  CriarRequisicaoCombustivelEstoque,
  RespostaRequisicaoCombustivelEstoque,
} from "@/types/combustivel-estoque";

class CombustivelEstoqueService {
  private baseURL = "/combustivel-estoque";

  /**
   * Busca requisições do solicitante autenticado
   * @param page - Número da página
   * @param pageSize - Tamanho da página
   * @param filtros - Filtros de busca (search, dataInicio, status)
   */
  async listarPorSolicitante(
    page: number,
    pageSize: number,
    filtros?: CombustivelEstoqueFiltros
  ): Promise<CombustivelEstoqueListResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    if (filtros) {
      if (filtros.search) params.append("search", filtros.search);
      if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio);
      if (filtros.status) params.append("status", filtros.status);
    }

    const response = await api.get<CombustivelEstoqueListResponse>(
      `${this.baseURL}/requisicoes?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Busca requisições do aprovador autenticado
   * @param page - Número da página
   * @param pageSize - Tamanho da página
   * @param filtros - Filtros de busca (search, dataInicio, status)
   */
  async listarPorAprovador(
    page: number,
    pageSize: number,
    filtros?: CombustivelEstoqueFiltros
  ): Promise<CombustivelEstoqueListResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    if (filtros) {
      if (filtros.search) params.append("search", filtros.search);
      if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio);
      if (filtros.status) params.append("status", filtros.status);
    }

    const response = await api.get<CombustivelEstoqueListResponse>(
      `${this.baseURL}/requisicoes-aprovador?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Busca uma requisição por ID
   * @param id - ID da requisição
   */
  async buscarPorId(id: number): Promise<CombustivelEstoqueResponse> {
    const response = await api.get<CombustivelEstoqueResponse>(
      `${this.baseURL}/requisicao?id=${id}`
    );
    return response.data;
  }

  /**
   * Cria uma nova requisição de combustível estoque
   * @param dados - Dados da requisição
   */
  async criarRequisicao(
    dados: CriarRequisicaoCombustivelEstoque
  ): Promise<CombustivelEstoqueResponse> {
    try {
      const response = await api.post<CombustivelEstoqueResponse>(
        `${this.baseURL}/requisicao`,
        dados
      );
      toast.success("Requisição de combustível criada com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Erro ao criar requisição de combustível"
      );
      throw error;
    }
  }

  /**
   * Responde uma requisição (aprovar ou reprovar)
   * @param dados - ID da requisição e status de aprovação
   */
  async responderRequisicao(
    dados: RespostaRequisicaoCombustivelEstoque
  ): Promise<CombustivelEstoqueResponse> {
    const response = await api.put<CombustivelEstoqueResponse>(
      `${this.baseURL}/requisicao/resposta`,
      dados
    );
    return response.data;
  }

  /**
   * Aprovar uma requisição
   * @param id_requisicao - ID da requisição
   */
  async aprovar(id_requisicao: number): Promise<CombustivelEstoqueResponse> {
    try {
      const result = await this.responderRequisicao({
        id_requisicao,
        aprovado: true,
      });
      toast.success("Requisição aprovada com sucesso!");
      return result;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao aprovar requisição"
      );
      throw error;
    }
  }

  /**
   * Reprovar uma requisição
   * @param id_requisicao - ID da requisição
   */
  async reprovar(id_requisicao: number): Promise<CombustivelEstoqueResponse> {
    try {
      const result = await this.responderRequisicao({
        id_requisicao,
        aprovado: false,
      });
      toast.info("Requisição reprovada");
      return result;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao reprovar requisição"
      );
      throw error;
    }
  }
}

export const combustivelEstoqueService = new CombustivelEstoqueService();
