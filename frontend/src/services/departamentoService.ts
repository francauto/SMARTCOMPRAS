import { api } from "./api";
import { Departamento } from "@/types/departamento";
import { toast } from "@/utils/toastEmitter";

export const departamentoService = {
  // Buscar todos os departamentos
  listar: async (): Promise<Departamento[]> => {
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
