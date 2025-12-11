import { api } from "./api";
import { toast } from "@/utils/toastEmitter";
import type {
  ConsumptionResponse,
  ConsumptionFilters,
  VehicleConsumptionResponse,
} from "@/types/consumo";

export const consumoService = {
  getCars: async () => {
    const response = await api.get("/calculateConsumo/cars");
    return response.data;
  },

  getConsumptionData: async (
    filters?: ConsumptionFilters
  ): Promise<ConsumptionResponse> => {
    const params = new URLSearchParams();

    // Parâmetro padrão
    params.append("limite", "10");

    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    if (filters?.departamento)
      params.append("departamento", filters.departamento);
    if (filters?.placa) params.append("placa", filters.placa);

    const response = await api.get(
      `/calculateConsumo/edit?${params.toString()}`
    );
    return response.data;
  },

  getVehicleConsumptionDetails: async (
    veiculoId: number,
    filters?: ConsumptionFilters
  ): Promise<VehicleConsumptionResponse> => {
    const params = new URLSearchParams();

    params.append("veiculo_id", veiculoId.toString());
    // Parâmetro padrão
    params.append("limite", "10");
    
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);

    const response = await api.get(
      `/calculateConsumo/edit?${params.toString()}`
    );
    return response.data;
  },

};
