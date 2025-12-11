import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import pool from "../config/db";
import {
  ICriarRequisicaoCombustivelEstoque,
  ICombustivelEstoqueRequisicao,
  ICombustivelEstoqueRequisicaoDetalhada,
  IRespostaRequisicaoCombustivelEstoque,
} from "../interfaces/combustivel-estoque.interface";
import { IUser } from "../interfaces/auth.interface";
import moment from "moment";
import { createRequestRelation } from "./hash.service";

class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function getRequisicoesPorSolicitante(
  id_solicitante: number,
  page: number = 1,
  pageSize: number = 20,
  filtros?: {
    search?: string;
    dataInicio?: string;
    status?: string;
  }
) {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    const offset = (page - 1) * pageSize;

    const condicoes: string[] = ["cr.id_solicitante = ?"];
    const parametros: any[] = [id_solicitante];

    // Filtro de pesquisa global
    if (filtros?.search) {
      condicoes.push(`(
        CONCAT(f.nome, ' ', f.sobrenome) LIKE ? OR
        cr.chassi LIKE ? OR
        cr.modelo LIKE ? OR
        cr.marca LIKE ? OR
        cr.placa LIKE ? OR
        cr.tipo_combustivel LIKE ? OR
        cr.id LIKE ? OR
        d.nome LIKE ?
      )`);
      const searchTerm = `%${filtros.search}%`;
      parametros.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm
      );
    }

    // Filtro por data inicial
    if (filtros?.dataInicio) {
      condicoes.push("DATE(cr.data_solicitacao) >= ?");
      parametros.push(filtros.dataInicio);
    }

    // Filtro por status
    if (filtros?.status) {
      condicoes.push("cr.status = ?");
      parametros.push(filtros.status);
    }

    const whereClause = `WHERE ${condicoes.join(" AND ")}`;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM combustivel_request_estoque cr
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      LEFT JOIN Funcionarios f ON cr.id_solicitante = f.id
      ${whereClause}
    `;

    const [totalResult] = await connection.query<any[]>(countQuery, parametros);
    const total = totalResult[0].total;

    // Query principal
    const query = `
      SELECT  
        cr.id,
        cr.chassi,
        cr.modelo,
        cr.marca,
        cr.placa,
        cr.quantidade_litros,
        cr.tipo_combustivel,
        cr.data_solicitacao,
        cr.data_aprovacao,
        cr.id_solicitante,
        CONCAT(f.nome, ' ', f.sobrenome) AS nome_solicitante,
        cr.id_aprovador,
        CONCAT(fa.nome, ' ', fa.sobrenome) AS nome_aprovador,
        cr.status,
        cr.impresso,
        cr.id_departamento,
        d.nome AS departamento_nome
      FROM combustivel_request_estoque cr
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      LEFT JOIN Funcionarios f ON cr.id_solicitante = f.id
      LEFT JOIN Funcionarios fa ON cr.id_aprovador = fa.id
      ${whereClause}
      ORDER BY cr.data_solicitacao DESC
      LIMIT ?
      OFFSET ?
    `;

    const queryParams = [...parametros, pageSize, offset];
    const [requisicoes] = await connection.query<
      ICombustivelEstoqueRequisicao[]
    >(query, queryParams);

    return {
      data: requisicoes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      filtros,
    };
  } catch (error) {
    console.error("Erro ao buscar requisições do solicitante:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function getRequisicoesPorAprovador(
  id_aprovador: number,
  page: number = 1,
  pageSize: number = 20,
  filtros?: {
    search?: string;
    dataInicio?: string;
    status?: string;
  }
) {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    const offset = (page - 1) * pageSize;

    const condicoes: string[] = ["cr.id_aprovador = ?"];
    const parametros: any[] = [id_aprovador];

    // Filtro de pesquisa global
    if (filtros?.search) {
      condicoes.push(`(
        CONCAT(fs.nome, ' ', fs.sobrenome) LIKE ? OR
        cr.chassi LIKE ? OR
        cr.modelo LIKE ? OR
        cr.marca LIKE ? OR
        cr.placa LIKE ? OR
        cr.tipo_combustivel LIKE ? OR
        cr.id LIKE ? OR
        d.nome LIKE ?
      )`);
      const searchTerm = `%${filtros.search}%`;
      parametros.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm
      );
    }

    // Filtro por data inicial
    if (filtros?.dataInicio) {
      condicoes.push("DATE(cr.data_solicitacao) >= ?");
      parametros.push(filtros.dataInicio);
    }

    // Filtro por status
    if (filtros?.status) {
      condicoes.push("cr.status = ?");
      parametros.push(filtros.status);
    }

    const whereClause = `WHERE ${condicoes.join(" AND ")}`;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM combustivel_request_estoque cr
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      LEFT JOIN Funcionarios fs ON cr.id_solicitante = fs.id
      LEFT JOIN Funcionarios fa ON cr.id_aprovador = fa.id
      ${whereClause}
    `;

    const [totalResult] = await connection.query<any[]>(countQuery, parametros);
    const total = totalResult[0].total;

    // Query principal
    const query = `
      SELECT 
        cr.id, 
        cr.chassi, 
        cr.modelo, 
        cr.marca,
        cr.placa,
        cr.tipo_combustivel,
        cr.quantidade_litros, 
        cr.data_solicitacao, 
        cr.data_aprovacao, 
        cr.id_solicitante, 
        CONCAT(fs.nome, ' ', fs.sobrenome) AS nome_solicitante,
        cr.id_aprovador,
        CONCAT(fa.nome, ' ', fa.sobrenome) AS nome_aprovador,
        cr.status, 
        cr.impresso,
        cr.id_departamento,
        d.nome AS departamento_nome
      FROM combustivel_request_estoque cr
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      LEFT JOIN Funcionarios fs ON cr.id_solicitante = fs.id
      LEFT JOIN Funcionarios fa ON cr.id_aprovador = fa.id
      ${whereClause}
      ORDER BY cr.data_solicitacao DESC
      LIMIT ?
      OFFSET ?
    `;

    const queryParams = [...parametros, pageSize, offset];
    const [requisicoes] = await connection.query<
      ICombustivelEstoqueRequisicao[]
    >(query, queryParams);

    return {
      data: requisicoes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      filtros,
    };
  } catch (error) {
    console.error("Erro ao buscar requisições do aprovador:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function getRequisicaoPorId(
  id: number
): Promise<ICombustivelEstoqueRequisicaoDetalhada | null> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT  
        cr.id,
        cr.chassi,
        cr.modelo,
        cr.placa,
        cr.marca,
        cr.quantidade_litros,
        cr.tipo_combustivel,
        cr.data_solicitacao,
        cr.data_aprovacao,
        cr.id_solicitante,
        CONCAT(fs.nome, ' ', fs.sobrenome) AS solicitante_nome,
        cr.id_aprovador,
        CONCAT(fa.nome, ' ', fa.sobrenome) AS aprovador_nome,
        cr.status,
        cr.impresso,
        cr.id_departamento,
        d.nome AS departamento_nome
      FROM combustivel_request_estoque cr
      LEFT JOIN Departamentos d ON cr.id_departamento = d.id
      LEFT JOIN Funcionarios fs ON cr.id_solicitante = fs.id
      LEFT JOIN Funcionarios fa ON cr.id_aprovador = fa.id
      WHERE cr.id = ?
    `;
    const [requisicoes] = await connection.query<
      ICombustivelEstoqueRequisicaoDetalhada[]
    >(query, [id]);
    return requisicoes.length > 0 ? requisicoes[0] : null;
  } catch (error) {
    console.error("Erro ao buscar requisição por ID:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function criarRequisicaoCombustivelEstoque(
  dados: ICriarRequisicaoCombustivelEstoque
): Promise<number> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Validar campos obrigatórios
    if (
      !dados.modelo ||
      !dados.marca ||
      !dados.quantidade_litros ||
      !dados.id_aprovador ||
      !dados.id_solicitante
    ) {
      throw new AppError(
        "Campos obrigatórios: modelo, marca, quantidade_litros, id_aprovador",
        400
      );
    }

    // Validar que pelo menos chassi ou placa foi fornecido
    if (!dados.chassi && !dados.placa) {
      throw new AppError(
        "É necessário fornecer pelo menos chassi ou placa",
        400
      );
    }

    // Buscar dados dos usuários em uma única query
    const userIds = [dados.id_solicitante, dados.id_aprovador];
    const [usuarios] = await connection.query<IUser[]>(
      `SELECT id, nome, sobrenome, mail, aut_wpp, telefone FROM Funcionarios WHERE id IN (?)`,
      [userIds]
    );

    const usuariosMap = new Map(usuarios.map((user) => [user.id, user]));
    const solicitante = usuariosMap.get(dados.id_solicitante);
    const aprovador = usuariosMap.get(dados.id_aprovador);

    if (!solicitante || !aprovador) {
      throw new AppError("Solicitante ou aprovador não encontrado", 404);
    }
    if (!solicitante.mail || !aprovador.mail) {
      throw new AppError(
        "Email do solicitante ou aprovador não cadastrado",
        400
      );
    }

    // Inserir requisição
    const queryRequisicao = `
      INSERT INTO combustivel_request_estoque 
      (chassi, placa, modelo, marca, quantidade_litros, tipo_combustivel, id_solicitante, id_aprovador, id_departamento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.query<ResultSetHeader>(queryRequisicao, [
      dados.chassi || null,
      dados.placa || null,
      dados.modelo,
      dados.marca,
      dados.quantidade_litros,
      dados.tipo_combustivel || null,
      dados.id_solicitante,
      dados.id_aprovador,
      dados.id_departamento || null,
    ]);

    const requisicaoId = result.insertId;
    await connection.commit();

    // Enviar notificações (fora da transação)
    try {
      const { NotificationService } = await import(
        "./notification/NotificationService"
      );

      const notificationService = new NotificationService();
      const baseUrl =
        process.env.APP_BASE_URL || "https://smartcompras.francautolabs.com.br";
      const link = `${baseUrl}/combustivel-estoque/solicitacoes?modal=detalhes&id=${requisicaoId}`;

      const identificacao = dados.chassi
        ? `Chassi: ${dados.chassi}`
        : `Placa: ${dados.placa}`;

      const formattedData = {
        id_requisicao: requisicaoId.toString(),
        solicitante: `${solicitante.nome} ${solicitante.sobrenome}`,
        data_solicitacao: moment(new Date()).format("DD/MM/YYYY"),
        veiculo: `${dados.marca} ${dados.modelo} (${identificacao})`,
        quantidade: `${dados.quantidade_litros} litros`,
        tipo_combustivel: dados.tipo_combustivel || "Não especificado",
      };

      await notificationService
        .notify({
          solicitantes: [solicitante],
          aprovadores: [aprovador],
          template: "NEW_REQUEST",
          data: formattedData,
          link,
          module: "COMBUSTIVEL_ESTOQUE",
        })
        .catch((error: any) => {
          console.error(
            `Requisição ${requisicaoId} criada, mas falhou ao enviar notificações:`,
            error
          );
        });
    } catch (notificationError) {
      console.error(
        `Requisição ${requisicaoId} criada, mas falhou ao enviar notificações:`,
        notificationError
      );
    }

    return requisicaoId;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Erro ao criar requisição de combustível estoque:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function responderRequisicao(
  dados: IRespostaRequisicaoCombustivelEstoque
): Promise<{ message: string }> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id_requisicao, aprovado } = dados;

    const [existingRequisicao] = await connection.query<
      ICombustivelEstoqueRequisicao[]
    >(
      `SELECT status, id_solicitante FROM combustivel_request_estoque WHERE id = ?`,
      [id_requisicao]
    );

    if (existingRequisicao.length === 0) {
      throw new AppError("Solicitação não encontrada", 404);
    }

    if (existingRequisicao[0].status !== "Pendente") {
      throw new AppError("A solicitação já foi processada", 400);
    }

    const novoStatus = aprovado ? "Aprovado" : "Reprovado";

    await connection.query(
      `UPDATE combustivel_request_estoque SET status = ?, aprovado = ? WHERE id = ?`,
      [novoStatus, aprovado ? 1 : 0, id_requisicao]
    );

    // Gerar hash apenas se for aprovação
    let hashRelationId: number | null = null;
    if (aprovado) {
      try {
        const hashResult = await createRequestRelation(
          {
            tabela: "combustivel_request_estoque_id",
            id_requisicao,
          },
          connection
        );
        hashRelationId = hashResult.relationId;
      } catch (hashError: any) {
        await connection.rollback();
        throw new AppError(
          `Erro ao gerar hash da requisição: ${
            hashError.message || "Falha ao criar relação de hash"
          }`,
          500
        );
      }
    }

    // Buscar a data_aprovacao que foi inserida automaticamente pelo banco
    const [requisicaoAtualizada] = await connection.query<
      ICombustivelEstoqueRequisicao[]
    >(`SELECT data_aprovacao FROM combustivel_request_estoque WHERE id = ?`, [
      id_requisicao,
    ]);

    const [solicitanteData] = await connection.query<IUser[]>(
      `SELECT id, mail, telefone, aut_wpp, nome, sobrenome FROM Funcionarios WHERE id = ?`,
      [existingRequisicao[0].id_solicitante]
    );

    if (solicitanteData.length === 0 || !solicitanteData[0].mail) {
      throw new AppError(
        "Solicitante não encontrado ou sem email cadastrado",
        404
      );
    }

    const solicitante = solicitanteData[0];

    await connection.commit();

    // Enviar notificações (fora da transação)
    try {
      const { NotificationService } = await import(
        "./notification/NotificationService"
      );
      const notificationService = new NotificationService();
      const baseUrl =
        process.env.APP_BASE_URL || "https://smartcompras.francautolabs.com.br";
      const link = `${baseUrl}/combustivel-estoque/solicitacoes`;

      const dataAprovacao = requisicaoAtualizada[0]?.data_aprovacao
        ? moment(requisicaoAtualizada[0].data_aprovacao).format(
            "DD/MM/YYYY HH:mm"
          )
        : moment().format("DD/MM/YYYY HH:mm");

      const templateData = {
        id_requisicao: id_requisicao.toString(),
        data_aprovacao: dataAprovacao,
      };

      const templateKey = aprovado ? "APROVACAO" : "REPROVACAO";

      await notificationService
        .notify({
          recipients: [solicitante],
          template: templateKey,
          data: templateData,
          link,
          module: "COMBUSTIVEL_ESTOQUE",
        })
        .catch((error: any) => {
          console.error(
            `Requisição ${id_requisicao} processada, mas falhou ao enviar notificações:`,
            error
          );
        });
    } catch (notificationError) {
      console.error(
        `Requisição ${id_requisicao} processada, mas falhou ao enviar notificações:`,
        notificationError
      );
    }

    return {
      message: `Solicitação ${aprovado ? "aprovada" : "reprovada"} com sucesso`,
    };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Erro ao processar resposta da requisição:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
