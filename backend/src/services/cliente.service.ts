import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import pool from "../config/db";
import {
  ICriarRequisicaoCliente,
  IClienteRequisicao,
  IClienteRequisicaoDetalhada,
  IRespostaRequisicaoCliente,
} from "../interfaces/cliente.interface";
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
        CONCAT(fs.nome, ' ', fs.sobrenome) LIKE ? OR
        cr.descricao LIKE ? OR
        cr.id LIKE ? OR
        cr.valor LIKE ?
      )`);
      const searchTerm = `%${filtros.search}%`;
      parametros.push(searchTerm, searchTerm, searchTerm, searchTerm);
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
      FROM cliente_request cr
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
        cr.descricao, 
        cr.valor,  
        cr.data_solicitacao,
        cr.data_aprovacao, 
        cr.id_solicitante,
        CONCAT(fs.nome, ' ', fs.sobrenome) AS nome_solicitante,
        cr.id_aprovador,
        CONCAT(fa.nome, ' ', fa.sobrenome) AS nome_aprovador,
        cr.status, 
        cr.impresso
      FROM cliente_request cr
      LEFT JOIN Funcionarios fs ON cr.id_solicitante = fs.id
      LEFT JOIN Funcionarios fa ON cr.id_aprovador = fa.id
      ${whereClause}
      ORDER BY cr.data_solicitacao DESC
      LIMIT ?
      OFFSET ?
    `;

    const queryParams = [...parametros, pageSize, offset];
    const [requisicoes] = await connection.query<IClienteRequisicao[]>(
      query,
      queryParams
    );

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
        cr.descricao LIKE ? OR
        cr.id LIKE ? OR
        cr.valor LIKE ?
      )`);
      const searchTerm = `%${filtros.search}%`;
      parametros.push(searchTerm, searchTerm, searchTerm, searchTerm);
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
      FROM cliente_request cr
      JOIN Funcionarios fs ON cr.id_solicitante = fs.id
      JOIN Funcionarios fa ON cr.id_aprovador = fa.id
      ${whereClause}
    `;

    const [totalResult] = await connection.query<any[]>(countQuery, parametros);
    const total = totalResult[0].total;

    // Query principal
    const query = `
      SELECT 
        cr.id,
        cr.descricao,
        cr.valor,
        cr.data_solicitacao,
        cr.id_solicitante,
        CONCAT(fs.nome, ' ', fs.sobrenome) AS nome_solicitante,
        cr.id_aprovador,
        CONCAT(fa.nome, ' ', fa.sobrenome) AS nome_aprovador,
        cr.data_aprovacao,
        cr.impresso,
        cr.status
      FROM cliente_request cr
      JOIN Funcionarios fs ON cr.id_solicitante = fs.id
      JOIN Funcionarios fa ON cr.id_aprovador = fa.id
      ${whereClause}
      ORDER BY cr.data_solicitacao DESC
      LIMIT ?
      OFFSET ?
    `;

    const queryParams = [...parametros, pageSize, offset];
    const [requisicoes] = await connection.query<IClienteRequisicao[]>(
      query,
      queryParams
    );

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
): Promise<IClienteRequisicaoDetalhada | null> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT 
        cr.id, 
        cr.descricao, 
        cr.valor, 
        cr.data_solicitacao, 
        cr.status, 
        cr.data_aprovacao, 
        cr.impresso, 
        cr.id_solicitante,
        CONCAT(s.nome, ' ', s.sobrenome) AS solicitante_nome,
        cr.id_aprovador,
        CONCAT(a.nome, ' ', a.sobrenome) AS aprovador_nome
      FROM cliente_request cr
      JOIN Funcionarios s ON cr.id_solicitante = s.id
      LEFT JOIN Funcionarios a ON cr.id_aprovador = a.id
      WHERE cr.id = ?
    `;
    const [requisicoes] = await connection.query<IClienteRequisicaoDetalhada[]>(
      query,
      [id]
    );
    return requisicoes.length > 0 ? requisicoes[0] : null;
  } catch (error) {
    console.error("Erro ao buscar requisição por ID:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function criarRequisicaoCliente(
  dados: ICriarRequisicaoCliente
): Promise<number> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Validar campos obrigatórios
    if (
      !dados.descricao ||
      !dados.valor ||
      !dados.id_aprovador ||
      !dados.id_solicitante
    ) {
      throw new AppError("Todos os campos são obrigatórios", 400);
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
      INSERT INTO cliente_request (descricao, valor, id_solicitante, id_aprovador) 
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await connection.query<ResultSetHeader>(queryRequisicao, [
      dados.descricao,
      dados.valor,
      dados.id_solicitante,
      dados.id_aprovador,
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
      const link = `${baseUrl}/clientes/solicitacoes?modal=detalhes&id=${requisicaoId}`;

      const formattedData = {
        id_requisicao: requisicaoId.toString(),
        solicitante: `${solicitante.nome} ${solicitante.sobrenome}`,
        data_solicitacao: moment(new Date()).format("DD/MM/YYYY"),
        descricao: dados.descricao,
        valor: `R$ ${dados.valor.toFixed(2)}`,
      };

      await notificationService
        .notify({
          solicitantes: [solicitante],
          aprovadores: [aprovador],
          template: "NEW_REQUEST",
          data: formattedData,
          link,
          module: "CLIENTES",
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
    console.error("Erro ao criar requisição de cliente:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function responderRequisicao(
  dados: IRespostaRequisicaoCliente
): Promise<{ message: string }> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id_requisicao, aprovado } = dados;

    const [existingRequisicao] = await connection.query<IClienteRequisicao[]>(
      `SELECT status, id_solicitante FROM cliente_request WHERE id = ?`,
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
      `UPDATE cliente_request SET status = ? WHERE id = ?`,
      [novoStatus, id_requisicao]
    );

    // Gerar hash apenas se for aprovação
    let hashRelationId: number | null = null;
    if (aprovado) {
      try {
        const hashResult = await createRequestRelation(
          {
            tabela: "cliente_request_id",
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
    const [requisicaoAtualizada] = await connection.query<IClienteRequisicao[]>(
      `SELECT data_aprovacao FROM cliente_request WHERE id = ?`,
      [id_requisicao]
    );

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
      const link = `${baseUrl}/clientes/solicitacoes`;

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
          module: "CLIENTES",
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
