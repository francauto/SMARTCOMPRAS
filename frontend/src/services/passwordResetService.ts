import type { PasswordResetPayload } from "@/types/passwordReset";
import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export async function requestPasswordReset(usuario: string) {
  try {
    const response = await api.post("/auth/password-reset", { usuario });
    const data = response.data;

    // Backend retorna { message: "sucesso" } em caso de sucesso
    toast.success(data.message || "E-mail de redefinição enviado com sucesso!");
    return data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Erro ao solicitar redefinição de senha";
    toast.error(errorMessage);
    throw error;
  }
}

export async function changePassword(payload: PasswordResetPayload) {
  try {
    const response = await api.post("/auth/change-password", payload);
    const data = response.data;

    // Backend retorna { message: "sucesso" } em caso de sucesso
    toast.success(data.message || "Senha alterada com sucesso!");
    return data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Erro ao trocar senha";
    toast.error(errorMessage);
    throw error;
  }
}
