export interface Usuario {
  id: number;
  nome: string;
  sobrenome: string;
  usuario: string;
  mail: string; // <- backend
  cargo: string;
  telefone?: string | null;
  id_departamento?: number | null;
  departamento?: string;
  master: boolean | number;
  verificador: boolean | number;
  ativo: boolean | number;
}

export interface AtualizarUsuarioPayload {
  nome: string;
  sobrenome: string;
  usuario: string;
  mail: string;
  cargo: string;
  telefone: string;
  id_departamento: number;
}
