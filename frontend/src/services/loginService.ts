import type { LoginPayload } from "@/types/login";
import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export async function loginUser(payload: LoginPayload) {
  try {
    const response = await api.post("/auth/login", payload);
    const data = response.data;

    // Backend retorna { message: "sucesso", token, user } em caso de sucesso
    toast.success(data.message || "Login realizado com sucesso!");
    return data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || "Erro ao fazer login";
    toast.error(errorMessage);
    throw error;
  }
}
