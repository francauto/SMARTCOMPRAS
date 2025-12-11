import axios from "axios";
import { FipeBrand, FipeModel, VehicleType } from "@/types/fipe";

const FIPE_API_BASE_URL = "https://fipe.parallelum.com.br/api/v2";

// Service para integração com a API FIPE
// Baseado no openapi.json da API FIPE v2.0.0

class FipeService {
  /**
   * Busca todas as marcas de veículos por tipo
   * GET /{vehicleType}/brands
   * @param vehicleType - Tipo do veículo (cars, motorcycles, trucks)
   * @returns Lista de marcas
   */
  async buscarMarcas(vehicleType: VehicleType = "cars"): Promise<FipeBrand[]> {
    try {
      const response = await axios.get<FipeBrand[]>(
        `${FIPE_API_BASE_URL}/${vehicleType}/brands`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar marcas da FIPE:", error);
      throw error;
    }
  }

  /**
   * Busca os modelos de uma marca específica
   * GET /{vehicleType}/brands/{brandId}/models
   * @param vehicleType - Tipo do veículo (cars, motorcycles, trucks)
   * @param brandId - Código da marca
   * @returns Lista de modelos
   */
  async buscarModelos(
    brandId: string,
    vehicleType: VehicleType = "cars"
  ): Promise<FipeModel[]> {
    try {
      const response = await axios.get<FipeModel[]>(
        `${FIPE_API_BASE_URL}/${vehicleType}/brands/${brandId}/models`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar modelos da FIPE:", error);
      throw error;
    }
  }

  /**
   * Busca informações detalhadas do veículo incluindo tipo de combustível
   * GET /{vehicleType}/brands/{brandId}/models/{modelId}/years/{yearId}
   * @param vehicleType - Tipo do veículo
   * @param brandId - Código da marca
   * @param modelId - Código do modelo
   * @param yearId - Código do ano (ex: "2014-3")
   * @returns Detalhes do veículo incluindo combustível
   */
  async buscarDetalhesVeiculo(
    brandId: string,
    modelId: string,
    yearId: string,
    vehicleType: VehicleType = "cars"
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${FIPE_API_BASE_URL}/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar detalhes do veículo:", error);
      throw error;
    }
  }

  /**
   * Busca os anos disponíveis para um modelo específico
   * GET /{vehicleType}/brands/{brandId}/models/{modelId}/years
   * @param vehicleType - Tipo do veículo
   * @param brandId - Código da marca
   * @param modelId - Código do modelo
   * @returns Lista de anos disponíveis
   */
  async buscarAnosModelo(
    brandId: string,
    modelId: string,
    vehicleType: VehicleType = "cars"
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${FIPE_API_BASE_URL}/${vehicleType}/brands/${brandId}/models/${modelId}/years`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar anos do modelo:", error);
      throw error;
    }
  }
}

export const fipeService = new FipeService();
