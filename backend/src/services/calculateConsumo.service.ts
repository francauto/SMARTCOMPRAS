import pool from "../config/db";
import { ConsumoVeiculo, RespostaConsumo } from "../interfaces/consumo.interface";
import { analisarConsumoGemini } from "./googleAi.service";

export async function getConsumoVeiculos({
  veiculo_id,
  dataInicio,
  dataFim,
  departamento,
  limite = 2,
}: {
  veiculo_id?: number;
  dataInicio?: string;
  dataFim?: string;
  departamento?: number;
  limite?: number;
}): Promise<RespostaConsumo> {
  let connection;
  connection = await pool.getConnection();

  try {
    const condicoes: string[] = ["cr.status IN ('Finalizado')"];
    const parametros: any[] = [];

    if (veiculo_id) {
      condicoes.push("cr.veiculo_id = ?");
      parametros.push(veiculo_id);
    }

    if (departamento) {
      condicoes.push("cr.id_departamento = ?");
      parametros.push(departamento);
    }

    if (dataInicio && dataFim) {
      condicoes.push("DATE(cr.data_solicitacao) BETWEEN ? AND ?");
      parametros.push(dataInicio, dataFim);
    } else if (dataInicio) {
      condicoes.push("DATE(cr.data_solicitacao) >= ?");
      parametros.push(dataInicio);
    } else if (dataFim) {
      condicoes.push("DATE(cr.data_solicitacao) <= ?");
      parametros.push(dataFim);
    }

    const whereClause = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

 
    const [veiculos]: any = await connection.query(
      `
      SELECT DISTINCT 
        cr.veiculo_id, 
        v.placa,
        v.modelo
      FROM combustivel_request cr
      JOIN veiculos v ON v.id = cr.veiculo_id
      ${whereClause}
      `,
      parametros
    );

    const resultados: ConsumoVeiculo[] = [];

    for (const v of veiculos) {
      const [registros]: any = await connection.query(
        `
        SELECT 
          km_veiculo,
          litros_cupom,
          tipo_combustivel,
          valor_total_cupom,
          data_solicitacao
        FROM combustivel_request
        WHERE veiculo_id = ?
          AND status IN ('Finalizado')
        ${dataInicio ? "AND DATE(data_solicitacao) >= ?" : ""}
        ${dataFim ? "AND DATE(data_solicitacao) <= ?" : ""}
        ORDER BY data_solicitacao ASC
        LIMIT ?
        `,
        [
          v.veiculo_id,
          ...(dataInicio ? [dataInicio] : []),
          ...(dataFim ? [dataFim] : []),
          limite,
        ]
      );

  if (registros.length >= 2) {
  for (let i = 1; i < registros.length; i++) {
    const anterior = registros[i - 1];
    const atual = registros[i];

    const kmRodado = Number(atual.km_veiculo) - Number(anterior.km_veiculo);
    const litros = Number(atual.litros_cupom) || 0;
    const valor = Number(atual.valor_total_cupom) || 0;

    if (kmRodado > 0 && litros > 0) {
      const consumoMedio = parseFloat((kmRodado / litros).toFixed(2));
      const custoPorKm = parseFloat((valor / kmRodado).toFixed(2));

      resultados.push({
        veiculo_id: v.veiculo_id,
        placa: v.placa,
        modelo: v.modelo,
        km_inicial: Number(anterior.km_veiculo),
        km_final: Number(atual.km_veiculo),
        km_rodado: kmRodado,
        litros_abastecidos: litros,
        valor_gasto: valor,
        consumo_medio_km_por_litro: consumoMedio,
        custo_por_km: custoPorKm,
        data_ultimo_abastecimento: atual.data_solicitacao,
        tipo_combustivel: atual.tipo_combustivel,
      });
    }
  }
  }}


    const analiseIA = resultados.length ? await analisarConsumoGemini(resultados) : undefined;

    return {
      status: true,
      total: resultados.length,
      data: resultados,
      analiseIA,
    };
  } catch (error) {
    console.error("Erro ao buscar consumo dos veículos:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getCarsConsumo(){
    let connection;
    connection = await pool.getConnection();
    try{
        const [listCards] = await connection.query(
            `SELECT * FROM veiculos
            WHERE id_veiculo_bd IS NOT NULL;
`
        )
        return listCards
    }catch(error){
        console.log('Erro ao buscar veiculos' + error);
        throw error;
    }finally{
        connection.release()
    }
}
