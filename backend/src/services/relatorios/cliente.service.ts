import pool from "../../config/db";
import {
  IFiltroRelatorioCliente,
  IRequisicaoClienteDetalhada,
  IDadosRelatoriosClientePDF,
} from "../../interfaces/relatorios/cliente.interface";

class RelatorioClienteService {
  // Helper para construir WHERE clause baseado nos filtros
  private construirWhereClause(filtros: IFiltroRelatorioCliente): {
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

    return {
      where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  // Todas as Requisições de Cliente
  async getTodasRequisicoes(
    filtros: IFiltroRelatorioCliente
  ): Promise<IRequisicaoClienteDetalhada[]> {
    const { where, params } = this.construirWhereClause(filtros);

    const query = `
      SELECT 
        c.id,
        c.descricao,
        c.valor,
        DATE_FORMAT(c.data_solicitacao, '%d/%m/%Y %H:%i') as data_solicitacao,
        DATE_FORMAT(c.data_aprovacao, '%d/%m/%Y %H:%i') as data_aprovacao,
        c.status,
        CONCAT(fs.nome, ' ', fs.sobrenome) as nome_solicitante,
        CONCAT(fa.nome, ' ', fa.sobrenome) as nome_aprovador,
        c.impresso
      FROM cliente_request c
      INNER JOIN Funcionarios fs ON c.id_solicitante = fs.id
      LEFT JOIN Funcionarios fa ON c.id_aprovador = fa.id
      ${where}
      ORDER BY c.data_aprovacao DESC
      LIMIT 500
    `;

    const [rows] = await pool.query<IRequisicaoClienteDetalhada[]>(
      query,
      params
    );
    return rows;
  }

  // Função agregadora para buscar dados para PDF
  async getDadosParaPDF(
    filtros: IFiltroRelatorioCliente
  ): Promise<IDadosRelatoriosClientePDF> {
    const todas = await this.getTodasRequisicoes(filtros);
    return { todas };
  }
}

export default new RelatorioClienteService();
