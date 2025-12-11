export interface Aprovador {
  id: number;
  nome: string;
  cargo: string;
}

export type AprovadorDiretoria = Aprovador;
export type AprovadorGerente = Aprovador;
