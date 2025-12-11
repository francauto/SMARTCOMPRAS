import pool from "../../config/db";
import { RowDataPacket } from "mysql2";
import {
  IFiltroRelatorioDespesas,
  IAnaliseTemporalDespesas,
  IGastosPorDepartamento,
  ISolicitanteDepartamento,
  IComparativoCotacoes,
  IResumoGeralDespesas,
  IRequisicaoDespesaDetalhada,
  IDadosRelatoriosDespesasPDF,
} from "../../interfaces/relatorios/despesas.interface";

class RelatorioDespesasService {
  // Construir cláusula WHERE dinâmica
  private construirWhereClause(filtros: IFiltroRelatorioDespesas): {
    where: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    // Datas obrigatórias
    conditions.push("r.data_requisicao >= ?");
    params.push(`${filtros.dataInicio} 00:00:00`);
    conditions.push("r.data_requisicao <= ?");
    params.push(`${filtros.dataFim} 23:59:59`);

    // Status obrigatório: apenas requisições Aprovadas
    conditions.push("r.status = 'Aprovada'");

    // Solicitante
    if (filtros.solicitante) {
      conditions.push("r.id_solicitante = ?");
      params.push(filtros.solicitante);
    }

    // Aprovador (diretor)
    if (filtros.aprovador) {
      conditions.push("r.id_aprovador_diretor = ?");
      params.push(filtros.aprovador);
    }

    // Departamento
    if (filtros.departamento) {
      conditions.push("rd.id_departamento = ?");
      params.push(filtros.departamento);
    }

    return {
      where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  // Retorna expressão SQL para agrupamento por período
  private getGroupByPeriodo(tipo_periodo?: string): string {
    switch (tipo_periodo) {
      case "dia":
        return "DATE(r.data_requisicao)";
      case "semana":
        return "YEARWEEK(r.data_requisicao, 1)";
      case "mes":
        return "DATE_FORMAT(r.data_requisicao, '%Y-%m')";
      case "ano":
        return "YEAR(r.data_requisicao)";
      default:
        return "DATE_FORMAT(r.data_requisicao, '%Y-%m')";
    }
  }

  // Retorna expressão SQL para formatação do período (deve ser idêntica ao GROUP BY)
  private formatarPeriodo(tipo_periodo?: string): string {
    return this.getGroupByPeriodo(tipo_periodo);
  }

  // 1. Análise Temporal
  async getAnaliseTemporal(
    filtros: IFiltroRelatorioDespesas
  ): Promise<IAnaliseTemporalDespesas[]> {
    const { where, params } = this.construirWhereClause(filtros);
    const groupByExpr = this.getGroupByPeriodo(filtros.tipo_periodo);
    const selectExpr = this.formatarPeriodo(filtros.tipo_periodo);

    const query = `
      SELECT 
        ${selectExpr} as periodo,
        COUNT(DISTINCT r.id) as total_requisicoes,
        SUM(${
          filtros.departamento ? "rd.valor_gasto" : "c.valor_total"
        }) as total_gasto,
        AVG(${
          filtros.departamento ? "rd.valor_gasto" : "c.valor_total"
        }) as media_gasto
      FROM cotas c
      INNER JOIN requisicoes r ON r.id = c.id_requisicao
      ${
        filtros.departamento
          ? "INNER JOIN requisicoes_departamentos rd ON rd.id_requisicao = r.id"
          : ""
      }
      ${where}
      GROUP BY ${groupByExpr}
      ORDER BY periodo
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as IAnaliseTemporalDespesas[];
  }

  // 2. Gastos por Departamento com Top 3 Solicitantes
  async getGastosPorDepartamento(
    filtros: IFiltroRelatorioDespesas
  ): Promise<IGastosPorDepartamento[]> {
    const { where, params } = this.construirWhereClause(filtros);

    // Query principal: departamentos
    const queryDepartamentos = `
      SELECT 
        d.id as id_departamento,
        d.nome as departamento,
        COUNT(DISTINCT r.id) as total_requisicoes,
        COALESCE(SUM(rd.valor_gasto), 0) as valor_total,
        COALESCE(AVG(rd.valor_gasto), 0) as ticket_medio,
        COUNT(DISTINCT r.id_solicitante) as solicitantes_unicos
      FROM Departamentos d
      INNER JOIN requisicoes_departamentos rd ON rd.id_departamento = d.id
      INNER JOIN requisicoes r ON r.id = rd.id_requisicao
      LEFT JOIN cotas c ON c.id = r.id_cota_aprovada_diretor
      ${where}
      GROUP BY d.id, d.nome
      ORDER BY valor_total DESC
    `;

    const [departamentos] = await pool.query<RowDataPacket[]>(
      queryDepartamentos,
      params
    );

    // Para cada departamento, buscar top 3 solicitantes
    const resultado: IGastosPorDepartamento[] = [];

    for (const dept of departamentos) {
      const whereDept = where
        ? `${where} AND rd.id_departamento = ?`
        : `WHERE rd.id_departamento = ?`;
      const paramsDept = [...params, dept.id_departamento];

      const querySolicitantes = `
        SELECT 
          r.id_solicitante,
          CONCAT(f.nome, ' ', f.sobrenome) as nome_solicitante,
          COUNT(DISTINCT r.id) as total_requisicoes,
          COALESCE(SUM(rd.valor_gasto), 0) as valor_total,
          COALESCE(AVG(rd.valor_gasto), 0) as valor_medio
        FROM requisicoes_departamentos rd
        INNER JOIN requisicoes r ON r.id = rd.id_requisicao
        JOIN Funcionarios f ON f.id = r.id_solicitante
        LEFT JOIN cotas c ON c.id = r.id_cota_aprovada_diretor
        ${whereDept}
        GROUP BY r.id_solicitante, f.nome, f.sobrenome
        ORDER BY valor_total DESC
        LIMIT 3
      `;

      const [solicitantes] = await pool.query<RowDataPacket[]>(
        querySolicitantes,
        paramsDept
      );

      resultado.push({
        id_departamento: dept.id_departamento,
        departamento: dept.departamento,
        total_requisicoes: dept.total_requisicoes,
        valor_total: parseFloat(dept.valor_total),
        ticket_medio: parseFloat(dept.ticket_medio),
        solicitantes_unicos: dept.solicitantes_unicos,
        top_solicitantes: solicitantes.map((s) => ({
          id_solicitante: s.id_solicitante,
          nome_solicitante: s.nome_solicitante,
          total_requisicoes: s.total_requisicoes,
          valor_total: parseFloat(s.valor_total),
          valor_medio: parseFloat(s.valor_medio),
        })),
      });
    }

    return resultado;
  }

  // 3. Comparativo de Cotações (Economia Gerada)
  async getComparativoCotacoes(
    filtros: IFiltroRelatorioDespesas
  ): Promise<IComparativoCotacoes[]> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        r.id as requisicao_id,
        r.descricao,
        r.data_requisicao,
        COUNT(DISTINCT c.id_fornecedor) as num_fornecedores,
        MIN(c.valor_total) as menor_valor,
        MAX(c.valor_total) as maior_valor,
        (MAX(c.valor_total) - MIN(c.valor_total)) as economia,
        ROUND((MAX(c.valor_total) - MIN(c.valor_total)) / MAX(c.valor_total) * 100, 2) as percentual_economia,
        COALESCE((SELECT f.nome_fornecedor 
         FROM fornecedores f 
         JOIN cotas c2 ON c2.id_fornecedor = f.id 
         WHERE c2.id = r.id_cota_aprovada_diretor
         LIMIT 1), 'N/A') as fornecedor_escolhido
      FROM requisicoes r
      JOIN cotas c ON c.id_requisicao = r.id
      ${where}
      GROUP BY r.id, r.descricao, r.data_requisicao, r.id_cota_aprovada_diretor
      HAVING num_fornecedores > 1
      ORDER BY economia DESC
      LIMIT 50
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map((row) => ({
      requisicao_id: row.requisicao_id,
      descricao: row.descricao,
      data_requisicao: row.data_requisicao,
      num_fornecedores: row.num_fornecedores,
      menor_valor: parseFloat(row.menor_valor),
      maior_valor: parseFloat(row.maior_valor),
      economia: parseFloat(row.economia),
      percentual_economia: parseFloat(row.percentual_economia),
      fornecedor_escolhido: row.fornecedor_escolhido,
    }));
  }

  // 4. Resumo Geral
  async getResumoGeral(
    filtros: IFiltroRelatorioDespesas
  ): Promise<IResumoGeralDespesas> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        COUNT(r.id) as total_requisicoes,
        COUNT(CASE WHEN r.status = 'Aprovada' THEN 1 END) as aprovadas,
        COUNT(CASE WHEN r.status = 'Reprovada' THEN 1 END) as reprovadas,
        COUNT(CASE WHEN r.status = 'Pendente' THEN 1 END) as pendentes,
        COALESCE(SUM(CASE WHEN r.status = 'Aprovada' THEN c.valor_total END), 0) as valor_total_aprovado,
        COALESCE(AVG(CASE WHEN r.status = 'Aprovada' THEN c.valor_total END), 0) as ticket_medio
      FROM requisicoes r
      LEFT JOIN cotas c ON c.id = r.id_cota_aprovada_diretor
      ${where}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    const row = rows[0];

    // Calcular economia total
    const economiaTotal = await this.getEconomiaTotal(filtros);

    return {
      totais: {
        requisicoes: row.total_requisicoes || 0,
        aprovadas: row.aprovadas || 0,
        reprovadas: row.reprovadas || 0,
        pendentes: row.pendentes || 0,
        valor_total_aprovado: parseFloat(row.valor_total_aprovado) || 0,
        ticket_medio: parseFloat(row.ticket_medio) || 0,
        economia_total_gerada: economiaTotal,
      },
    };
  }

  // Helper: Calcular economia total
  private async getEconomiaTotal(
    filtros: IFiltroRelatorioDespesas
  ): Promise<number> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        COALESCE(SUM(MAX(c.valor_total) - MIN(c.valor_total)), 0) as economia_total
      FROM requisicoes r
      JOIN cotas c ON c.id_requisicao = r.id
      ${where}
      GROUP BY r.id
      HAVING COUNT(DISTINCT c.id_fornecedor) > 1
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.length > 0 ? parseFloat(rows[0].economia_total) || 0 : 0;
  }

  // 5. Todas as Requisições
  async getTodasRequisicoes(
    filtros: IFiltroRelatorioDespesas
  ): Promise<IRequisicaoDespesaDetalhada[]> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        r.id,
        DATE_FORMAT(r.data_requisicao, '%d/%m/%Y') as data_requisicao,
        DATE_FORMAT(r.data_aprovacao_diretor, '%d/%m/%Y') as data_aprovacao,
        r.descricao,
        d.nome as departamento,
        rd.valor_gasto as valor_departamento,
        rd.percent as percentual_rateio,
        CONCAT(f.nome, ' ', f.sobrenome) as nome_solicitante,
        r.status,
        COALESCE(c.valor_total, 0) as valor,
        COALESCE(fo.nome_fornecedor, 'N/A') as fornecedor_escolhido,
        r.impresso
      FROM requisicoes r
      LEFT JOIN requisicoes_departamentos rd ON rd.id_requisicao = r.id
      LEFT JOIN Departamentos d ON d.id = rd.id_departamento
      LEFT JOIN Funcionarios f ON f.id = r.id_solicitante
      LEFT JOIN cotas c ON c.id = r.id_cota_aprovada_diretor
      LEFT JOIN fornecedores fo ON fo.id = c.id_fornecedor
      ${where}
      ORDER BY r.data_requisicao DESC
      LIMIT 500
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map((row) => ({
      id: row.id,
      data_requisicao: row.data_requisicao,
      data_aprovacao: row.data_aprovacao || "N/A",
      descricao: row.descricao,
      departamento: row.departamento,
      nome_solicitante: row.nome_solicitante,
      status: row.status,
      valor: parseFloat(row.valor),
      fornecedor_escolhido: row.fornecedor_escolhido,
      impresso: row.impresso,
    }));
  }

  // Agregador: Buscar dados para PDF
  async getDadosParaPDF(
    relatorios: string[],
    filtros: IFiltroRelatorioDespesas
  ): Promise<IDadosRelatoriosDespesasPDF> {
    const dados: IDadosRelatoriosDespesasPDF = {};

    const promises = relatorios.map(async (relatorio) => {
      switch (relatorio) {
        case "analiseTemporal":
          dados.analiseTemporal = await this.getAnaliseTemporal(filtros);
          break;
        case "gastosPorDepartamento":
          dados.gastosPorDepartamento = await this.getGastosPorDepartamento(
            filtros
          );
          break;
        case "comparativoCotacoes":
          dados.comparativoCotacoes = await this.getComparativoCotacoes(
            filtros
          );
          break;
        case "resumoGeral":
          dados.resumoGeral = await this.getResumoGeral(filtros);
          break;
        case "todas":
          dados.todas = await this.getTodasRequisicoes(filtros);
          break;
      }
    });

    await Promise.all(promises);
    return dados;
  }
}

export default new RelatorioDespesasService();
