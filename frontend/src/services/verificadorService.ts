import { BuscarHashPayload, AtualizarUsoHashPayload } from "@/types/verificador";
import { api } from "./api";

export const verificadorService = {
  async buscarHash(payload: BuscarHashPayload) {
    const response = await api.post("/hash/buscar", payload);
    return response.data;
  },
  async atualizarUsoHash(payload: AtualizarUsoHashPayload) {
    const response = await api.post("/hash/atualizarUso", payload);
    return response.data;
  }
};
