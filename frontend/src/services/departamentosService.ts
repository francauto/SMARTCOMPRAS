import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export const departamentosService = {
  buscarTodos: async () => {
    try {
      const response = await api.get("/departamentos");
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao buscar departamentos"
      );
      throw error;
    }
  },
};
