export interface sendFrotaRequest{
    veiculo: number,
    km:number,
    litro:number,
    id_aprovador:number,
    id_solicitante:number,
    tipo_combustivel: string,
    departamento: number,
    tanquecheio: boolean,
    placa: string,
    modelo: string,
    marca: string,
    ano: number
}