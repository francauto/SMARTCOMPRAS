import { api } from "./api";
import { CarsBestDriveResponse, HistoryDataResponse } from "@/types/bestdrive";
import { toast } from "@/utils/toastEmitter";

export const bestdriveService = {
  // Buscar todos os veículos do BestDrive
  buscarVeiculos: async (): Promise<CarsBestDriveResponse> => {
    try {
      const response = await api.get("/apiBestDrive/getCars");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao buscar veículos");
      throw error;
    }
  },

  // Buscar histórico de consumo de um veículo
  buscarHistorico: async (id_veiculo: number): Promise<HistoryDataResponse> => {
    try {
      const response = await api.get(`/apiBestDrive/getHistory/${id_veiculo}`);
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao buscar histórico");
      throw error;
    }
  },
};
