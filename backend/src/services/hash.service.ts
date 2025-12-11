import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import pool from "../config/db";
import { Ihash } from "../interfaces/hash.interface";

const ALLOWED_COLUMNS: Ihash["tabela"][] = [
  "cliente_request_id",
  "combustivel_request_id",
  "combustivel_request_estoque_id",
  "requisicoes_id",
  "requisicoes_estoque_id",
];

export async function createRequestRelation(
  payload: Ihash,
  connection?: PoolConnection
): Promise<{ message: string; relationId: number }> {
  if (!ALLOWED_COLUMNS.includes(payload.tabela)) {
    throw new Error(
      `Operação inválida: A coluna '${payload.tabela}' não tem permissão para ser modificada por esta função.`
    );
  }

  const useExistingConnection = !!connection;
  let conn: PoolConnection | null = connection || null;

  try {
    if (!conn) {
      conn = await pool.getConnection();
      await conn.beginTransaction();
    }

    const sql = `INSERT INTO request_relations (\`${payload.tabela}\`) VALUES (?)`;
    const [result] = await conn.query<ResultSetHeader>(sql, [
      payload.id_requisicao,
    ]);

    if (!useExistingConnection && conn) {
      await conn.commit();
    }

    return {
      message: `Relação criada com sucesso para a coluna '${payload.tabela}'.`,
      relationId: result.insertId,
    };
  } catch (error) {
    if (!useExistingConnection && conn) {
      await conn.rollback();
    }
    console.error(
      `Erro ao criar relação para a coluna '${payload.tabela}':`,
      error
    );
    throw new Error("Falha ao armazenar a relação da requisição.");
  } finally {
    if (!useExistingConnection && conn) {
      conn.release();
    }
  }
}

/**
 * FUNÇÃO DE FALLBACK - Gera hash automaticamente se não existir
 * Verifica se a requisição está aprovada antes de criar o hash
 * Chamada automaticamente pelo pdf.service.ts quando hash não é encontrado
 */
export async function generateHashFallback(
  id_modulo: number,
  id_requisicao: number,
  connection?: PoolConnection
): Promise<string | null> {
  const useExistingConnection = !!connection;
  let conn: PoolConnection | null = connection || null;

  try {
    if (!conn) {
      conn = await pool.getConnection();
      await conn.beginTransaction();
    }

    // Mapeamento dos módulos para as colunas e tabelas
    const moduloMap: {
      [key: number]: {
        column: Ihash["tabela"];
        table: string;
        statusField: string;
      };
    } = {
      1: {
        column: "requisicoes_id",
        table: "requisicoes",
        statusField: "status",
      },
      2: {
        column: "combustivel_request_id",
        table: "combustivel_request",
        statusField: "status",
      },
      3: {
        column: "combustivel_request_estoque_id",
        table: "combustivel_request_estoque",
        statusField: "status",
      },
      4: {
        column: "requisicoes_estoque_id",
        table: "requisicoes_estoque",
        statusField: "status",
      },
      5: {
        column: "cliente_request_id",
        table: "cliente_request",
        statusField: "status",
      },
    };

    const moduleConfig = moduloMap[id_modulo];

    if (!moduleConfig) {
      console.error(
        `[HASH FALLBACK] Módulo ${id_modulo} não encontrado no mapeamento`
      );
      return null;
    }

    // 1. Verificar se a requisição existe e está aprovada
    const checkStatusQuery = `SELECT ${moduleConfig.statusField} FROM ${moduleConfig.table} WHERE id = ?`;
    const [statusRows]: any = await conn.query(checkStatusQuery, [
      id_requisicao,
    ]);

    if (statusRows.length === 0) {
      console.warn(
        `[HASH FALLBACK] Requisição ${id_requisicao} não encontrada na tabela ${moduleConfig.table}`
      );
      return null;
    }

    const status = statusRows[0][moduleConfig.statusField];
    const isApproved = status === "Aprovado" || status === "Aprovada";

    if (!isApproved) {
      console.warn(
        `[HASH FALLBACK] Requisição ${id_requisicao} não está aprovada (Status: ${status}). Hash não será gerado.`
      );
      return null;
    }

    // 2. Verificar se já existe hash (double-check)
    const checkHashQuery = `SELECT hash_code FROM request_relations WHERE ${moduleConfig.column} = ?`;
    const [hashRows]: any = await conn.query(checkHashQuery, [id_requisicao]);

    if (hashRows.length > 0 && hashRows[0].hash_code) {
      console.log(
        `[HASH FALLBACK] Hash já existe para requisição ${id_requisicao}. Retornando hash existente: ${hashRows[0].hash_code}`
      );
      return hashRows[0].hash_code;
    }

    // 3. Criar novo registro com hash
    console.log(
      `[HASH FALLBACK] Gerando hash automaticamente - Módulo: ${id_modulo}, Requisição: ${id_requisicao}, Status: ${status}`
    );

    const insertQuery = `INSERT INTO request_relations (\`${moduleConfig.column}\`) VALUES (?)`;
    const [result] = await conn.query<ResultSetHeader>(insertQuery, [
      id_requisicao,
    ]);

    // 4. Buscar o hash gerado (trigger do banco gera o hash_code automaticamente)
    const getHashQuery = `SELECT hash_code FROM request_relations WHERE id = ?`;
    const [newHashRows]: any = await conn.query(getHashQuery, [
      result.insertId,
    ]);

    if (!useExistingConnection && conn) {
      await conn.commit();
    }

    if (newHashRows.length > 0 && newHashRows[0].hash_code) {
      console.log(
        `[HASH FALLBACK] Hash gerado com sucesso! Requisição: ${id_requisicao}, Hash: ${newHashRows[0].hash_code}`
      );
      return newHashRows[0].hash_code;
    }

    console.error(
      `[HASH FALLBACK] Falha ao gerar hash para requisição ${id_requisicao}`
    );
    return null;
  } catch (error) {
    if (!useExistingConnection && conn) {
      await conn.rollback();
    }
    console.error(`[HASH FALLBACK] Erro ao gerar hash de fallback:`, error);
    return null;
  } finally {
    if (!useExistingConnection && conn) {
      conn.release();
    }
  }
}
