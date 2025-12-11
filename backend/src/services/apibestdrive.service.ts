import {
  BestDriveOpenRequest,
  BestDriveUsoResponse,
  carsBestDrive,
  carsBestDriveData,
  dataBestDriveHistory,
  HistoryData,
} from "../interfaces/bestDriveApi.interface";
import pool from "../config/db";

export async function resBestDriveUso(resBestDriveUso: BestDriveUsoResponse) {
  if (!resBestDriveUso || !resBestDriveUso.id_veiculo_bd) {
    throw new Error("Resposta inválida da API BestDrive");
  }
  let connection;
  connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (resBestDriveUso.status === "aprovado") {
      const updateRequest = await connection.query(
        `UPDATE combustivel_request 
                SET best_drive_res = TRUE,
                status_res_bestdrive = 'aprovado'
                WHERE id = ?;`,
        [resBestDriveUso.id_solicitacao_sc]
      );
      await connection.commit();
    } else if (resBestDriveUso.status === "rejeitado") {
      const updateRequest = await connection.query(
        `UPDATE combustivel_request 
                SET best_drive_res = TRUE,
                status_res_bestdrive = 'rejeitado',
                aprovado = FALSE,
                status = 'Reprovado'
                WHERE id = ?;`,
        [resBestDriveUso.id_solicitacao_sc]
      );
      await connection.commit();
    }
  } catch (error) {
    console.error("Erro ao verificar uso do BestDrive:", error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function openSolicitacaoBestDrive(payload: BestDriveOpenRequest) {
  if (
    !payload ||
    !payload.carro_id ||
    !payload.funcionario_id ||
    !payload.kmatual ||
    !payload.motivo
  ) {
    throw new Error("Parâmetros inválidos para abrir solicitação no BestDrive");
  }

  console.log("Payload para BestDrive:", payload);

  try {
    const response = await fetch(
      "https://apibestdrive.francautolabs.com.br/api/external/key-request",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BESTDRIVE_API_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        status: false,
        message: `Erro ao abrir solicitação no BestDrive (${response.status})`,
        error: data || response.statusText,
      };
    }

    console.log("Solicitação enviada com sucesso:", data);
    return {
      status: true,
      message: "Solicitação aberta com sucesso no BestDrive",
      data,
    };
  } catch (error) {
    console.error("Erro ao enviar solicitação:", error);
    return {
      status: false,
      message: "Erro ao abrir solicitação no BestDrive",
    };
  }
}

export async function getCarsBestDrive(): Promise<carsBestDrive> {
  try {
    const response = await fetch(
      "https://apibestdrive.francautolabs.com.br/api/external/cars/",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BESTDRIVE_API_KEY}`,
        },
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      return {
        status: false,
        message: `Erro ao buscar carros no BestDrive (${response.status})`,
        data: [],
      };
    }

    const mapeiaCarros: carsBestDriveData[] = data.cars.map((car: any) => ({
      id_bestdrive: car.ID,
      marca: car.Marca,
      modelo: car.Modelo,
      ano: car.Ano,
      placa: car.Placa,
      chassi: car.Chassi,
      quilometragem_anterior: car.QuilometragemAnterior,
      status: car.status,
      quilometragem_atual: car.QuilometragemAtual,
    }));

    console.log("Carros retornados com sucesso:", mapeiaCarros);

    return {
      status: true,
      message: "Carros retornados com sucesso",
      data: mapeiaCarros,
    };
  } catch (error) {
    console.error("Erro ao buscar carros no BestDrive:", error);
    return {
      status: false,
      message: "Erro ao buscar carros no BestDrive",
      data: [],
    };
  }
}

export async function getHistoryCars(id_carro: number): Promise<HistoryData> {
  try {
    const connection = await pool.getConnection();

    const [getCarBdSm]: any = await connection.query(
      `SELECT id_veiculo_bd FROM veiculos WHERE id = ?`,
      [id_carro]
    );

    console.log("IP BESTDRIVE:" + getCarBdSm[0].id_veiculo_bd);

    const response = await fetch(
      `https://apibestdrive.francautolabs.com.br/api/external/history/complete/${getCarBdSm[0].id_veiculo_bd}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BESTDRIVE_API_KEY}`,
        },
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.data) {
      return {
        status: false,
        message: "Erro ao buscar históricos no BestDrive",
        data: {
          internal: { total: 0, history: [] },
          bestDrive: { total: 0, history: [] },
          totalRecords: 0,
        },
      };
    }

    const mapeiaRetorno: dataBestDriveHistory = {
      internal: {
        total: data.data.internal.total,
        history: data.data.internal.history,
      },
      bestDrive: {
        total: data.data.bestDrive.total,
        history: data.data.bestDrive.history,
      },
      totalRecords: data.data.totalRecords,
    };

    console.log("Históricos retornados com sucesso:", mapeiaRetorno);

    return {
      status: true,
      message: "Históricos retornados com sucesso",
      data: mapeiaRetorno,
    };
  } catch (error) {
    console.error("Erro ao buscar históricos no BestDrive:", error);
    return {
      status: false,
      message: "Erro ao buscar históricos no BestDrive",
      data: {
        internal: { total: 0, history: [] },
        bestDrive: { total: 0, history: [] },
        totalRecords: 0,
      },
    };
  }
}

export async function modifyCUpomBD(
  id_solicitacao_sc: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://apibestdrive.francautolabs.com.br/api/external/releaseKey/${id_solicitacao_sc}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BESTDRIVE_API_KEY}`,
        },
      }
    );
    const data = await response.json().catch(() => null);
    console.log("->>>>>>>>>>" + data);

    if (!response.ok || !data) {
      return false;
    }
    return true;
  } catch (error) {
    console.log("Erro ao buscar carros no BestDrive: ->>>>>>>>>>>>>>", error);

    return false;
  }
}
