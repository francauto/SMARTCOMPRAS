import { api } from "./api";
import {
  AprovadorDiretoria,
  AprovadorGerente,
  Aprovador,
} from "@/types/aprovador";
import { toast } from "@/utils/toastEmitter";

export const aprovadoresService = {
  getAprovadores: async (): Promise<Aprovador[]> => {
    try {
      const response = await api.get("/aprovers/aprovadores");
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao buscar aprovadores"
      );
      throw error;
    }
  },
  getDiretoria: async (): Promise<AprovadorDiretoria[]> => {
    try {
      const response = await api.get("/aprovers/diretoria");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao buscar diretoria");
      throw error;
    }
  },
  getGerentes: async (): Promise<AprovadorGerente[]> => {
    try {
      const response = await api.get("/aprovers/gerentes");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao buscar gerentes");
      throw error;
    }
  },
};
