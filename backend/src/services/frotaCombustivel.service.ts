import pool from "../config/db";
import { sendFrotaRequest } from "../interfaces/frotaCombustivel.interface";
import { CupomAnalysisResult } from "../interfaces/readCupom.interface";
import {
  modifyCUpomBD,
  openSolicitacaoBestDrive,
  resBestDriveUso,
} from "./apibestdrive.service";
import { analyzeCupomImage } from "./googleAi.service";
import { createRequestRelation } from "./hash.service";
import { printRequestsAgentService } from "./printer.service";
import { NotificationService } from "./notification/NotificationService";
import moment from "moment";

export async function getFrotaPendente(
  idAprovador: number,
  page: number = 1,
  pageSize: number = 20,
  filtros?: {
    status?: string;
    search?: string;
  }
) {
  let connection;
  connection = await pool.getConnection();

  try {
    const offset = (page - 1) * pageSize;

    const condicoes: string[] = ["cr.id_aprovador = ?"];
    const parametros: any[] = [idAprovador];

    // 🔍 Filtro de busca geral (placa, veículo, solicitante, requisição)
    if (filtros?.search && filtros.search.trim() !== "") {
      condicoes.push(
        "(v.placa LIKE ? OR v.modelo LIKE ? OR f.nome LIKE ? OR CAST(cr.id AS CHAR) LIKE ?)"
      );
      const searchTerm = `%${filtros.search}%`;
      parametros.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // 🧾 Filtro por status (exato)
    if (filtros?.status && filtros.status.trim() !== "") {
      condicoes.push("cr.status = ?");
      parametros.push(filtros.status);
    }

    const whereClause = `WHERE ${condicoes.join(" AND ")}`;

    // 🧮 Query de contagem total
    const countQuery = `
      SELECT COUNT(DISTINCT cr.id) AS total
      FROM combustivel_request cr
      JOIN veiculos v ON cr.veiculo_id = v.id
      JOIN Funcionarios f ON cr.id_solicitante = f.id
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      ${whereClause};
    `;
    const [totalResult] = await connection.query<any[]>(countQuery, parametros);
    const total = totalResult[0]?.total || 0;

    // 🚗 Query principal
    const query = `
      SELECT 
        cr.id, 
        v.modelo AS veiculo_nome, 
        v.placa AS veiculo_placa, 
        f.nome AS solicitante_nome, 
        cr.km_veiculo, 
        cr.quantidade_litros, 
        cr.status, 
        cr.tanque_cheio,
        cr.data_solicitacao, 
        cr.tipo_combustivel,
        cr.best_drive_res AS respondido_bestdrive,
        cr.impresso, 
        cr.data_aprovacao, 
        d.nome AS departamento_nome
      FROM combustivel_request cr
      JOIN veiculos v ON cr.veiculo_id = v.id
      JOIN Funcionarios f ON cr.id_solicitante = f.id
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      ${whereClause}
      GROUP BY cr.id
      ORDER BY cr.data_solicitacao DESC
      LIMIT ?
      OFFSET ?;
    `;

    const queryParams = [...parametros, pageSize, offset];
    const [solicitacoes] = await connection.query<any[]>(query, queryParams);

    return {
      data: solicitacoes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      filtros,
    };
  } catch (error) {
    console.error("Erro ao buscar solicitações de frota:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getFrotaPendenteSolicitante(
  idSolicitante: number,
  page: number = 1,
  pageSize: number = 20,
  filtros?: {
    status?: string;
    search?: string;
  }
) {
  let connection;
  connection = await pool.getConnection();

  try {
    const offset = (page - 1) * pageSize;

    const condicoes: string[] = ["cr.id_solicitante = ?"];
    const parametros: any[] = [idSolicitante];

    // 🔍 Filtro de busca geral (placa, veículo, solicitante, requisição)
    if (filtros?.search && filtros.search.trim() !== "") {
      condicoes.push(
        "(v.placa LIKE ? OR v.modelo LIKE ? OR f.nome LIKE ? OR CAST(cr.id AS CHAR) LIKE ?)"
      );
      const searchTerm = `%${filtros.search}%`;
      parametros.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // 🧾 Filtro por status (exato)
    if (filtros?.status && filtros.status.trim() !== "") {
      condicoes.push("cr.status = ?");
      parametros.push(filtros.status);
    }

    const whereClause = `WHERE ${condicoes.join(" AND ")}`;

    // 🧮 Query de contagem total
    const countQuery = `
      SELECT COUNT(DISTINCT cr.id) AS total
      FROM combustivel_request cr
      JOIN veiculos v ON cr.veiculo_id = v.id
      JOIN Funcionarios f ON cr.id_solicitante = f.id
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      ${whereClause};
    `;
    const [totalResult] = await connection.query<any[]>(countQuery, parametros);
    const total = totalResult[0]?.total || 0;

    // 🚗 Query principal
    const query = `
      SELECT 
        cr.id, 
        v.modelo AS veiculo_nome, 
        v.placa AS veiculo_placa, 
        f.nome AS solicitante_nome, 
        cr.km_veiculo, 
        cr.quantidade_litros, 
        cr.status, 
        cr.tanque_cheio,
        cr.data_solicitacao, 
        cr.tipo_combustivel,
        cr.best_drive_res AS respondido_bestdrive,
        cr.impresso, 
        cr.data_aprovacao, 
        d.nome AS departamento_nome
      FROM combustivel_request cr
      JOIN veiculos v ON cr.veiculo_id = v.id
      JOIN Funcionarios f ON cr.id_solicitante = f.id
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      ${whereClause}
      GROUP BY cr.id
      ORDER BY cr.data_solicitacao DESC
      LIMIT ?
      OFFSET ?;
    `;

    const queryParams = [...parametros, pageSize, offset];
    const [solicitacoes] = await connection.query<any[]>(query, queryParams);

    return {
      data: solicitacoes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      filtros,
    };
  } catch (error) {
    console.error("Erro ao buscar solicitações de frota:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getSolicitacaoFrotaById(id: number) {
  try {
    const [rows] = await pool.query(
      `SELECT  
          cr.id,
          cr.veiculo_id,
          cr.km_veiculo,
          cr.quantidade_litros,
          cr.data_solicitacao,
          cr.data_aprovacao,
          cr.id_solicitante,
          cr.status,
          cr.id_aprovador,
          cr.tipo_combustivel,
          cr.best_drive_res AS respondido_bestdrive,
          cr.impresso,
          CASE 
            WHEN cr.tanque_cheio = 1 THEN TRUE
            ELSE FALSE
          END AS tanque_cheio,
          CONCAT(f1.nome, ' ', f1.sobrenome) AS nome_solicitante,
          CONCAT(f2.nome, ' ', f2.sobrenome) AS nome_aprovador,
          v.modelo,
          v.placa,
          d.nome AS departamento_nome
      FROM combustivel_request cr
      LEFT JOIN Funcionarios f1 ON cr.id_solicitante = f1.id
      LEFT JOIN Funcionarios f2 ON cr.id_aprovador = f2.id
      LEFT JOIN veiculos v ON cr.veiculo_id = v.id
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      WHERE cr.id = ?
      ORDER BY cr.data_solicitacao DESC`,
      [id]
    );
    return rows;
  } catch (error) {
    console.error("Erro ao buscar solicitação de frota por ID:", error);
    throw error;
  }
}

export async function sendRequest(payload: sendFrotaRequest) {
  if (!payload) {
    throw new Error("Payload inválido");
  }

  let connection;
  connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rowsVeiculo]: any = await connection.query(
      `SELECT id_veiculo_bd, id FROM veiculos WHERE id_veiculo_bd = ? `,
      [payload.veiculo]
    );

    console.log("Rows Veículo:", rowsVeiculo);
    let insertVeiculoId;
    if (rowsVeiculo.length === 0) {
      const [resultInsert]: any = await connection.query(
        `INSERT INTO veiculos (placa, modelo, marca , ano , id_veiculo_bd) VALUES (?, ?, ?, ?, ?)`,
        [
          payload.placa,
          payload.modelo,
          payload.marca,
          payload.ano,
          payload.veiculo,
        ]
      );
      await connection.commit();
      insertVeiculoId = resultInsert.insertId;
      console.log("Aqui No não existe");
    } else {
      insertVeiculoId = rowsVeiculo[0].id;
      console.log("Aqui no existe");
    }

    console.log("Insert Veículo ID:", insertVeiculoId);
    const [verificaUltimoKM]: any = await connection.query(
      `SELECT km_veiculo FROM combustivel_request 
         WHERE veiculo_id = ? 
         ORDER BY data_solicitacao DESC 
         LIMIT 1`,
      [insertVeiculoId]
    );

    const ultimoKm =
      verificaUltimoKM.length > 0 ? verificaUltimoKM[0].km_veiculo : 0;

    console.log(
      `Verifica ultimo KM, Tabela: ${ultimoKm}, payload: ${payload.km}`
    );
    if (payload.km < ultimoKm) {
      await connection.rollback();
      throw new Error(
        "O KM informado é menor que o último KM registrado para este veículo." +
          payload.km +
          ultimoKm
      );
    }

    const [insertCombustivelRequest]: any = await connection.query(
      `INSERT INTO combustivel_request
      (veiculo_id, km_veiculo, quantidade_litros, id_solicitante, id_aprovador, tipo_combustivel, id_departamento, tanque_cheio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        insertVeiculoId,
        payload.km,
        payload.litro,
        payload.id_solicitante,
        payload.id_aprovador,
        payload.tipo_combustivel,
        payload.departamento,
        payload.tanquecheio,
      ]
    );

    const [nomeSolicitante]: any = await connection.query(
      `SELECT nome FROM Funcionarios WHERE id = ?`,
      [payload.id_solicitante]
    );

    const responseService = await openSolicitacaoBestDrive({
      funcionario_id: payload.id_solicitante,
      motivo: `Abastecimento de frota, via SMARTCOMPRAS, Requisição n°:${insertCombustivelRequest.insertId}`,
      carro_id: payload.veiculo,
      kmatual: Number(payload.km),
      solicitante_nome: nomeSolicitante[0].nome,
      id_solicitacao_sc: insertCombustivelRequest.insertId,
    });

    if (!responseService.status) {
      await connection.rollback();
      throw new Error(
        "Falha ao enviar solicitação para o BestDrive: " +
          responseService.message
      );
    }

    await connection.commit();

    // 📧 Enviar notificação para o aprovador
    try {
      const notificationService = new NotificationService();
      const baseUrl =
        process.env.APP_BASE_URL || "https://smartcompras.francautolabs.com.br";
      const link = `${baseUrl}/combustivel-frota/solicitacoes?modal=detalhes&id=${insertCombustivelRequest.insertId}`;

      const [aprovador]: any = await connection.query(
        `SELECT nome, sobrenome, email, telefone FROM Funcionarios WHERE id = ?`,
        [payload.id_aprovador]
      );

      const [solicitante]: any = await connection.query(
        `SELECT nome, sobrenome FROM Funcionarios WHERE id = ?`,
        [payload.id_solicitante]
      );

      const [veiculo]: any = await connection.query(
        `SELECT placa, modelo FROM veiculos WHERE id = ?`,
        [insertVeiculoId]
      );

      const templateData = {
        id_requisicao: insertCombustivelRequest.insertId.toString(),
        solicitante: `${solicitante[0].nome} ${solicitante[0].sobrenome}`,
        data_solicitacao: moment(new Date()).format("DD/MM/YYYY"),
        veiculo: `${veiculo[0].modelo} - ${veiculo[0].placa}`,
        km_veiculo: payload.km.toString(),
        quantidade_litros: payload.litro.toString(),
        tipo_combustivel: payload.tipo_combustivel,
        tanque_cheio: payload.tanquecheio ? "Sim" : "Não",
        aprovador_nome: `${aprovador[0].nome} ${aprovador[0].sobrenome}`,
      };

      await notificationService.notify({
        recipients: [
          {
            name: `${aprovador[0].nome} ${aprovador[0].sobrenome}`,
            email: aprovador[0].email,
            phone: aprovador[0].telefone,
          },
        ],
        template: "NOVA_SOLICITACAO",
        data: templateData,
        module: "COMBUSTIVEL_FROTA",
        link,
      });
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
    }
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao enviar requisição de frota:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function resRequestFrota(
  id_requisicao: number,
  aprovado: boolean
) {
  let connection;
  connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const status = aprovado ? "Aprovado" : "Reprovado";

    if (
      !id_requisicao ||
      id_requisicao <= 0 ||
      isNaN(id_requisicao) ||
      status === null ||
      status === undefined
    ) {
      throw new Error(
        "ID da requisição inválido ou status de aprovação inválido"
      );
    }

    const [verificaBestDrive]: any = await connection.query(
      `SELECT best_drive_res, status_res_bestdrive FROM combustivel_request WHERE id = ?`,
      [id_requisicao]
    );

    if (
      status === "Reprovado" &&
      verificaBestDrive[0].best_drive_res === 1 &&
      verificaBestDrive[0].status_res_bestdrive === "aprovado"
    ) {
      await connection.query(
        `UPDATE combustivel_request SET aprovado = ?, status = ?, data_aprovacao = NOW() WHERE id = ?`,
        [0, "Reprovado", id_requisicao]
      );
      await connection.commit();

      // 📧 Notificar solicitante sobre reprovação
      try {
        const notificationService = new NotificationService();
        const baseUrl =
          process.env.APP_BASE_URL ||
          "https://smartcompras.francautolabs.com.br";
        const link = `${baseUrl}/combustivel-frota/solicitacoes?modal=detalhes&id=${id_requisicao}`;

        const [requisicao]: any = await connection.query(
          `SELECT 
            cr.id, cr.km_veiculo, cr.quantidade_litros, cr.tipo_combustivel, cr.tanque_cheio,
            cr.data_aprovacao,
            s.nome AS solicitante_nome, s.sobrenome AS solicitante_sobrenome, 
            s.email AS solicitante_email, s.telefone AS solicitante_telefone,
            a.nome AS aprovador_nome, a.sobrenome AS aprovador_sobrenome,
            v.placa, v.modelo
          FROM combustivel_request cr
          JOIN Funcionarios s ON cr.id_solicitante = s.id
          JOIN Funcionarios a ON cr.id_aprovador = a.id
          JOIN veiculos v ON cr.veiculo_id = v.id
          WHERE cr.id = ?`,
          [id_requisicao]
        );

        const dataAprovacao = requisicao[0]?.data_aprovacao
          ? moment(requisicao[0].data_aprovacao).format("DD/MM/YYYY HH:mm")
          : moment().format("DD/MM/YYYY HH:mm");

        const templateData = {
          id_requisicao: id_requisicao.toString(),
          solicitante: `${requisicao[0].solicitante_nome} ${requisicao[0].solicitante_sobrenome}`,
          veiculo: `${requisicao[0].modelo} - ${requisicao[0].placa}`,
          km_veiculo: requisicao[0].km_veiculo.toString(),
          quantidade_litros: requisicao[0].quantidade_litros.toString(),
          tipo_combustivel: requisicao[0].tipo_combustivel,
          tanque_cheio: requisicao[0].tanque_cheio ? "Sim" : "Não",
          aprovador_nome: `${requisicao[0].aprovador_nome} ${requisicao[0].aprovador_sobrenome}`,
          data_aprovacao: dataAprovacao,
          status: "❌ Reprovado",
        };

        await notificationService.notify({
          recipients: [
            {
              name: `${requisicao[0].solicitante_nome} ${requisicao[0].solicitante_sobrenome}`,
              email: requisicao[0].solicitante_email,
              phone: requisicao[0].solicitante_telefone,
            },
          ],
          template: "RESPOSTA_SOLICITACAO",
          data: templateData,
          module: "COMBUSTIVEL_FROTA",
          link,
        });
      } catch (error) {
        console.error("Erro ao enviar notificações:", error);
      }

      return;
    }

    if (
      verificaBestDrive[0].best_drive_res === 1 &&
      verificaBestDrive[0].status_res_bestdrive === "aprovado"
    ) {
      await createRequestRelation(
        { tabela: "combustivel_request_id", id_requisicao },
        connection
      );
      const queryaprovar = await connection.query(
        `UPDATE combustivel_request SET aprovado = ?, status = ?, data_aprovacao = NOW() WHERE id = ?`,
        [aprovado ? 1 : 0, aprovado ? "Aprovado" : "Reprovado", id_requisicao]
      );
      await connection.commit();

      // 📧 Notificar solicitante sobre aprovação/reprovação
      try {
        const notificationService = new NotificationService();
        const baseUrl =
          process.env.APP_BASE_URL ||
          "https://smartcompras.francautolabs.com.br";
        const link = `${baseUrl}/combustivel-frota/solicitacoes?modal=detalhes&id=${id_requisicao}`;

        const [requisicao]: any = await connection.query(
          `SELECT 
            cr.id, cr.km_veiculo, cr.quantidade_litros, cr.tipo_combustivel, cr.tanque_cheio,
            cr.data_aprovacao,
            s.nome AS solicitante_nome, s.sobrenome AS solicitante_sobrenome, 
            s.email AS solicitante_email, s.telefone AS solicitante_telefone,
            a.nome AS aprovador_nome, a.sobrenome AS aprovador_sobrenome,
            v.placa, v.modelo
          FROM combustivel_request cr
          JOIN Funcionarios s ON cr.id_solicitante = s.id
          JOIN Funcionarios a ON cr.id_aprovador = a.id
          JOIN veiculos v ON cr.veiculo_id = v.id
          WHERE cr.id = ?`,
          [id_requisicao]
        );

        const dataAprovacao = requisicao[0]?.data_aprovacao
          ? moment(requisicao[0].data_aprovacao).format("DD/MM/YYYY HH:mm")
          : moment().format("DD/MM/YYYY HH:mm");

        const templateData = {
          id_requisicao: id_requisicao.toString(),
          solicitante: `${requisicao[0].solicitante_nome} ${requisicao[0].solicitante_sobrenome}`,
          veiculo: `${requisicao[0].modelo} - ${requisicao[0].placa}`,
          km_veiculo: requisicao[0].km_veiculo.toString(),
          quantidade_litros: requisicao[0].quantidade_litros.toString(),
          tipo_combustivel: requisicao[0].tipo_combustivel,
          tanque_cheio: requisicao[0].tanque_cheio ? "Sim" : "Não",
          aprovador_nome: `${requisicao[0].aprovador_nome} ${requisicao[0].aprovador_sobrenome}`,
          data_aprovacao: dataAprovacao,
          status: aprovado ? "✅ Aprovado" : "❌ Reprovado",
        };

        await notificationService.notify({
          recipients: [
            {
              name: `${requisicao[0].solicitante_nome} ${requisicao[0].solicitante_sobrenome}`,
              email: requisicao[0].solicitante_email,
              phone: requisicao[0].solicitante_telefone,
            },
          ],
          template: "RESPOSTA_SOLICITACAO",
          data: templateData,
          module: "COMBUSTIVEL_FROTA",
          link,
        });
      } catch (error) {
        console.error("Erro ao enviar notificações:", error);
      }
    } else {
      await connection.rollback();
      throw new Error(
        "A solicitação não foi liberada no BestDrive, peça ao controlador para liberar !"
      );
    }
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao aprovar requisição de frota:", error);
    throw error;
  } finally {
    connection.release();
  }
}


export async function analyzeCupomFrota(
  id_requisicao: number,
  imagePath: string
) {
  if (!id_requisicao || id_requisicao <= 0 || isNaN(id_requisicao)) {
    throw new Error("ID da requisição inválido");
  }

  try {
    const analise = await analyzeCupomImage(imagePath);

    console.log("Resultado bruto da IA:", analise);

    const parsed =
      analise?.resultado?.parsed || analise?.resultado || analise || {};

    const litros = Number(parsed.litros);
    const valor_por_litro = Number(parsed.valor_por_litro);
    const valor_total = Number(parsed.valor_total);

    if (isNaN(litros) || isNaN(valor_por_litro) || isNaN(valor_total)) {
      throw new Error(
        "Falha na análise do cupom: retorno incompleto ou inválido.\nRetorno obtido: " +
          JSON.stringify(parsed)
      );
    }

    console.log("Dados extraídos:", { litros, valor_por_litro, valor_total });

    return {
      success: true,
      dados: {
        litros,
        valor_por_litro,
        valor_total,
      },
    };
  } catch (error) {
    console.error("Erro ao analisar cupom fiscal:", error);
    throw error;
  }
}


export async function confirmCupomFrota(
  id_requisicao: number,
  litros: number,
  valor_por_litro: number,
  valor_total: number
) {
  const connection = await pool.getConnection();

  if (!id_requisicao || id_requisicao <= 0 || isNaN(id_requisicao)) {
    throw new Error("ID da requisição inválido");
  }

  if (isNaN(litros) || isNaN(valor_por_litro) || isNaN(valor_total)) {
    throw new Error("Dados do cupom inválidos");
  }

  if (litros <= 0 || valor_por_litro <= 0 || valor_total <= 0) {
    throw new Error("Os valores devem ser maiores que zero");
  }



  try {
    await connection.beginTransaction();

    const [updateResult]: any = await connection.query(
      `
        UPDATE combustivel_request
        SET
          litros_cupom = ?,
          valor_por_litro_cupom = ?,
          valor_total_cupom = ?,
          status = 'Finalizado'
        WHERE id = ?;
      `,
      [litros, valor_por_litro, valor_total, id_requisicao]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error("Requisição não encontrada");

    }
    const updateCupomBd = await modifyCUpomBD(id_requisicao)
    if(!updateCupomBd){
      await connection.rollback()
      throw new Error("Não foi possivel mudar status do cupom no BestDrive" + updateCupomBd)
    }

    await connection.commit();


    return {
      success: true,
      message: "Cupom confirmado com sucesso",
      dados: { litros, valor_por_litro, valor_total },
    };
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao confirmar cupom fiscal:", error);
    throw error;
  } finally {
    connection.release();
  }
}
