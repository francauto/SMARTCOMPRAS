import { Pool, RowDataPacket } from "mysql2/promise";
import pool from "../../config/db";
import {
  IFiltroRelatorioEstoque,
  IValorCompraVenda,
  IValorFrete,
  IRequisicaoPorSolicitante,
  IItemRequisicao,
  IEntregaDireta,
  IResumoGeral,
  IRequisicaoEstoqueDetalhada,
  IDadosRelatoriosPDF,
} from "../../interfaces/relatorios/estoque.interface";

class RelatorioEstoqueService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // Função auxiliar para construir cláusula WHERE baseada nos filtros
  private construirFiltros(filtros: IFiltroRelatorioEstoque): {
    where: string;
    params: any[];
  } {
    const where: string[] = [];
    const params: any[] = [];

    // Filtro de data - SEMPRE obrigatório
    where.push("re.data_requisicao BETWEEN ? AND ?");
    params.push(filtros.dataInicio, filtros.dataFim);

    // Filtro de fornecedor
    if (filtros.fornecedor) {
      where.push("re.fornecedor LIKE ?");
      params.push(`%${filtros.fornecedor}%`);
    }

    // Filtro de item
    if (filtros.item) {
      where.push("ie.descricao LIKE ?");
      params.push(`%${filtros.item}%`);
    }

    // Filtro de solicitante
    if (filtros.solicitante) {
      where.push("re.id_solicitante = ?");
      params.push(filtros.solicitante);
    }

    // Filtro de entrega direta
    if (filtros.entregaDireta !== undefined) {
      where.push("re.entrega_direta = ?");
      params.push(filtros.entregaDireta ? 1 : 0);
    }

    // Apenas requisições aprovadas
    where.push('re.status = "Aprovado"');

    return {
      where: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "",
      params,
    };
  }

  // Função auxiliar para agrupar por período
  private getAgrupamentoPeriodo(tipoPeriodo?: string): string {
    switch (tipoPeriodo) {
      case "dia":
        return "DATE(re.data_requisicao)";
      case "semana":
        return "YEARWEEK(re.data_requisicao, 1)";
      case "mes":
        return 'DATE_FORMAT(re.data_requisicao, "%Y-%m")';
      case "ano":
        return "YEAR(re.data_requisicao)";
      default:
        return 'DATE_FORMAT(re.data_requisicao, "%Y-%m")'; // Padrão: por mês
    }
  }

  // 1. Valor de compra X valor de venda
  async getValorCompraVenda(
    filtros: IFiltroRelatorioEstoque
  ): Promise<IValorCompraVenda[]> {
    const { where, params } = this.construirFiltros(filtros);
    const agrupamento = this.getAgrupamentoPeriodo(filtros.tipo_periodo);

    const query = `
            SELECT 
                ${agrupamento} as periodo,
                COALESCE(SUM(re.valor_custo_total), 0) as valorTotalCompra,
                COALESCE(SUM(re.valor_venda), 0) as valorTotalVenda,
                COALESCE(SUM(re.valor_venda) - SUM(re.valor_custo_total), 0) as margem,
                CASE 
                    WHEN SUM(re.valor_custo_total) > 0 
                    THEN ((SUM(re.valor_venda) - SUM(re.valor_custo_total)) / SUM(re.valor_custo_total)) * 100
                    ELSE 0 
                END as margemPercentual,
                COUNT(DISTINCT re.id) as quantidadeRequisicoes
            FROM requisicoes_estoque re
            ${where}
            GROUP BY ${agrupamento}
            ORDER BY periodo DESC
        `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);
    return rows as IValorCompraVenda[];
  }

  // 2. Valor de frete total
  async getValorFrete(
    filtros: IFiltroRelatorioEstoque
  ): Promise<IValorFrete[]> {
    const { where, params } = this.construirFiltros(filtros);
    const agrupamento = this.getAgrupamentoPeriodo(filtros.tipo_periodo);

    const query = `
            SELECT 
                ${agrupamento} as periodo,
                COALESCE(SUM(re.valor_frete), 0) as valorTotalFrete,
                COUNT(DISTINCT re.id) as quantidadeRequisicoes,
                COALESCE(AVG(re.valor_frete), 0) as mediaFretePorRequisicao
            FROM requisicoes_estoque re
            ${where}
            GROUP BY ${agrupamento}
            ORDER BY periodo DESC
        `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);
    return rows as IValorFrete[];
  }

  // 3. Quantidade de solicitações por solicitante e valores
  async getRequisicoesPorSolicitante(
    filtros: IFiltroRelatorioEstoque
  ): Promise<IRequisicaoPorSolicitante[]> {
    const { where, params } = this.construirFiltros(filtros);

    const query = `
            SELECT 
                CONCAT(f.nome, ' ', f.sobrenome) as solicitante,
                f.id as idSolicitante,
                COUNT(DISTINCT re.id) as quantidadeRequisicoes,
                COALESCE(SUM(re.valor_custo_total), 0) as valorBrutoGasto,
                COALESCE(SUM(re.valor_venda), 0) as valorVendido,
                COALESCE(SUM(re.valor_venda) - SUM(re.valor_custo_total), 0) as margem
            FROM requisicoes_estoque re
            INNER JOIN Funcionarios f ON re.id_solicitante = f.id
            ${where}
            GROUP BY f.id, f.nome, f.sobrenome
            ORDER BY quantidadeRequisicoes DESC, valorBrutoGasto DESC
        `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);
    return rows as IRequisicaoPorSolicitante[];
  }

  // 4. Quantidade de entregas diretas por item ou data
  async getEntregasDiretas(
    filtros: IFiltroRelatorioEstoque
  ): Promise<IEntregaDireta[]> {
    const { where, params } = this.construirFiltros({
      ...filtros,
      entregaDireta: true,
    });
    const agrupamento = this.getAgrupamentoPeriodo(filtros.tipo_periodo);

    const query = `
            SELECT 
                ${agrupamento} as periodo,
                COUNT(DISTINCT re.id) as quantidadeEntregas,
                COALESCE(SUM(re.valor_custo_total), 0) as valorTotal
            FROM requisicoes_estoque re
            ${where}
            GROUP BY ${agrupamento}
            ORDER BY periodo DESC
        `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);
    return rows as IEntregaDireta[];
  }

  // 6. Resumo geral
  async getResumoGeral(
    filtros: IFiltroRelatorioEstoque
  ): Promise<IResumoGeral> {
    const { where, params } = this.construirFiltros(filtros);

    // Totais gerais
    const queryTotais = `
            SELECT 
                COUNT(DISTINCT re.id) as requisicoes,
                COALESCE(SUM(re.valor_custo_total), 0) as valorCompra,
                COALESCE(SUM(re.valor_venda), 0) as valorVenda,
                COALESCE(SUM(re.valor_frete), 0) as valorFrete,
                COALESCE(SUM(re.valor_venda) - SUM(re.valor_custo_total), 0) as margem,
                SUM(CASE WHEN re.entrega_direta = 1 THEN 1 ELSE 0 END) as entregasDiretas
            FROM requisicoes_estoque re
            ${where}
        `;

    const [totaisRows] = await this.pool.execute<RowDataPacket[]>(
      queryTotais,
      params
    );
    const totais = totaisRows[0];

    // Top 10 solicitantes
    const topSolicitantes = await this.getRequisicoesPorSolicitante(filtros);

    return {
      periodo: {
        inicio: filtros.dataInicio,
        fim: filtros.dataFim,
      },
      totais: {
        requisicoes: totais.requisicoes || 0,
        valorCompra: parseFloat(totais.valorCompra) || 0,
        valorVenda: parseFloat(totais.valorVenda) || 0,
        valorFrete: parseFloat(totais.valorFrete) || 0,
        margem: parseFloat(totais.margem) || 0,
        entregasDiretas: totais.entregasDiretas || 0,
      },
      topSolicitantes: topSolicitantes.slice(0, 10),
      topItens: [],
    };
  }

  // 7. Buscar todas as requisições detalhadas
  async getTodasRequisicoes(
    filtros: IFiltroRelatorioEstoque
  ): Promise<IRequisicaoEstoqueDetalhada[]> {
    const { where, params } = this.construirFiltros(filtros);

    // Substituir alias re. por r. e ie. por i. (todas as ocorrências)
    const whereAdaptado = where.replace(/re\./g, "r.").replace(/ie\./g, "i.");

    const query = `
            SELECT 
                r.id,
                r.fornecedor,
                r.valor_custo_total,  
                r.cliente_venda,
                r.cod_cliente,
                r.valor_venda,
                DATE_FORMAT(r.data_requisicao, '%d/%m/%Y') AS data_requisicao, 
                DATE_FORMAT(r.data_aprovacao, '%d/%m/%Y') AS data_aprovacao,
                CONCAT(solicitante.nome, ' ', solicitante.sobrenome) AS nome_solicitante,
                CONCAT(aprovador.nome, ' ', aprovador.sobrenome) AS nome_aprovador,
                r.status, 
                r.impresso,
                r.entrega_direta,
                r.valor_frete
            FROM requisicoes_estoque r
            LEFT JOIN itens_estoque i ON i.id_requisicao = r.id
            LEFT JOIN Funcionarios solicitante ON r.id_solicitante = solicitante.id
            LEFT JOIN Funcionarios aprovador ON r.id_aprovador = aprovador.id
            ${whereAdaptado}
            GROUP BY r.id
            ORDER BY r.data_requisicao DESC, r.id DESC
        `;

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);
    return rows as IRequisicaoEstoqueDetalhada[];
  }

  // 8. Buscar dados para múltiplos relatórios (para geração de PDF)
  async getDadosParaPDF(
    relatorios: string[],
    filtros: IFiltroRelatorioEstoque
  ): Promise<IDadosRelatoriosPDF> {
    const dados: IDadosRelatoriosPDF = {};

    // Buscar dados para cada relatório solicitado
    for (const relatorio of relatorios) {
      switch (relatorio) {
        case "valorCompraVenda":
          dados.valorCompraVenda = await this.getValorCompraVenda(filtros);
          break;
        case "valorFrete":
          dados.valorFrete = await this.getValorFrete(filtros);
          break;
        case "porSolicitante":
          dados.porSolicitante = await this.getRequisicoesPorSolicitante(
            filtros
          );
          break;
        case "entregasDiretas":
          dados.entregasDiretas = await this.getEntregasDiretas(filtros);
          break;
        case "resumoGeral":
          dados.resumoGeral = await this.getResumoGeral(filtros);
          break;
        case "todas":
          dados.todas = await this.getTodasRequisicoes(filtros);
          break;
      }
    }

    return dados;
  }
}

export default new RelatorioEstoqueService();
