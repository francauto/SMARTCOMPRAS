import pool from "../../config/db";
import {
  IFiltroRelatorioCombustivelEstoque,
  IConsumoPorVeiculo,
  IAnaliseTemporalCombustivel,
  IPorTipoCombustivel,
  IPorDepartamentoCombustivel,
  IPorSolicitanteCombustivel,
  IPorMarcaModelo,
  ITempoAprovacao,
  IResumoGeralCombustivel,
  IRequisicaoCombustivelDetalhada,
  IDadosRelatoriosCombustivelPDF,
} from "../../interfaces/relatorios/combustivel-estoque.interface";

class RelatorioCombustivelEstoqueService {
  // Helper para construir WHERE clause baseado nos filtros
  private construirWhereClause(filtros: IFiltroRelatorioCombustivelEstoque): {
    where: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    // Status obrigatório: apenas requisições Aprovadas
    conditions.push("c.status = 'Aprovado'");

    // Range de datas obrigatório
    conditions.push("DATE(c.data_aprovacao) >= ?");
    params.push(filtros.dataInicio);
    conditions.push("DATE(c.data_aprovacao) <= ?");
    params.push(filtros.dataFim);

    // Filtros opcionais
    if (filtros.solicitante) {
      conditions.push("c.id_solicitante = ?");
      params.push(filtros.solicitante);
    }

    if (filtros.aprovador) {
      conditions.push("c.id_aprovador = ?");
      params.push(filtros.aprovador);
    }

    if (filtros.departamento) {
      conditions.push("c.id_departamento = ?");
      params.push(filtros.departamento);
    }

    if (filtros.tipo_combustivel) {
      conditions.push("c.tipo_combustivel = ?");
      params.push(filtros.tipo_combustivel);
    }

    if (filtros.placa) {
      conditions.push("c.placa = ?");
      params.push(filtros.placa);
    }

    if (filtros.chassi) {
      conditions.push("c.chassi = ?");
      params.push(filtros.chassi);
    }

    if (filtros.marca) {
      conditions.push("c.marca = ?");
      params.push(filtros.marca);
    }

    if (filtros.modelo) {
      conditions.push("c.modelo LIKE ?");
      params.push(`%${filtros.modelo}%`);
    }

    return {
      where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  // Helper para agrupar por período
  private getGroupByPeriodo(tipo_periodo?: string): string {
    switch (tipo_periodo) {
      case "dia":
        return "DATE(c.data_aprovacao)";
      case "semana":
        return "YEARWEEK(c.data_aprovacao, 1)";
      case "ano":
        return "YEAR(c.data_aprovacao)";
      case "mes":
      default:
        return "DATE_FORMAT(c.data_aprovacao, '%Y-%m')";
    }
  }

  private formatarPeriodo(tipo_periodo?: string): string {
    switch (tipo_periodo) {
      case "dia":
        return "DATE(c.data_aprovacao)";
      case "semana":
        return "YEARWEEK(c.data_aprovacao, 1)";
      case "ano":
        return "YEAR(c.data_aprovacao)";
      case "mes":
      default:
        return "DATE_FORMAT(c.data_aprovacao, '%Y-%m')";
    }
  }

  // 1. Consumo por Veículo
  async getConsumoPorVeiculo(
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IConsumoPorVeiculo[]> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        COALESCE(c.placa, c.chassi) as identificacao,
        c.placa,
        c.chassi,
        c.marca,
        c.modelo,
        c.tipo_combustivel,
        SUM(c.quantidade_litros) as totalLitros,
        COUNT(*) as quantidadeRequisicoes,
        AVG(c.quantidade_litros) as mediaLitrosPorRequisicao,
        d.nome as departamento_nome
      FROM combustivel_request_estoque c
      LEFT JOIN Departamentos d ON c.id_departamento = d.id
      ${where}
      GROUP BY COALESCE(c.placa, c.chassi), c.placa, c.chassi, c.marca, c.modelo, c.tipo_combustivel, d.nome
      ORDER BY totalLitros DESC
    `;

    const [rows] = await pool.query<IConsumoPorVeiculo[]>(query, params);
    return rows;
  }

  // 2. Análise Temporal
  async getAnaliseTemporal(
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IAnaliseTemporalCombustivel[]> {
    const { where, params } = this.construirWhereClause(filtros);
    const groupBy = this.getGroupByPeriodo(filtros.tipo_periodo);
    const periodoFormat = this.formatarPeriodo(filtros.tipo_periodo);

    const query = `
      SELECT 
        ${periodoFormat} as periodo,
        SUM(c.quantidade_litros) as totalLitros,
        COUNT(*) as quantidadeRequisicoes,
        AVG(c.quantidade_litros) as mediaLitrosPorRequisicao,
        COUNT(DISTINCT COALESCE(c.placa, c.chassi)) as veiculosUnicos
      FROM combustivel_request_estoque c
      ${where}
      GROUP BY ${periodoFormat}
      ORDER BY ${periodoFormat}
    `;

    const [rows] = await pool.query<IAnaliseTemporalCombustivel[]>(
      query,
      params
    );
    return rows;
  }

  // 3. Por Tipo de Combustível
  async getPorTipoCombustivel(
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IPorTipoCombustivel[]> {
    const { where, params } = this.construirWhereClause(filtros);

    // Build WHERE clause for subquery with c2 alias
    const whereSubquery = where.replace(/\bc\./g, "c2.");

    const query = `
      SELECT 
        COALESCE(c.tipo_combustivel, 'Não especificado') as tipo_combustivel,
        SUM(c.quantidade_litros) as totalLitros,
        COUNT(*) as quantidadeRequisicoes,
        AVG(c.quantidade_litros) as mediaLitrosPorRequisicao,
        (SUM(c.quantidade_litros) / (SELECT SUM(c2.quantidade_litros) FROM combustivel_request_estoque c2 ${whereSubquery}) * 100) as percentualTotal
      FROM combustivel_request_estoque c
      ${where}
      GROUP BY c.tipo_combustivel
      ORDER BY totalLitros DESC
    `;

    const [rows] = await pool.query<IPorTipoCombustivel[]>(query, [
      ...params,
      ...params,
    ]);
    return rows;
  }

  // 4. Por Departamento
  async getPorDepartamento(
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IPorDepartamentoCombustivel[]> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        COALESCE(d.nome, 'Sem departamento') as departamento_nome,
        c.id_departamento,
        SUM(c.quantidade_litros) as totalLitros,
        COUNT(*) as quantidadeRequisicoes,
        COUNT(DISTINCT COALESCE(c.placa, c.chassi)) as veiculosUnicos,
        AVG(c.quantidade_litros) as mediaLitrosPorRequisicao
      FROM combustivel_request_estoque c
      LEFT JOIN Departamentos d ON c.id_departamento = d.id
      ${where}
      GROUP BY c.id_departamento, d.nome
      ORDER BY totalLitros DESC
    `;

    const [rows] = await pool.query<IPorDepartamentoCombustivel[]>(
      query,
      params
    );
    return rows;
  }

  // 5. Por Solicitante
  async getPorSolicitante(
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IPorSolicitanteCombustivel[]> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        CONCAT(f.nome, ' ', f.sobrenome) as solicitante,
        c.id_solicitante,
        SUM(c.quantidade_litros) as totalLitros,
        COUNT(*) as quantidadeRequisicoes,
        AVG(c.quantidade_litros) as mediaLitrosPorRequisicao
      FROM combustivel_request_estoque c
      INNER JOIN Funcionarios f ON c.id_solicitante = f.id
      ${where}
      GROUP BY c.id_solicitante, f.nome, f.sobrenome
      ORDER BY totalLitros DESC
    `;

    const [rows] = await pool.query<IPorSolicitanteCombustivel[]>(
      query,
      params
    );
    return rows;
  }

  // 6. Por Marca/Modelo
  async getPorMarcaModelo(
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IPorMarcaModelo[]> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        c.marca,
        c.modelo,
        SUM(c.quantidade_litros) as totalLitros,
        COUNT(*) as quantidadeRequisicoes,
        COUNT(DISTINCT COALESCE(c.placa, c.chassi)) as veiculosUnicos,
        AVG(c.quantidade_litros) as mediaLitrosPorVeiculo
      FROM combustivel_request_estoque c
      ${where}
      GROUP BY c.marca, c.modelo
      ORDER BY totalLitros DESC
    `;

    const [rows] = await pool.query<IPorMarcaModelo[]>(query, params);
    return rows;
  }

  // 7. Tempo de Aprovação - REMOVIDO

  // 8. Resumo Geral
  async getResumoGeral(
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IResumoGeralCombustivel> {
    const { where, params } = this.construirWhereClause(filtros);

    // Totais gerais
    const queryTotais = `
      SELECT 
        COUNT(*) as requisicoes,
        SUM(c.quantidade_litros) as litros,
        COUNT(DISTINCT COALESCE(c.placa, c.chassi)) as veiculosUnicos,
        AVG(c.quantidade_litros) as mediaLitrosPorRequisicao
      FROM combustivel_request_estoque c
      ${where}
    `;

    const [rowsTotais] = await pool.query<any[]>(queryTotais, params);
    const totais = rowsTotais[0];

    // Top 10 solicitantes
    const topSolicitantes = await this.getPorSolicitante(filtros);

    // Top 10 veículos
    const topVeiculos = await this.getConsumoPorVeiculo(filtros);

    // Por tipo de combustível
    const porTipoCombustivel = await this.getPorTipoCombustivel(filtros);

    return {
      totais: {
        requisicoes: totais.requisicoes || 0,
        litros: parseFloat(totais.litros) || 0,
        veiculosUnicos: totais.veiculosUnicos || 0,
        mediaLitrosPorRequisicao:
          parseFloat(totais.mediaLitrosPorRequisicao) || 0,
      },
      topSolicitantes: topSolicitantes.slice(0, 10),
      topVeiculos: topVeiculos.slice(0, 10),
      porTipoCombustivel,
    };
  }

  // 9. Todas as Requisições
  async getTodasRequisicoes(
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IRequisicaoCombustivelDetalhada[]> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        c.id,
        c.chassi,
        c.placa,
        c.modelo,
        c.marca,
        c.quantidade_litros,
        c.tipo_combustivel,
        DATE_FORMAT(c.data_solicitacao, '%d/%m/%Y %H:%i') as data_solicitacao,
        DATE_FORMAT(c.data_aprovacao, '%d/%m/%Y %H:%i') as data_aprovacao,
        c.status,
        CONCAT(fs.nome, ' ', fs.sobrenome) as nome_solicitante,
        CONCAT(fa.nome, ' ', fa.sobrenome) as nome_aprovador,
        d.nome as departamento_nome,
        c.impresso
      FROM combustivel_request_estoque c
      INNER JOIN Funcionarios fs ON c.id_solicitante = fs.id
      LEFT JOIN Funcionarios fa ON c.id_aprovador = fa.id
      LEFT JOIN Departamentos d ON c.id_departamento = d.id
      ${where}
      ORDER BY c.data_aprovacao DESC
      LIMIT 500
    `;

    const [rows] = await pool.query<IRequisicaoCombustivelDetalhada[]>(
      query,
      params
    );
    return rows;
  }

  // Função agregadora para buscar dados de múltiplos relatórios
  async getDadosParaPDF(
    relatorios: string[],
    filtros: IFiltroRelatorioCombustivelEstoque
  ): Promise<IDadosRelatoriosCombustivelPDF> {
    const dados: IDadosRelatoriosCombustivelPDF = {};

    const promises = relatorios.map(async (tipo) => {
      switch (tipo) {
        case "consumoPorVeiculo":
          dados.consumoPorVeiculo = await this.getConsumoPorVeiculo(filtros);
          break;
        case "analiseTemporal":
          dados.analiseTemporal = await this.getAnaliseTemporal(filtros);
          break;
        case "porTipoCombustivel":
          dados.porTipoCombustivel = await this.getPorTipoCombustivel(filtros);
          break;
        case "porDepartamento":
          dados.porDepartamento = await this.getPorDepartamento(filtros);
          break;
        case "porSolicitante":
          dados.porSolicitante = await this.getPorSolicitante(filtros);
          break;
        case "porMarcaModelo":
          dados.porMarcaModelo = await this.getPorMarcaModelo(filtros);
          break;
        case "tempoAprovacao":
          // dados.tempoAprovacao - REMOVIDO
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

export default new RelatorioCombustivelEstoqueService();
