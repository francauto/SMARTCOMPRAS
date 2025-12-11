import { Usuario, AtualizarUsuarioPayload } from "@/types/admin";
import { api } from "./api";
import { toast } from "@/utils/toastEmitter";

export const adminService = {
  async listarUsuarios(): Promise<Usuario[]> {
    try {
      const response = await api.get("/admin/usuarios");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao buscar usuários");
      throw error;
    }
  },

  async atualizarUsuario(
    id: number,
    payload: AtualizarUsuarioPayload
  ): Promise<Usuario> {
    try {
      const response = await api.put(`/admin/usuarios/${id}`, payload);
      toast.success("Usuário atualizado com sucesso!");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao atualizar usuário");
      throw error;
    }
  },

  async resetarSenha(id: number): Promise<void> {
    try {
      await api.put(`/admin/usuarios/${id}/reset-senha`);
      toast.success("Senha resetada com sucesso!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao resetar senha");
      throw error;
    }
  },
};
