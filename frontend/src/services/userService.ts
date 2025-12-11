import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export async function getUserProfile() {
  try {
    const response = await api.get("/auth/profile");
    return response.data;
  } catch (error: any) {
    toast.error(error.message || "Erro ao buscar perfil do usuário");
    throw error;
  }
}
