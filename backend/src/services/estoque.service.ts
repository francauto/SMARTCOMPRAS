import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import pool from "../config/db";
import {
  ICriarRequisicaoEstoque,
  IEstoqueRequisicoes,
  IEstoqueRequisicoesDetalhada,
  IRespostaRequisicao,
} from "../interfaces/estoque.interface";
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

export async function getRequisicoes(
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

    const condicoes: string[] = ["r.id_solicitante = ?"];
    const parametros: any[] = [id_solicitante];

    // Filtro de pesquisa global
    if (filtros?.search) {
      condicoes.push(`(
        CONCAT(f.nome, ' ', f.sobrenome) LIKE ? OR
        r.fornecedor LIKE ? OR
        r.id LIKE ? OR
        i.descricao LIKE ?
      )`);
      const searchTerm = `%${filtros.search}%`;
      parametros.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filtro por data inicial
    if (filtros?.dataInicio) {
      condicoes.push("DATE(r.data_requisicao) >= ?");
      parametros.push(filtros.dataInicio);
    }

    // Filtro por status
    if (filtros?.status) {
      condicoes.push("r.status = ?");
      parametros.push(filtros.status);
    }

    const whereClause = `WHERE ${condicoes.join(" AND ")}`;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM requisicoes_estoque r
      JOIN Funcionarios f ON r.id_solicitante = f.id
      LEFT JOIN itens_estoque i ON r.id = i.id_requisicao
      ${whereClause}
    `;

    const [totalResult] = await connection.query<any[]>(countQuery, parametros);
    const total = totalResult[0].total;

    // Query principal
    const query = `
      SELECT 
        r.id, r.fornecedor, r.cliente_venda, 
        r.cod_cliente, r.valor_venda, r.id_aprovador, r.data_requisicao, 
        r.data_aprovacao, r.entrega_direta, r.valor_frete, 
        r.valor_custo_total, 
        r.status, r.impresso,
        CONCAT(f.nome, ' ', f.sobrenome) AS nome_solicitante,
        CONCAT(fa.nome, ' ', fa.sobrenome) AS nome_aprovador,
        GROUP_CONCAT(
          CONCAT(i.qtde, 'x ', i.descricao, ' - R$', i.valor_unitario) 
          SEPARATOR ', '
        ) AS descricao,
        COALESCE(r.valor_custo_total, 0) AS valor_custo
      FROM requisicoes_estoque r
      JOIN Funcionarios f ON r.id_solicitante = f.id
      JOIN Funcionarios fa ON r.id_aprovador = fa.id
      LEFT JOIN itens_estoque i ON r.id = i.id_requisicao
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.data_requisicao DESC
      LIMIT ?
      OFFSET ?
    `;

    const queryParams = [...parametros, pageSize, offset];
    const [requisicoes] = await connection.query<IEstoqueRequisicoes[]>(
      query,
      queryParams
    );

    // Buscar itens de cada requisição
    for (const requisicao of requisicoes) {
      const [itens] = await connection.query<any[]>(
        `SELECT id, descricao, valor_unitario, qtde 
         FROM itens_estoque 
         WHERE id_requisicao = ?`,
        [requisicao.id]
      );
      (requisicao as any).itens = itens;
    }

    return {
      data: requisicoes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      filtros,
    };
  } catch (error) {
    console.error("Erro ao buscar as requisições:", error);
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

    const condicoes: string[] = ["r.id_aprovador = ?"];
    const parametros: any[] = [id_aprovador];

    // Filtro de pesquisa global
    if (filtros?.search) {
      condicoes.push(`(
        CONCAT(f.nome, ' ', f.sobrenome) LIKE ? OR
        r.fornecedor LIKE ? OR
        r.id LIKE ? OR
        i.descricao LIKE ?
      )`);
      const searchTerm = `%${filtros.search}%`;
      parametros.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filtro por data inicial
    if (filtros?.dataInicio) {
      condicoes.push("DATE(r.data_requisicao) >= ?");
      parametros.push(filtros.dataInicio);
    }

    // Filtro por status
    if (filtros?.status) {
      condicoes.push("r.status = ?");
      parametros.push(filtros.status);
    }

    const whereClause = `WHERE ${condicoes.join(" AND ")}`;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM requisicoes_estoque r
      JOIN Funcionarios f ON r.id_solicitante = f.id
      LEFT JOIN itens_estoque i ON r.id = i.id_requisicao
      ${whereClause}
    `;

    const [totalResult] = await connection.query<any[]>(countQuery, parametros);
    const total = totalResult[0].total;

    // Query principal
    const query = `
      SELECT 
        r.id, r.fornecedor, r.cliente_venda, 
        r.cod_cliente, r.valor_venda, r.id_aprovador, r.data_aprovacao, 
        r.data_requisicao, r.status, r.entrega_direta, r.valor_frete, 
        r.valor_custo_total, r.impresso, r.id_solicitante,
        CONCAT(f.nome, ' ', f.sobrenome) AS nome_solicitante,
        CONCAT(fa.nome, ' ', fa.sobrenome) AS nome_aprovador,
        GROUP_CONCAT(
          CONCAT(i.qtde, 'x ', i.descricao, ' - R$', i.valor_unitario) 
          SEPARATOR ', '
        ) AS descricao,
        COALESCE(r.valor_custo_total, 0) AS valor_custo
      FROM requisicoes_estoque r
      JOIN Funcionarios f ON r.id_solicitante = f.id
      JOIN Funcionarios fa ON r.id_aprovador = fa.id
      LEFT JOIN itens_estoque i ON r.id = i.id_requisicao
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.data_requisicao DESC
      LIMIT ?
      OFFSET ?
    `;

    const queryParams = [...parametros, pageSize, offset];
    const [requisicoes] = await connection.query<IEstoqueRequisicoes[]>(
      query,
      queryParams
    );

    // Buscar itens de cada requisição
    for (const requisicao of requisicoes) {
      const [itens] = await connection.query<any[]>(
        `SELECT id, descricao, valor_unitario, qtde 
         FROM itens_estoque 
         WHERE id_requisicao = ?`,
        [requisicao.id]
      );
      (requisicao as any).itens = itens;
    }

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
): Promise<IEstoqueRequisicoesDetalhada | null> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT 
        r.id, r.fornecedor, r.cliente_venda, 
        r.cod_cliente, r.valor_venda, r.data_requisicao, 
        r.id_aprovador, r.id_solicitante, r.impresso,
        CONCAT(f1.nome, ' ', f1.sobrenome) AS nome_solicitante, 
        CONCAT(f2.nome, ' ', f2.sobrenome) AS nome_aprovador, 
        r.data_aprovacao, r.entrega_direta, r.valor_frete, 
        r.valor_custo_total, r.status,
        GROUP_CONCAT(
          CONCAT(i.qtde, 'x ', i.descricao, ' - R$', i.valor_unitario) 
          SEPARATOR ', '
        ) AS descricao,
        COALESCE(r.valor_custo_total, 0) AS valor_custo
      FROM requisicoes_estoque r
      LEFT JOIN Funcionarios f1 ON r.id_solicitante = f1.id
      LEFT JOIN Funcionarios f2 ON r.id_aprovador = f2.id
      LEFT JOIN itens_estoque i ON r.id = i.id_requisicao
      WHERE r.id = ?
      GROUP BY r.id
    `;
    const [requisicoes] = await connection.query<
      IEstoqueRequisicoesDetalhada[]
    >(query, [id]);

    if (requisicoes.length === 0) {
      return null;
    }

    const requisicao = requisicoes[0];

    // Buscar itens da requisição
    const [itens] = await connection.query<any[]>(
      `SELECT id, descricao, valor_unitario, qtde 
       FROM itens_estoque 
       WHERE id_requisicao = ?`,
      [id]
    );
    (requisicao as any).itens = itens;

    return requisicao;
  } catch (error) {
    console.error("Erro ao buscar requisição por ID:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function criarRequisicaoEstoque(
  dados: ICriarRequisicaoEstoque
): Promise<number> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const userIds = [dados.id_solicitante, dados.id_aprovador];
    const [usuarios] = await connection.query<IUser[]>(
      `SELECT id, nome, sobrenome, mail, aut_wpp, telefone FROM Funcionarios WHERE id IN (?)`,
      [userIds]
    );

    const usuariosMap = new Map(usuarios.map((user) => [user.id, user]));
    const solicitante = usuariosMap.get(dados.id_solicitante);
    const aprovador = usuariosMap.get(dados.id_aprovador);

    if (!solicitante || !aprovador) {
      throw new AppError("Solicitante ou aprovador não encontrado.", 404);
    }
    if (!solicitante.mail || !aprovador.mail) {
      throw new AppError(
        "Email do solicitante ou aprovador não cadastrado.",
        400
      );
    }

    const queryRequisicao = `
      INSERT INTO requisicoes_estoque 
      (fornecedor, cliente_venda, cod_cliente, valor_venda, id_aprovador, id_solicitante, entrega_direta, valor_frete, valor_custo_total) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valorCustoTotal =
      dados.Itens.reduce(
        (soma, item) => soma + item.valor_unitario * item.qtde,
        0
      ) + dados.valor_frete;

    const [result] = await connection.query<ResultSetHeader>(queryRequisicao, [
      dados.fornecedor,
      dados.cliente_venda,
      dados.cod_cliente,
      dados.valor_venda,
      dados.id_aprovador,
      dados.id_solicitante,
      dados.entrega_direta,
      dados.valor_frete,
      valorCustoTotal,
    ]);

    const requisicaoId = result.insertId;

    const queryInsertItens = `
      INSERT INTO itens_estoque (descricao, valor_unitario, qtde, id_requisicao)
      VALUES ?
    `;
    const mappingItens = dados.Itens.map((item) => [
      item.descricao,
      item.valor_unitario,
      item.qtde,
      requisicaoId,
    ]);

    const [resultInsertItens] = await connection.query<ResultSetHeader>(
      queryInsertItens,
      [mappingItens]
    );

    await connection.commit();

    try {
      const { NotificationService } = await import(
        "./notification/NotificationService"
      );

      const notificationService = new NotificationService();
      const baseUrl =
        process.env.APP_BASE_URL || "https://smartcompras.francautolabs.com.br";
      const link = `${baseUrl}/requisicoes/solicitacoes?modal=detalhes&id=${requisicaoId}`;

      const itensDescricao = dados.Itens.map(
        (item) => `${item.qtde}x ${item.descricao} (R$ ${item.valor_unitario})`
      ).join(", ");

      const formattedData = {
        id_requisicao: requisicaoId.toString(),
        solicitante: `${solicitante.nome} ${solicitante.sobrenome}`,
        data_solicitacao: moment(new Date()).format("DD/MM/YYYY"),
        produtos_solicitados: `${dados.fornecedor} - ${itensDescricao}`,
      };

      await notificationService
        .notify({
          solicitantes: [solicitante],
          aprovadores: [aprovador],
          template: "NEW_REQUEST",
          data: formattedData,
          link,
          module: "ESTOQUE",
        })
        .catch((error: any) => {
          console.error(
            `Requisição ${requisicaoId} criada, mas falhou ao enviar notificações:`,
            error
          );
        });
    } catch (notificationError) {
      console.error(
        `A requisição ${requisicaoId} foi criada, mas falhou ao enviar notificações.`,
        notificationError
      );
    }

    return requisicaoId;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Erro ao criar requisição de estoque:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function responderRequisicao(
  dados: IRespostaRequisicao
): Promise<{ message: string }> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id_requisicao, aprovado } = dados;

    const [existingRequisicao] = await connection.query<IEstoqueRequisicoes[]>(
      `SELECT status, id_solicitante FROM requisicoes_estoque WHERE id = ?`,
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
      `UPDATE requisicoes_estoque SET status = ? WHERE id = ?`,
      [novoStatus, id_requisicao]
    );

    let hashRelationId: number | null = null;
    if (aprovado) {
      try {
        const hashResult = await createRequestRelation(
          {
            tabela: "requisicoes_estoque_id",
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
      IEstoqueRequisicoes[]
    >(`SELECT data_aprovacao FROM requisicoes_estoque WHERE id = ?`, [
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

    try {
      const { NotificationService } = await import(
        "./notification/NotificationService"
      );
      const notificationService = new NotificationService();
      const baseUrl =
        process.env.APP_BASE_URL || "https://smartcompras.francautolabs.com.br";
      const link = `${baseUrl}/requisicoes/solicitacoes`;

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
          module: "ESTOQUE",
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
