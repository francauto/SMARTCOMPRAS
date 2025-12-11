import { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "../config/db";
import {
  IDespesas,
  IDepartamentos,
  IFornecedores,
  IItens,
  IFornecedoresItens,
  ICota,
  GerenteDepartamentoRow,
  relacionarGerentes,
} from "../interfaces/despesas.interface";
import { NotificationService } from "./notification/NotificationService";
import { createRequestRelation } from "./hash.service";
import { Ihash } from "../interfaces/hash.interface";

export class DespesasService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }
  private async createFornecedor(
    fornecedorNome: string,
    connection: PoolConnection
  ): Promise<number> {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida.");
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM fornecedores WHERE BINARY nome_fornecedor = ?",
      [fornecedorNome]
    );

    if (rows.length > 0) {
      return (rows[0] as { id: number }).id;
    } else {
      const insertQuery = `INSERT INTO fornecedores (nome_fornecedor) VALUES (?)`;
      const [result] = await connection.query<ResultSetHeader>(insertQuery, [
        fornecedorNome,
      ]);
      return result.insertId;
    }
  }

  private async getGerentes(
    departamentos: number[],
    connection: PoolConnection
  ): Promise<number[]> {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }

    if (departamentos.length === 0) {
      return [];
    }

    try {
      const placeholders = departamentos.map(() => "?").join(", ");
      const [rows] = await connection.query<GerenteDepartamentoRow[]>(
        `SELECT id_gerente, id_departamento FROM ger_dep WHERE id_departamento IN (${placeholders})`,
        departamentos
      );

      const encontrados = new Set<number>();
      const gerentesEncontrados: number[] = [];

      for (const row of rows) {
        if (!encontrados.has(row.id_departamento)) {
          gerentesEncontrados.push(row.id_gerente);
          encontrados.add(row.id_departamento);
        }
      }

      if (encontrados.size !== departamentos.length) {
        const departamentosSemGerente = departamentos.filter(
          (depId) => !encontrados.has(depId)
        );
        throw new Error(
          `Nenhum gerente atribuído para os departamentos: ${departamentosSemGerente.join(
            ", "
          )}`
        );
      }

      return gerentesEncontrados;
    } catch (error: any) {
      console.error("Erro ao buscar gerentes:", error.message);
      throw error;
    }
  }
  private async relacaoGerentesRequisicoes(
    payload: relacionarGerentes,
    connection: PoolConnection
  ) {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }

    if (!payload.gerentes?.length) {
      throw new Error("Nenhum gerente fornecido para relacionar");
    }

    if (!payload.id_requisicao) {
      throw new Error("ID da requisição não fornecido");
    }
    const values = payload.gerentes.map((gerente) => [
      payload.id_requisicao,
      gerente,
    ]);

    await connection.query(
      `
    INSERT IGNORE INTO requisicoes_gerente (id_requisicao, id_gerente)
    VALUES ?
  `,
      [values]
    );
  }

  private async createItem(
    payload: IItens,
    connection: PoolConnection,
    id_requisicao: number
  ) {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }
    const insertQuery = `INSERT INTO itens (descricao_item, qtde, valor_unitario, id_requisicao) VALUES (?, ?, ?, ?)`;
    const [result] = await connection.query<ResultSetHeader>(insertQuery, [
      payload.descricao_item,
      payload.qtde,
      payload.valor_unitario,
      id_requisicao,
    ]);
    return result.insertId;
  }

  private async relacaoFornecedoresItens(
    payload: IFornecedoresItens,
    connection: PoolConnection
  ) {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }
    const insertQuery = `    
        INSERT INTO fornecedores_itens (id_fornecedor, id_item, valor_unitario, quantidade, id_cota)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE valor_unitario = VALUES(valor_unitario), quantidade = VALUES(quantidade), id_cota = VALUES(id_cota)`;
    const [result] = await connection.query<ResultSetHeader>(insertQuery, [
      payload.id_fornecedor,
      payload.id_item,
      payload.valor_unitario,
      payload.quantidade,
      payload.id_cota || null,
    ]);
  }

  private async createCota(
    payload: ICota,
    connection: PoolConnection
  ): Promise<number> {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }
    const insertQuery = `INSERT INTO cotas (id_requisicao, id_fornecedor, valor_total)
         VALUES (?, ?, ?)`;
    const [result] = await connection.query<ResultSetHeader>(insertQuery, [
      payload.id_requisicao,
      payload.id_fornecedor,
      payload.valor_total,
    ]);
    return result.insertId;
  }

  private async rateio(
    departamentos: IDepartamentos[],
    id_requisicao: number,
    connection: PoolConnection
  ) {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }
    const mappingRateio = departamentos.map((dep) => [
      id_requisicao,
      dep.id_departamento,
      dep.percentual_rateio,
    ]);
    await connection.query(
      "INSERT INTO requisicoes_departamentos (id_requisicao, id_departamento, percent) VALUES ?",
      [mappingRateio]
    );
  }

  private async buscarNomeSolicitante(
    id_solicitante: number,
    connection: PoolConnection
  ): Promise<string> {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT nome FROM Funcionarios WHERE id = ?",
      [id_solicitante]
    );
    return rows[0]?.nome || "Nome não encontrado";
  }

  private async buscarNomesDepartamentos(
    id_requisicao: number,
    connection: PoolConnection
  ): Promise<string[]> {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT d.nome 
       FROM Departamentos d 
       INNER JOIN requisicoes_departamentos rd ON d.id = rd.id_departamento 
       WHERE rd.id_requisicao = ?`,
      [id_requisicao]
    );
    return rows.map((row) => row.nome);
  }

  private async buscarAprovadores(
    id_gerentes: number[],
    id_diretor: number,
    connection: PoolConnection
  ): Promise<RowDataPacket[]> {
    if (!connection) {
      throw new Error("Conexão com o banco de dados não fornecida");
    }

    const aprovadores: RowDataPacket[] = [];

    if (id_gerentes.length > 0) {
      const placeholders = id_gerentes.map(() => "?").join(", ");
      const [gerentes] = await connection.query<RowDataPacket[]>(
        `SELECT id, nome, mail, aut_wpp, telefone 
         FROM Funcionarios 
         WHERE id IN (${placeholders})`,
        id_gerentes
      );
      aprovadores.push(...gerentes);
    }

    const [diretor] = await connection.query<RowDataPacket[]>(
      `SELECT id, nome, mail, aut_wpp, telefone 
       FROM Funcionarios 
       WHERE id = ?`,
      [id_diretor]
    );

    if (diretor.length > 0) {
      aprovadores.push(diretor[0]);
    }

    return aprovadores.filter((aprovador) => aprovador.mail);
  }

  private async enviarNotificacoes(
    aprovadores: RowDataPacket[],
    dados: {
      descricao: string;
      nomeSolicitante: string;
      departamentosNomes: string[];
      fornecedores: IFornecedores[];
      id_requisicao: number;
    }
  ): Promise<void> {
    const {
      descricao,
      nomeSolicitante,
      departamentosNomes,
      fornecedores,
      id_requisicao,
    } = dados;

    const dataAtual = new Date();
    const dataSolicitacao = dataAtual.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const fornecedoresHTML = fornecedores
      .map((fornecedor, index) => {
        const total = fornecedor.itens.reduce(
          (acc, item) => acc + item.valor_unitario * item.qtde,
          0
        );

        const itensHTML = fornecedor.itens
          .map(
            (item) => `
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 8px 12px; color: #666;">• ${
              item.descricao_item
            }</td>
            <td style="padding: 8px 12px; text-align: center; color: #333;">${
              item.qtde
            }</td>
            <td style="padding: 8px 12px; text-align: right; color: #333;">R$ ${item.valor_unitario.toFixed(
              2
            )}</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #2196F3;">R$ ${(
              item.qtde * item.valor_unitario
            ).toFixed(2)}</td>
          </tr>
        `
          )
          .join("");

        return `
        <div style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f5f5f5; padding: 12px 16px; border-bottom: 2px solid #2196F3;">
            <strong style="color: #333; font-size: 16px;">🏢 ${
              fornecedor.nome
            }</strong>
          </div>
          <table style="width: 100%; border-collapse: collapse; background-color: #fff;">
            <thead>
              <tr style="background-color: #fafafa; border-bottom: 2px solid #e0e0e0;">
                <th style="padding: 10px 12px; text-align: left; color: #666; font-weight: 600; font-size: 13px;">Item</th>
                <th style="padding: 10px 12px; text-align: center; color: #666; font-weight: 600; font-size: 13px;">Qtde</th>
                <th style="padding: 10px 12px; text-align: right; color: #666; font-weight: 600; font-size: 13px;">Valor Unit.</th>
                <th style="padding: 10px 12px; text-align: right; color: #666; font-weight: 600; font-size: 13px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itensHTML}
            </tbody>
            <tfoot>
              <tr style="background-color: #e3f2fd; border-top: 2px solid #2196F3;">
                <td colspan="3" style="padding: 12px 16px; text-align: right; font-weight: 600; color: #1565C0; font-size: 15px;">
                  💰 Total do Fornecedor:
                </td>
                <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #2196F3; font-size: 16px;">
                  R$ ${total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
      })
      .join("");

    try {
      await this.notificationService.notify({
        recipients: aprovadores,
        template: "NEW_REQUEST_APROVADOR",
        data: {
          id_requisicao: id_requisicao.toString(),
          descricao,
          solicitante: nomeSolicitante,
          data_solicitacao: dataSolicitacao,
          departamentos: departamentosNomes.join(", "),
          fornecedores: fornecedoresHTML,
        },
        module: "DESPESAS",
        link: `https://smartcompras.francautolabs.com.br/despesas/solicitacoes?modal=detalhes&id=${id_requisicao}`,
      });
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
    }
  }

  public async getRequisicoes(
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
          r.descricao LIKE ? OR
          r.id LIKE ? OR
          d.nome LIKE ?
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
        SELECT COUNT(r.id) as total 
        FROM requisicoes r
        LEFT JOIN Departamentos d ON r.dep = d.id
        LEFT JOIN Funcionarios f ON r.id_solicitante = f.id
        ${whereClause}
      `;
      const [totalResult] = await connection.query<RowDataPacket[]>(
        countQuery,
        parametros
      );
      const total = totalResult[0].total;

      // Query principal
      const query = `
        SELECT
          r.id,
          r.data_requisicao,
          r.id_solicitante,
          r.aprovado_diretor,
          r.id_aprovador_diretor,
          r.data_aprovacao_diretor,
          r.impresso,
          r.status,
          r.descricao,
          r.rateada,
          r.data_recusa,
          CONCAT(f.nome, ' ', f.sobrenome) AS solicitante,
          COALESCE(r.data_aprovacao_diretor, r.data_recusa) AS data_resposta,
          COALESCE(d.nome, 'Sem Departamento') AS departamento
        FROM requisicoes r
        LEFT JOIN Departamentos d ON r.dep = d.id
        LEFT JOIN Funcionarios f ON r.id_solicitante = f.id
        ${whereClause}
        ORDER BY r.data_requisicao DESC
        LIMIT ?
        OFFSET ?
      `;

      const queryParams = [...parametros, pageSize, offset];
      const [requisicoes] = await connection.query<RowDataPacket[]>(
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
      console.error("Erro ao buscar requisições:", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  public async getRequisicoesPorAprovador(
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

      const condicoes: string[] = [
        "(rg.id_gerente = ? OR r.id_aprovador_diretor = ?)",
      ];
      const parametros: any[] = [id_aprovador, id_aprovador];

      // Filtro de pesquisa global
      if (filtros?.search) {
        condicoes.push(`(
          CONCAT(solicitante.nome, ' ', solicitante.sobrenome) LIKE ? OR
          r.descricao LIKE ? OR
          r.id LIKE ? OR
          d.nome LIKE ?
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
        FROM requisicoes r
        LEFT JOIN requisicoes_gerente rg ON r.id = rg.id_requisicao
        LEFT JOIN Funcionarios solicitante ON r.id_solicitante = solicitante.id
        LEFT JOIN requisicoes_departamentos rd ON r.id = rd.id_requisicao
        LEFT JOIN Departamentos d ON rd.id_departamento = d.id
        ${whereClause}
      `;

      const [totalResult] = await connection.query<RowDataPacket[]>(
        countQuery,
        parametros
      );
      const total = totalResult[0].total;

      // Query principal
      const query = `
        SELECT 
          r.id AS id_requisicao,
          r.data_requisicao,
          r.id_solicitante,
          r.descricao,
          r.status,
          r.impresso,
          r.data_recusa,
          r.data_aprovacao_diretor,
          COALESCE(r.data_aprovacao_diretor, r.data_recusa) AS data_resposta,
          COALESCE(CONCAT(solicitante.nome, ' ', solicitante.sobrenome), 'Desconhecido') AS nome_solicitante,
          
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id_requisicao_gerente', rg_inner.id,
                'id_gerente', rg_inner.id_gerente,
                'aprovado', COALESCE(ag.aprovado, false)
              )
            )
            FROM requisicoes_gerente rg_inner
            LEFT JOIN aprovacao_gerente ag ON rg_inner.id_requisicao = ag.id_requisicao 
                                           AND rg_inner.id_gerente = ag.id_gerente
            WHERE rg_inner.id_requisicao = r.id
          ) AS gerentes,

          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', d.id,
                'nome', d.nome,
                'valor_gasto', rd.valor_gasto
              )
            )
            FROM requisicoes_departamentos rd
            LEFT JOIN Departamentos d ON rd.id_departamento = d.id
            WHERE rd.id_requisicao = r.id
          ) AS departamentos

        FROM requisicoes r
        LEFT JOIN requisicoes_gerente rg ON r.id = rg.id_requisicao
        LEFT JOIN Funcionarios solicitante ON r.id_solicitante = solicitante.id
        LEFT JOIN requisicoes_departamentos rd ON r.id = rd.id_requisicao
        LEFT JOIN Departamentos d ON rd.id_departamento = d.id
        ${whereClause}
        GROUP BY r.id, r.data_requisicao, r.id_solicitante, r.descricao, r.status, 
                 r.impresso, r.data_aprovacao_diretor, r.data_recusa, 
                 solicitante.nome, solicitante.sobrenome
        ORDER BY r.data_requisicao DESC
        LIMIT ?
        OFFSET ?
      `;

      const queryParams = [...parametros, pageSize, offset];
      const [requisicoesRaw] = await connection.query<RowDataPacket[]>(
        query,
        queryParams
      );

      const requisicoes = requisicoesRaw.map((solicitacao) => ({
        ...solicitacao,
        gerentes:
          solicitacao.gerentes && typeof solicitacao.gerentes === "string"
            ? JSON.parse(solicitacao.gerentes)
            : solicitacao.gerentes || [],
        departamentos:
          solicitacao.departamentos &&
          typeof solicitacao.departamentos === "string"
            ? JSON.parse(solicitacao.departamentos)
            : solicitacao.departamentos || [],
      }));

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

  public async getRequisicaoPorId(id_requisicao: number) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();

      const queryRequisicao = `
        SELECT 
          r.id,
          r.data_requisicao,
          r.descricao,
          r.aprovado_diretor,
          r.data_recusa,
          r.status,
          r.id_solicitante,
          r.rateada,
          r.impresso,
          COALESCE(CONCAT(recusador.nome, ' ', recusador.sobrenome), null) AS usuario_recusador,
          r.data_aprovacao_diretor,
          COALESCE(CONCAT(solicitante.nome, ' ', solicitante.sobrenome), 'Desconhecido') AS nome_solicitante,
          COALESCE(CONCAT(gerente.nome, ' ', gerente.sobrenome), 'Desconhecido') AS nome_aprovador_gerente,
          COALESCE(CONCAT(diretor.nome, ' ', diretor.sobrenome), 'Desconhecido') AS nome_aprovador_diretor
        FROM requisicoes r
        LEFT JOIN Funcionarios solicitante ON r.id_solicitante = solicitante.id
        LEFT JOIN Funcionarios gerente ON r.id_aprovador_gerente = gerente.id
        LEFT JOIN Funcionarios diretor ON r.id_aprovador_diretor = diretor.id
        LEFT JOIN Funcionarios recusador ON r.usuario_recusador = recusador.id
        WHERE r.id = ?
      `;

      const [requisicoes] = await connection.query<RowDataPacket[]>(
        queryRequisicao,
        [id_requisicao]
      );

      if (requisicoes.length === 0) {
        return null;
      }

      const requisicao = requisicoes[0];

      const queryDepartamentos = `
        SELECT 
          d.id,
          d.nome,
          rd.valor_gasto,
          rd.percent
        FROM requisicoes_departamentos rd
        LEFT JOIN Departamentos d ON rd.id_departamento = d.id
        WHERE rd.id_requisicao = ?
      `;
      const [departamentos] = await connection.query<RowDataPacket[]>(
        queryDepartamentos,
        [id_requisicao]
      );
      requisicao.departamentos = departamentos;

      const queryFornecedores = `
        SELECT 
          c.id AS id_cota,
          f.id AS id_fornecedor,
          f.nome_fornecedor AS nome,
          c.valor_total,
          c.status
        FROM cotas c
        LEFT JOIN fornecedores f ON c.id_fornecedor = f.id
        WHERE c.id_requisicao = ?
      `;
      const [fornecedores] = await connection.query<RowDataPacket[]>(
        queryFornecedores,
        [id_requisicao]
      );

      requisicao.fornecedores = fornecedores.map((fornecedor: any) => ({
        id: fornecedor.id_fornecedor,
        id_cota: fornecedor.id_cota,
        nome: fornecedor.nome,
        valor_total: fornecedor.valor_total,
        status: fornecedor.status,
        itens: [],
      }));

      const queryItens = `
        SELECT 
          i.id AS id_item,
          i.descricao_item,
          i.qtde,
          i.valor_unitario,
          fi.id_cota,
          fi.id_fornecedor
        FROM itens i
        LEFT JOIN fornecedores_itens fi ON i.id = fi.id_item
        WHERE i.id_requisicao = ?
      `;
      const [itens] = await connection.query<RowDataPacket[]>(queryItens, [
        id_requisicao,
      ]);

      for (const item of itens) {
        // Fallback para dados antigos: se id_cota for NULL, usa id_fornecedor
        const fornecedor = requisicao.fornecedores.find(
          (f: any) =>
            item.id_cota
              ? f.id_cota === item.id_cota // Requisições novas: agrupa por cota
              : f.id === item.id_fornecedor // Requisições antigas: agrupa por fornecedor
        );
        if (fornecedor) {
          fornecedor.itens.push({
            id: item.id_item,
            descricao: item.descricao_item,
            qtde: item.qtde,
            valor_unitario: item.valor_unitario,
          });
        }
      }

      // Buscar gerentes que aprovaram cada cota
      const queryGerentesPorCota = `
        SELECT 
          ag.id_cota,
          g.id AS id_gerente,
          CONCAT(g.nome, ' ', g.sobrenome) AS nome_gerente
        FROM aprovacao_gerente ag
        INNER JOIN Funcionarios g ON ag.id_gerente = g.id
        WHERE ag.id_requisicao = ? AND ag.aprovado = TRUE
      `;
      const [gerentesPorCota] = await connection.query<RowDataPacket[]>(
        queryGerentesPorCota,
        [id_requisicao]
      );

      // Adicionar gerentes aprovadores a cada fornecedor/cota
      for (const fornecedor of requisicao.fornecedores) {
        fornecedor.gerentes_aprovadores = gerentesPorCota
          .filter((gc: any) => gc.id_cota === fornecedor.id_cota)
          .map((gc: any) => ({
            id: gc.id_gerente,
            nome: gc.nome_gerente,
          }));
      }

      const queryGerentes = `
        SELECT 
          g.id,
          CONCAT(g.nome, ' ', g.sobrenome) AS nome,
          CASE WHEN ag.id_gerente IS NOT NULL THEN true ELSE false END AS aprovou,
          COALESCE(ag.aprovado_via_master, false) AS aprovado_via_master
        FROM requisicoes_gerente rg
        INNER JOIN Funcionarios g ON rg.id_gerente = g.id
        LEFT JOIN aprovacao_gerente ag ON rg.id_requisicao = ag.id_requisicao 
                                       AND rg.id_gerente = ag.id_gerente
        WHERE rg.id_requisicao = ?
        
        UNION
        
        -- Buscar gerentes que aprovaram via Master mas NÃO estão em requisicoes_gerente
        SELECT 
          g.id,
          CONCAT(g.nome, ' ', g.sobrenome) AS nome,
          true AS aprovou,
          true AS aprovado_via_master
        FROM aprovacao_gerente ag
        INNER JOIN Funcionarios g ON ag.id_gerente = g.id
        WHERE ag.id_requisicao = ?
          AND ag.aprovado_via_master = true
          AND ag.id_gerente NOT IN (
            SELECT id_gerente FROM requisicoes_gerente WHERE id_requisicao = ?
          )
      `;
      const [gerentes] = await connection.query<RowDataPacket[]>(
        queryGerentes,
        [id_requisicao, id_requisicao, id_requisicao]
      );

      // Se existe usuario_recusador e ele não está na lista de gerentes, adicionar como Master
      if (requisicao.usuario_recusador) {
        const queryRecusador = `
          SELECT 
            r.usuario_recusador AS id,
            CONCAT(f.nome, ' ', f.sobrenome) AS nome,
            false AS aprovou
          FROM requisicoes r
          INNER JOIN Funcionarios f ON r.usuario_recusador = f.id
          WHERE r.id = ? 
            AND r.usuario_recusador NOT IN (
              SELECT id_gerente FROM requisicoes_gerente WHERE id_requisicao = ?
            )
        `;
        const [recusador] = await connection.query<RowDataPacket[]>(
          queryRecusador,
          [id_requisicao, id_requisicao]
        );

        // Se o recusador foi encontrado e não está na lista de gerentes, adicionar
        if (recusador.length > 0) {
          gerentes.push(recusador[0]);
        }
      }

      // Buscar departamentos de cada gerente pela tabela ger_dep
      for (const gerente of gerentes) {
        // Verificar se o gerente está na lista original de requisicoes_gerente
        const queryGerenteNaRequisicao = `
          SELECT id_gerente 
          FROM requisicoes_gerente 
          WHERE id_requisicao = ? AND id_gerente = ?
        `;
        const [gerenteNaRequisicao] = await connection.query<RowDataPacket[]>(
          queryGerenteNaRequisicao,
          [id_requisicao, gerente.id]
        );

        // Se NÃO está na requisicoes_gerente, é Master (foi adicionado via Master)
        if (gerenteNaRequisicao.length === 0) {
          gerente.departamentos = [{ id: null, nome: "Master" }];
        } else {
          // Está na requisicoes_gerente, verificar se tem departamentos
          const queryDepartamentosGerente = `
            SELECT 
              d.id,
              d.nome
            FROM ger_dep gd
            INNER JOIN Departamentos d ON gd.id_departamento = d.id
            WHERE gd.id_gerente = ?
          `;
          const [departamentosGerente] = await connection.query<
            RowDataPacket[]
          >(queryDepartamentosGerente, [gerente.id]);

          // Se não tem departamentos cadastrados, marca como "Master"
          if (departamentosGerente.length === 0) {
            gerente.departamentos = [{ id: null, nome: "Master" }];
          } else {
            // Tem departamentos normais
            gerente.departamentos = departamentosGerente;
          }
        }
      }

      requisicao.gerentes = gerentes;

      const queryVerificaAprovacao = `
        SELECT 
          COUNT(DISTINCT rg.id_gerente) AS total_gerentes,
          COUNT(DISTINCT ag.id_gerente) AS total_aprovados
        FROM requisicoes_gerente rg
        LEFT JOIN aprovacao_gerente ag ON rg.id_gerente = ag.id_gerente 
                                       AND rg.id_requisicao = ag.id_requisicao
        WHERE rg.id_requisicao = ?
      `;
      const [verificaAprovacao] = await connection.query<RowDataPacket[]>(
        queryVerificaAprovacao,
        [id_requisicao]
      );

      const { total_gerentes, total_aprovados } = verificaAprovacao[0];
      requisicao.todos_gerentes_aprovaram =
        total_gerentes > 0 && total_gerentes === total_aprovados;

      return requisicao;
    } catch (error) {
      console.error("Erro ao buscar requisição por ID:", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  public async criarSolicitacao(payload: IDespesas) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const ids_departamentos = payload.departamentos.map(
        (id) => id.id_departamento
      );
      const gerentes = await this.getGerentes(ids_departamentos, connection);

      const [requisicaoResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO requisicoes (descricao, id_solicitante, id_aprovador_gerente, id_aprovador_diretor) VALUES (?, ?, ?, ?)",
        [
          payload.descricao,
          payload.id_solicitante,
          gerentes[0],
          payload.id_diretor,
        ]
      );

      const id_requisicao = requisicaoResult.insertId;
      await this.rateio(payload.departamentos, id_requisicao, connection);

      for (const fornecedor of payload.fornecedores) {
        let totalFornecedor = 0;
        const id_fornecedor = await this.createFornecedor(
          fornecedor.nome,
          connection
        );

        // Criar a cota ANTES dos itens para ter o id_cota
        const payloadCota: ICota = {
          id_fornecedor: id_fornecedor,
          id_requisicao: id_requisicao,
          valor_total: 0, // Será atualizado depois
        };
        const id_cota = await this.createCota(payloadCota, connection);

        for (const item of fornecedor.itens) {
          const id_item = await this.createItem(
            item,
            connection,
            id_requisicao
          );
          const payloadRelacao: IFornecedoresItens = {
            id_fornecedor: id_fornecedor,
            id_item: id_item,
            quantidade: item.qtde,
            valor_unitario: item.valor_unitario,
            id_cota: id_cota, // Vincular item à cota específica
          };
          await this.relacaoFornecedoresItens(payloadRelacao, connection);
          totalFornecedor += item.valor_unitario * item.qtde;
        }

        // Atualizar o valor total da cota
        await connection.query(
          `UPDATE cotas SET valor_total = ? WHERE id = ?`,
          [totalFornecedor, id_cota]
        );
      }
      const payloadRelacionarGerentes: relacionarGerentes = {
        gerentes: gerentes,
        id_requisicao: id_requisicao,
      };
      await this.relacaoGerentesRequisicoes(
        payloadRelacionarGerentes,
        connection
      );

      const nomeSolicitante = await this.buscarNomeSolicitante(
        payload.id_solicitante,
        connection
      );
      const departamentosNomes = await this.buscarNomesDepartamentos(
        id_requisicao,
        connection
      );
      const aprovadores = await this.buscarAprovadores(
        gerentes,
        payload.id_diretor,
        connection
      );

      await this.enviarNotificacoes(aprovadores, {
        descricao: payload.descricao,
        nomeSolicitante,
        departamentosNomes,
        fornecedores: payload.fornecedores,
        id_requisicao,
      });

      await connection.commit();

      return {
        id_requisicao,
        message:
          "Solicitação de compra enviada com sucesso para aprovação do gerente",
      };
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Erro ao criar solicitação de despesas:", error);
      throw new Error("Erro ao criar solicitação de despesas");
    } finally {
      if (connection) connection.release();
    }
  }

  public async aprovarCotaGerente(
    id_cota: number,
    id_gerente: number,
    id_requisicao: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [cotaExistente] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM cotas WHERE id = ?`,
        [id_cota]
      );

      if (!cotaExistente.length) {
        throw new Error("Cota não encontrada.");
      }

      //Verifica se o usuario participa da requisição como um gerente
      const [usuarioFazParte] = await connection.query<RowDataPacket[]>(
        `SELECT 1 AS faz_parte
          FROM ger_dep gd
          INNER JOIN requisicoes_departamentos rd 
            ON rd.id_departamento = gd.id_departamento
          WHERE rd.id_requisicao = ? 
            AND gd.id_gerente = ?
          LIMIT 1`,
        [id_requisicao, id_gerente]
      );

      if (usuarioFazParte.length === 0) {
        throw new Error("Esse usuário não faz parte da requisição.");
      }

      // Verificar se este gerente já aprovou ALGUMA cota desta requisição
      const [gerenteJaAprovou] = await connection.query<RowDataPacket[]>(
        `SELECT id_cota FROM aprovacao_gerente 
         WHERE id_requisicao = ? AND id_gerente = ?`,
        [id_requisicao, id_gerente]
      );

      if (gerenteJaAprovou.length > 0) {
        if (gerenteJaAprovou[0].id_cota === id_cota) {
          throw new Error(
            "Você já aprovou esta cota e não pode aprová-la novamente."
          );
        } else {
          throw new Error(
            "Você já aprovou outra cota desta requisição e não pode aprovar mais de uma."
          );
        }
      }

      // Verificar se já existe alguma cota aprovada por outro gerente
      const [cotaJaAprovada] = await connection.query<RowDataPacket[]>(
        `SELECT ag.id_cota, c.status 
         FROM aprovacao_gerente ag
         INNER JOIN cotas c ON ag.id_cota = c.id
         WHERE ag.id_requisicao = ? 
         LIMIT 1`,
        [id_requisicao]
      );

      // Se já existe cota aprovada, ESTE gerente só pode aprovar A MESMA
      if (cotaJaAprovada.length > 0) {
        const cotaEscolhidaPeloPrimeiro = cotaJaAprovada[0].id_cota;
        if (cotaEscolhidaPeloPrimeiro !== id_cota) {
          throw new Error(
            "O primeiro gerente já escolheu outra cota. Você deve aprovar a mesma cota que ele escolheu, ou reprovar a requisição."
          );
        }
      }

      // Registrar aprovação do gerente
      await connection.query(
        `INSERT INTO aprovacao_gerente (id_requisicao, id_gerente, id_cota, aprovado) 
         VALUES (?, ?, ?, TRUE)`,
        [id_requisicao, id_gerente, id_cota]
      );

      // SEMPRE que um gerente aprova uma cota, ela vira "Aprovada" e as outras "Rejeitadas"
      // (Não importa se é o primeiro ou o segundo gerente)
      await connection.query(
        `UPDATE cotas 
         SET status = 'Aprovada'
         WHERE id = ?`,
        [id_cota]
      );

      await connection.query(
        `UPDATE cotas 
         SET status = 'Rejeitada' 
         WHERE id_requisicao = ? AND id != ?`,
        [id_requisicao, id_cota]
      );

      const [gerentesAprovados] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS totalAprovacoesGerente 
         FROM aprovacao_gerente 
         WHERE id_cota = ?`,
        [id_cota]
      );

      const [totalGerentes] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS totalGerentes 
         FROM requisicoes_gerente 
         WHERE id_requisicao = ?`,
        [id_requisicao]
      );

      if (
        gerentesAprovados[0].totalAprovacoesGerente ===
        totalGerentes[0].totalGerentes
      ) {
        await connection.query(
          `UPDATE cotas 
           SET aprovado_por_gerente = TRUE 
           WHERE id = ?`,
          [id_cota]
        );

        const [requisicao] = await connection.query<RowDataPacket[]>(
          `SELECT descricao, id_solicitante, id_aprovador_diretor FROM requisicoes WHERE id = ?`,
          [id_requisicao]
        );

        if (requisicao.length > 0) {
          const { descricao, id_solicitante, id_aprovador_diretor } =
            requisicao[0];
          const nomeSolicitante = await this.buscarNomeSolicitante(
            id_solicitante,
            connection
          );

          const [diretor] = await connection.query<RowDataPacket[]>(
            `SELECT id, nome, mail, aut_wpp, telefone FROM Funcionarios WHERE id = ?`,
            [id_aprovador_diretor]
          );

          if (diretor.length > 0 && diretor[0].mail) {
            await this.notificationService.notify({
              recipients: [diretor[0]],
              template: "NEW_REQUEST_APROVADOR",
              data: {
                id_requisicao: id_requisicao.toString(),
                descricao,
                solicitante: nomeSolicitante,
                data_solicitacao: new Date().toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                }),
                departamentos: "",
                fornecedores:
                  "Todos os gerentes aprovaram. Aguardando sua aprovação.",
              },
              module: "DESPESAS",
              link: `https://smartcompras.francautolabs.com.br/despesas/solicitacoes?modal=detalhes&id=${id_requisicao}`,
            });
          }
        }
      }

      await connection.commit();
      return { message: "Cota aprovada com sucesso pelo gerente." };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao aprovar a cota pelo gerente:", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  public async aprovarCotaDiretor(
    id_requisicao: number,
    id_cota: number,
    id_diretor: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [cotaApproval] = await connection.query<RowDataPacket[]>(
        `SELECT id, aprovado_por_gerente, aprovado_por_diretor, status 
         FROM cotas 
         WHERE id = ? AND id_requisicao = ?`,
        [id_cota, id_requisicao]
      );

      if (!cotaApproval.length) {
        throw new Error(
          "Cota inválida ou não encontrada para esta requisição."
        );
      }

      const { aprovado_por_gerente, aprovado_por_diretor, status } =
        cotaApproval[0];

      if (aprovado_por_diretor) {
        throw new Error("Esta cota já foi aprovada pelo diretor.");
      }

      if (!aprovado_por_gerente || status !== "Aprovada") {
        throw new Error(
          "Esta cota ainda não foi aprovada por todos os gerentes."
        );
      }

      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT aprovado_diretor, status 
         FROM requisicoes 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição inválida ou não encontrada.");
      }

      const { aprovado_diretor } = requisicao[0];

      if (aprovado_diretor) {
        throw new Error("Esta requisição já foi aprovada pelo diretor.");
      }

      await connection.query(
        `UPDATE cotas 
         SET aprovado_por_diretor = TRUE 
         WHERE id = ?`,
        [id_cota]
      );

      await connection.query(
        `UPDATE requisicoes 
         SET id_cota_aprovada_diretor = ?, 
             aprovado_diretor = TRUE, 
             id_aprovador_diretor = ?, 
             data_aprovacao_diretor = CURRENT_TIMESTAMP, 
             status = 'Aprovada'
         WHERE id = ?`,
        [id_cota, id_diretor, id_requisicao]
      );

      await this.calcularRateioDespesas(id_requisicao, id_cota, connection);
      const payload_relation: Ihash = {
        id_requisicao: id_requisicao,
        tabela: "requisicoes_id",
      };
      await createRequestRelation(payload_relation, connection);
      await connection.commit();
      return {
        message: "Requisição e cota aprovadas pelo diretor com sucesso.",
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao aprovar a requisição pelo diretor:", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  public async calcularRateioDespesas(
    id_requisicao: number,
    id_cota: number,
    connection: PoolConnection
  ) {
    const [requisicao] = await connection.query<RowDataPacket[]>(
      `SELECT rateada FROM requisicoes WHERE id = ?`,
      [id_requisicao]
    );

    if (requisicao.length === 0) {
      throw new Error("Requisição não encontrada para rateio.");
    }

    if (requisicao[0].rateada) {
      return;
    }

    const [cota] = await connection.query<RowDataPacket[]>(
      `SELECT valor_total FROM cotas WHERE id = ? AND status = 'Aprovada'`,
      [id_cota]
    );

    if (cota.length === 0) {
      throw new Error("Cota não encontrada ou não aprovada para rateio.");
    }

    const valorTotalCota = parseFloat(cota[0].valor_total);

    const [departamentos] = await connection.query<RowDataPacket[]>(
      `SELECT id, id_departamento, percent 
       FROM requisicoes_departamentos 
       WHERE id_requisicao = ?`,
      [id_requisicao]
    );

    if (departamentos.length === 0) {
      throw new Error("Nenhum departamento associado à requisição.");
    }

    const somaPercentuais = departamentos.reduce(
      (acc, dep) => acc + parseFloat(dep.percent),
      0
    );

    if (Math.abs(somaPercentuais - 100) > 0.01) {
      throw new Error(
        `Soma dos percentuais de rateio (${somaPercentuais}%) deve ser igual a 100%.`
      );
    }

    for (const dep of departamentos) {
      const valorRateado = (parseFloat(dep.percent) / 100) * valorTotalCota;

      await connection.query(
        `UPDATE requisicoes_departamentos 
         SET valor_gasto = ? 
         WHERE id = ?`,
        [valorRateado, dep.id]
      );
    }

    await connection.query(
      `UPDATE requisicoes SET rateada = TRUE WHERE id = ?`,
      [id_requisicao]
    );
  }

  public async recusarCota(
    id_requisicao: number,
    id_cota: number,
    id_usuario: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [usuario] = await connection.query<RowDataPacket[]>(
        `SELECT cargo FROM Funcionarios WHERE id = ?`,
        [id_usuario]
      );

      if (!usuario.length) {
        throw new Error("Usuário não encontrado.");
      }

      const { cargo } = usuario[0];

      const [cotaExistente] = await connection.query<RowDataPacket[]>(
        `SELECT id, status FROM cotas WHERE id = ? AND id_requisicao = ?`,
        [id_cota, id_requisicao]
      );

      if (!cotaExistente.length) {
        throw new Error("Cota não encontrada para esta requisição.");
      }

      const { status } = cotaExistente[0].status;

      // Verificar se o usuário já respondeu à solicitação
      if (["ger", "admger"].includes(cargo)) {
        const [jaRespondeu] = await connection.query<RowDataPacket[]>(
          `SELECT id FROM aprovacao_gerente WHERE id_gerente = ? AND id_requisicao = ?`,
          [id_usuario, id_requisicao]
        );

        if (jaRespondeu.length > 0) {
          throw new Error("Você já respondeu a esta solicitação.");
        }
      }

      if (["dir", "admdir"].includes(cargo)) {
        const [requisicao] = await connection.query<RowDataPacket[]>(
          `SELECT aprovado_diretor FROM requisicoes WHERE id = ?`,
          [id_requisicao]
        );

        if (requisicao[0].aprovador_diretor) {
          throw new Error("Você já respondeu a esta solicitação.");
        }
      }

      if (
        status === "Aprovada" &&
        !["dir", "admdir", "ger", "admger"].includes(cargo)
      ) {
        throw new Error("A cota já foi aprovada e não pode ser rejeitada.");
      }

      await connection.query(
        `UPDATE cotas SET status = 'Rejeitada' WHERE id = ?`,
        [id_cota]
      );

      await connection.query(
        `UPDATE cotas SET status = 'Rejeitada' WHERE id_requisicao = ? AND id != ?`,
        [id_requisicao, id_cota]
      );

      const [cotacoesRejeitadas] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS totalRejeitadas FROM cotas WHERE id_requisicao = ? AND status = 'Rejeitada'`,
        [id_requisicao]
      );

      const [totalCotacoes] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS totalCotacoes FROM cotas WHERE id_requisicao = ?`,
        [id_requisicao]
      );

      if (
        cotacoesRejeitadas[0].totalRejeitadas === totalCotacoes[0].totalCotacoes
      ) {
        await connection.query(
          `UPDATE requisicoes 
           SET status = 'Reprovada', usuario_recusador = ?, data_recusa = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [id_usuario, id_requisicao]
        );
      }

      await connection.commit();
      return {
        message: "Cota e requisição rejeitadas com sucesso.",
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao rejeitar a cota:", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

export default new DespesasService();
