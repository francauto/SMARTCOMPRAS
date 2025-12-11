import type { RegisterPayload } from "@/types/register";
import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export async function registerUser(payload: RegisterPayload) {
  try {
    const response = await api.post("/auth/register", payload);
    const data = response.data;

    // Backend retorna { message: "sucesso" } em caso de sucesso
    toast.success(data.message || "Usuário registrado com sucesso!");
    return data;
  } catch (error: any) {
    // Backend pode retornar { error: "mensagem" } ou { message: "mensagem" }
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Erro ao registrar usuário";
    toast.error(errorMessage);
    throw error;
  }
}
