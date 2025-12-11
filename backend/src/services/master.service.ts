import { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "../config/db";
import { NotificationService } from "./notification/NotificationService";
import { createRequestRelation } from "./hash.service";
import { Ihash } from "../interfaces/hash.interface";
import despesasService from "./despesas.service";
import * as combustivelEstoqueService from "./combustivel-estoque.service";
import * as frotaCombustivelService from "./frotaCombustivel.service";
import * as estoqueService from "./estoque.service";
import * as clienteService from "./cliente.service";

/**
 * MasterService - Serviço para usuários com permissão Master
 *
 * Permite que usuários com flag master = 1 possam:
 * - Aprovar requisições em qualquer estágio
 * - Sobrescrever aprovadores originais
 * - Forçar aprovações pendentes
 */
export class MasterService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * ========================================================================
   * MÓDULO: DESPESAS
   * ========================================================================
   */

  /**
   * OPÇÃO A: Master "assina por todos" os gerentes faltantes
   *
   * Cenário: 5 gerentes, 2 já aprovaram, Master vai completar
   * Resultado: 6 aprovadores (2 originais + Master + 3 "forçados" por Master)
   *
   * @param id_requisicao - ID da requisição de despesa
   * @param id_cota - ID da cota escolhida para aprovação
   * @param id_master - ID do usuário Master
   */
  public async aprovarDespesasComoGerente(
    id_requisicao: number,
    id_cota: number,
    id_master: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, descricao, status, id_solicitante, id_aprovador_diretor 
         FROM requisicoes 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição não encontrada.");
      }

      if (requisicao[0].status === "Aprovada") {
        throw new Error("Requisição já foi totalmente aprovada.");
      }

      if (requisicao[0].status === "Reprovada") {
        throw new Error("Requisição já foi reprovada.");
      }

      // 2. Verificar se a cota existe e pertence à requisição
      const [cota] = await connection.query<RowDataPacket[]>(
        `SELECT id, status, aprovado_por_gerente, aprovado_por_diretor 
         FROM cotas 
         WHERE id = ? AND id_requisicao = ?`,
        [id_cota, id_requisicao]
      );

      if (!cota.length) {
        throw new Error(
          "Cota não encontrada ou não pertence a esta requisição."
        );
      }

      if (cota[0].aprovado_por_gerente) {
        throw new Error("Esta cota já foi aprovada por todos os gerentes.");
      }

      // 3. Buscar TODOS os gerentes vinculados à requisição
      const [gerentesVinculados] = await connection.query<RowDataPacket[]>(
        `SELECT id_gerente 
         FROM requisicoes_gerente 
         WHERE id_requisicao = ?`,
        [id_requisicao]
      );

      if (!gerentesVinculados.length) {
        throw new Error("Nenhum gerente vinculado a esta requisição.");
      }

      const idsGerentes = gerentesVinculados.map((g) => g.id_gerente);

      // 4. Buscar gerentes que JÁ APROVARAM
      const [gerentesQueAprovaram] = await connection.query<RowDataPacket[]>(
        `SELECT id_gerente, id_cota 
         FROM aprovacao_gerente 
         WHERE id_requisicao = ?`,
        [id_requisicao]
      );

      // Validar se todos aprovaram a MESMA cota
      if (gerentesQueAprovaram.length > 0) {
        const cotaPrimeiroGerente = gerentesQueAprovaram[0].id_cota;
        const todosAprovamMesmaCota = gerentesQueAprovaram.every(
          (g) => g.id_cota === cotaPrimeiroGerente
        );

        if (!todosAprovamMesmaCota) {
          throw new Error(
            "Inconsistência: Gerentes aprovaram cotas diferentes. Não é possível prosseguir."
          );
        }

        // Master deve aprovar a MESMA cota que os gerentes já aprovaram
        if (cotaPrimeiroGerente !== id_cota) {
          throw new Error(
            `Os gerentes já aprovaram a cota ${cotaPrimeiroGerente}. Master deve aprovar a mesma cota.`
          );
        }
      }

      const idsGerentesQueAprovaram = gerentesQueAprovaram.map(
        (g) => g.id_gerente
      );

      // 5. Identificar gerentes FALTANTES
      const gerentesFaltantes = idsGerentes.filter(
        (id) => !idsGerentesQueAprovaram.includes(id)
      );

      // 6. Verificar se Master já está vinculado à requisição
      const masterJaVinculado = idsGerentes.includes(id_master);

      // NÃO adicionar Master em requisicoes_gerente se ele não estava lá originalmente
      // Isso permite detectar que ele é Master no frontend
      // if (!masterJaVinculado) {
      //   await connection.query(
      //     `INSERT INTO requisicoes_gerente (id_requisicao, id_gerente)
      //      VALUES (?, ?)`,
      //     [id_requisicao, id_master]
      //   );
      // }

      // 7. Master aprova a cota em nome próprio (se ainda não aprovou)
      const masterJaAprovou = idsGerentesQueAprovaram.includes(id_master);

      if (!masterJaAprovou) {
        await connection.query(
          `INSERT INTO aprovacao_gerente (id_requisicao, id_gerente, id_cota, aprovado, aprovado_via_master)
           VALUES (?, ?, ?, TRUE, TRUE)`,
          [id_requisicao, id_master, id_cota]
        );
      }

      // 8. OPÇÃO A: Master "assina" pelas aprovações dos gerentes faltantes
      if (gerentesFaltantes.length > 0) {
        const valuesGerentesFaltantes = gerentesFaltantes
          .filter((id) => id !== id_master) // Evitar duplicar Master
          .map((id_gerente) => [
            id_requisicao,
            id_gerente,
            id_cota,
            true,
            true,
          ]); // Marca como aprovado_via_master

        if (valuesGerentesFaltantes.length > 0) {
          await connection.query(
            `INSERT INTO aprovacao_gerente (id_requisicao, id_gerente, id_cota, aprovado, aprovado_via_master)
             VALUES ?`,
            [valuesGerentesFaltantes]
          );
        }
      }

      // 9. Atualizar status da cota escolhida e rejeitar as outras
      await connection.query(
        `UPDATE cotas 
         SET status = 'Aprovada', 
             aprovado_por_gerente = TRUE 
         WHERE id = ?`,
        [id_cota]
      );

      await connection.query(
        `UPDATE cotas 
         SET status = 'Rejeitada' 
         WHERE id_requisicao = ? AND id != ?`,
        [id_requisicao, id_cota]
      );

      // 10. Notificar o diretor que todos os gerentes "aprovaram"
      const nomeSolicitante = await this.buscarNomeSolicitante(
        requisicao[0].id_solicitante,
        connection
      );

      const [diretor] = await connection.query<RowDataPacket[]>(
        `SELECT id, nome, mail, aut_wpp, telefone 
         FROM Funcionarios 
         WHERE id = ?`,
        [requisicao[0].id_aprovador_diretor]
      );

      if (diretor.length > 0 && diretor[0].mail) {
        await this.notificationService.notify({
          recipients: [diretor[0]],
          template: "NEW_REQUEST_APROVADOR",
          data: {
            id_requisicao: id_requisicao.toString(),
            descricao: requisicao[0].descricao,
            solicitante: nomeSolicitante,
            data_solicitacao: new Date().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            }),
            departamentos: "",
            fornecedores:
              "✅ Todos os gerentes aprovaram (via Master). Aguardando sua aprovação.",
          },
          module: "DESPESAS",
          link: `https://smartcompras.francautolabs.com.br/despesas/solicitacoes?modal=detalhes&id=${id_requisicao}`,
        });
      }

      await connection.commit();

      return {
        message: "Requisição aprovada com sucesso pelo Master como Gerente.",
        detalhes: {
          gerentes_originais: idsGerentes.length,
          gerentes_que_aprovaram_antes: idsGerentesQueAprovaram.length,
          gerentes_aprovados_pelo_master: gerentesFaltantes.length,
          master_adicionado_como_gerente: !masterJaVinculado,
          total_aprovadores_final:
            idsGerentes.length + (masterJaVinculado ? 0 : 1),
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao aprovar despesas como Gerente (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Master aprova como DIRETOR (sobrescreve o diretor original)
   *
   * @param id_requisicao - ID da requisição de despesa
   * @param id_cota - ID da cota escolhida para aprovação
   * @param id_master - ID do usuário Master
   */
  public async aprovarDespesasComoDiretor(
    id_requisicao: number,
    id_cota: number,
    id_master: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a cota existe e foi aprovada pelos gerentes
      const [cota] = await connection.query<RowDataPacket[]>(
        `SELECT id, aprovado_por_gerente, aprovado_por_diretor, status 
         FROM cotas 
         WHERE id = ? AND id_requisicao = ?`,
        [id_cota, id_requisicao]
      );

      if (!cota.length) {
        throw new Error(
          "Cota não encontrada ou não pertence a esta requisição."
        );
      }

      if (cota[0].aprovado_por_diretor) {
        throw new Error("Esta cota já foi aprovada pelo diretor.");
      }

      if (!cota[0].aprovado_por_gerente || cota[0].status !== "Aprovada") {
        throw new Error(
          "Esta cota ainda não foi aprovada por todos os gerentes. Use a rota de aprovação como Gerente primeiro."
        );
      }

      // 2. Verificar a requisição
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, aprovado_diretor, status, id_aprovador_diretor 
         FROM requisicoes 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição não encontrada.");
      }

      if (requisicao[0].aprovado_diretor) {
        throw new Error("Esta requisição já foi aprovada pelo diretor.");
      }

      const diretorOriginal = requisicao[0].id_aprovador_diretor;

      // 3. Master SOBRESCREVE o diretor e aprova
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
        [id_cota, id_master, id_requisicao]
      );

      // 4. Calcular rateio (usa método do DespesasService)
      await despesasService.calcularRateioDespesas(
        id_requisicao,
        id_cota,
        connection
      );

      // 5. Criar hash de relação
      const payload_relation: Ihash = {
        id_requisicao: id_requisicao,
        tabela: "requisicoes_id",
      };
      await createRequestRelation(payload_relation, connection);

      await connection.commit();

      return {
        message: "Requisição aprovada com sucesso pelo Master como Diretor.",
        detalhes: {
          diretor_original: diretorOriginal,
          diretor_sobrescrito_por_master: id_master,
          cota_aprovada: id_cota,
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao aprovar despesas como Diretor (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Master RECUSA requisição (gerentes + diretor de uma vez)
   *
   * Recusa total: marca todas as cotas como rejeitadas e a requisição como reprovada
   * Funciona em qualquer estágio (aguardando gerentes OU aguardando diretor)
   *
   * @param id_requisicao - ID da requisição de despesa
   * @param id_master - ID do usuário Master
   * @param motivo - Motivo da recusa (opcional)
   */
  public async recusarDespesas(
    id_requisicao: number,
    id_master: number,
    motivo?: string
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, status, descricao, id_solicitante 
         FROM requisicoes 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição não encontrada.");
      }

      if (requisicao[0].status === "Aprovada") {
        throw new Error("Não é possível recusar uma requisição já aprovada.");
      }

      if (requisicao[0].status === "Reprovada") {
        throw new Error("Esta requisição já foi reprovada.");
      }

      // 2. Rejeitar TODAS as cotas vinculadas à requisição
      await connection.query(
        `UPDATE cotas 
         SET status = 'Rejeitada' 
         WHERE id_requisicao = ?`,
        [id_requisicao]
      );

      // 3. Marcar requisição como Reprovada
      const motivoFinal = motivo || "Recusado pelo Master";

      await connection.query(
        `UPDATE requisicoes 
         SET status = 'Reprovada',
             usuario_recusador = ?,
             data_recusa = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      // 4. Notificar o solicitante
      const nomeSolicitante = await this.buscarNomeSolicitante(
        requisicao[0].id_solicitante,
        connection
      );

      const [solicitante] = await connection.query<RowDataPacket[]>(
        `SELECT id, nome, mail, aut_wpp, telefone 
         FROM Funcionarios 
         WHERE id = ?`,
        [requisicao[0].id_solicitante]
      );

      if (solicitante.length > 0 && solicitante[0].mail) {
        await this.notificationService.notify({
          recipients: [solicitante[0]],
          template: "REQUEST_REJECTED",
          data: {
            id_requisicao: id_requisicao.toString(),
            descricao: requisicao[0].descricao,
            motivo: motivoFinal,
            recusado_por: "Master",
            data_recusa: new Date().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            }),
          },
          module: "DESPESAS",
          link: `https://smartcompras.francautolabs.com.br/despesas/solicitacoes?modal=detalhes&id=${id_requisicao}`,
        });
      }

      await connection.commit();

      return {
        message: "Requisição recusada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          motivo: motivoFinal,
          cotas_rejeitadas: "Todas",
          niveis_afetados: ["Gerentes", "Diretor"],
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao recusar despesas (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ========================================================================
   * MÓDULO: COMBUSTÍVEL FROTA
   * ========================================================================
   */

  /**
   * Master aprova requisição de combustível frota
   *
   * ⚠️ VALIDAÇÃO OBRIGATÓRIA: BestDrive deve ter aprovado ANTES
   *
   * Fluxo:
   * 1. Solicitação criada → Status "Pendente"
   * 2. BestDrive aprova (controlador de chaves) → best_drive_res = TRUE
   * 3. 🎯 Master pode atuar AQUI → Sobrescreve aprovador e aprova
   * 4. Status → "Aprovado" → Aguardando cupom
   *
   * @param id_requisicao - ID da requisição de combustível
   * @param id_master - ID do usuário Master
   */
  public async aprovarCombustivelFrota(
    id_requisicao: number,
    id_master: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe e buscar dados
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT 
          id, 
          status, 
          best_drive_res, 
          status_res_bestdrive,
          id_aprovador,
          id_solicitante,
          veiculo_id,
          km_veiculo,
          quantidade_litros
         FROM combustivel_request 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição de combustível não encontrada.");
      }

      const req = requisicao[0];

      // 2. Validar status
      if (req.status === "Aprovado") {
        throw new Error("Requisição já foi aprovada.");
      }

      if (req.status === "Reprovado") {
        throw new Error("Requisição já foi reprovada.");
      }

      if (req.status !== "Pendente") {
        throw new Error(
          `Requisição está no status "${req.status}" e não pode ser aprovada.`
        );
      }

      // 3. ⚠️ VALIDAÇÃO CRÍTICA: BestDrive DEVE ter aprovado
      if (!req.best_drive_res) {
        throw new Error(
          "BestDrive ainda não respondeu. Aguarde a resposta do controlador de chaves."
        );
      }

      if (req.status_res_bestdrive !== "aprovado") {
        throw new Error(
          "BestDrive rejeitou esta solicitação. Não é possível aprovar."
        );
      }

      // 4. Master SOBRESCREVE o aprovador e aprova
      await connection.query(
        `UPDATE combustivel_request 
         SET id_aprovador = ?,
             aprovado = TRUE,
             status = 'Aprovado',
             data_aprovacao = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      // 5. Criar hash de relação
      const payload_relation: Ihash = {
        id_requisicao: id_requisicao,
        tabela: "combustivel_request_id",
      };
      await createRequestRelation(payload_relation, connection);

      await connection.commit();

      return {
        message: "Requisição de combustível aprovada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          aprovador_original: req.id_aprovador,
          aprovador_sobrescrito_por_master: id_master,
          proximo_status: "Aguardando Cupom",
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao aprovar combustível frota (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Master recusa requisição de combustível frota
   *
   * ⚠️ VALIDAÇÃO OBRIGATÓRIA: BestDrive deve ter aprovado ANTES
   *
   * Mesmo que BestDrive tenha aprovado, Master pode recusar
   * (Ex: motivo administrativo, orçamento, etc.)
   *
   * @param id_requisicao - ID da requisição de combustível
   * @param id_master - ID do usuário Master
   * @param motivo - Motivo da recusa (opcional)
   */
  public async recusarCombustivelFrota(
    id_requisicao: number,
    id_master: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT 
          id, 
          status, 
          best_drive_res, 
          status_res_bestdrive,
          id_aprovador,
          id_solicitante
         FROM combustivel_request 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição de combustível não encontrada.");
      }

      const req = requisicao[0];

      // 2. Validar status
      if (req.status === "Aprovado") {
        throw new Error("Não é possível recusar uma requisição já aprovada.");
      }

      if (req.status === "Reprovado") {
        throw new Error("Requisição já foi reprovada.");
      }

      if (req.status !== "Pendente") {
        throw new Error(
          `Requisição está no status "${req.status}" e não pode ser recusada.`
        );
      }

      // 3. ⚠️ VALIDAÇÃO CRÍTICA: BestDrive DEVE ter aprovado
      if (!req.best_drive_res) {
        throw new Error(
          "BestDrive ainda não respondeu. Aguarde a resposta do controlador de chaves."
        );
      }

      if (req.status_res_bestdrive !== "aprovado") {
        throw new Error(
          "BestDrive já rejeitou esta solicitação. Use o status atual."
        );
      }

      // 4. Master SOBRESCREVE o aprovador e reprova
      await connection.query(
        `UPDATE combustivel_request 
         SET id_aprovador = ?,
             aprovado = FALSE,
             status = 'Reprovado',
             data_aprovacao = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      // 5. Notificar solicitante (opcional)
      const [solicitante] = await connection.query<RowDataPacket[]>(
        `SELECT id, nome, mail, aut_wpp, telefone 
         FROM Funcionarios 
         WHERE id = ?`,
        [req.id_solicitante]
      );

      if (solicitante.length > 0 && solicitante[0].mail) {
        await this.notificationService.notify({
          recipients: [solicitante[0]],
          template: "REQUEST_REJECTED",
          data: {
            id_requisicao: id_requisicao.toString(),
            descricao: "Requisição de Combustível Frota",
            motivo: "Recusado pelo Master",
            recusado_por: "Master",
            data_recusa: new Date().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            }),
          },
          module: "COMBUSTIVEL",
          link: `https://smartcompras.francautolabs.com.br/combustivel-frota/solicitacoes?modal=detalhes&id=${id_requisicao}`,
        });
      }

      await connection.commit();

      return {
        message: "Requisição de combustível recusada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          aprovador_original: req.id_aprovador,
          aprovador_sobrescrito_por_master: id_master,
          bestdrive_havia_aprovado: true,
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao recusar combustível frota (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ========================================================================
   * MÓDULO: COMBUSTÍVEL ESTOQUE
   * ========================================================================
   */

  /**
   * Master aprova requisição de combustível estoque
   *
   * Módulo simples: 1 aprovador, sem validações externas
   *
   * @param id_requisicao - ID da requisição de combustível estoque
   * @param id_master - ID do usuário Master
   */
  public async aprovarCombustivelEstoque(
    id_requisicao: number,
    id_master: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, status, id_aprovador, id_solicitante
         FROM combustivel_request_estoque 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição de combustível estoque não encontrada.");
      }

      const req = requisicao[0];

      // 2. Validar status
      if (req.status === "Aprovado") {
        throw new Error("Requisição já foi aprovada.");
      }

      if (req.status === "Reprovado") {
        throw new Error("Requisição já foi reprovada.");
      }

      if (req.status !== "Pendente") {
        throw new Error(
          `Requisição está no status "${req.status}" e não pode ser aprovada.`
        );
      }

      // 3. Master SOBRESCREVE o aprovador e aprova
      await connection.query(
        `UPDATE combustivel_request_estoque 
         SET id_aprovador = ?,
             aprovado = TRUE,
             status = 'Aprovado',
             data_aprovacao = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      // 4. Criar hash de relação
      const payload_relation: Ihash = {
        id_requisicao: id_requisicao,
        tabela: "combustivel_request_estoque_id",
      };
      await createRequestRelation(payload_relation, connection);

      await connection.commit();

      return {
        message:
          "Requisição de combustível estoque aprovada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          aprovador_original: req.id_aprovador,
          aprovador_sobrescrito_por_master: id_master,
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao aprovar combustível estoque (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Master recusa requisição de combustível estoque
   *
   * @param id_requisicao - ID da requisição de combustível estoque
   * @param id_master - ID do usuário Master
   * @param motivo - Motivo da recusa (opcional)
   */
  public async recusarCombustivelEstoque(
    id_requisicao: number,
    id_master: number
  ) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, status, id_aprovador, id_solicitante
         FROM combustivel_request_estoque 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição de combustível estoque não encontrada.");
      }

      const req = requisicao[0];

      // 2. Validar status
      if (req.status === "Aprovado") {
        throw new Error("Não é possível recusar uma requisição já aprovada.");
      }

      if (req.status === "Reprovado") {
        throw new Error("Requisição já foi reprovada.");
      }

      if (req.status !== "Pendente") {
        throw new Error(
          `Requisição está no status "${req.status}" e não pode ser recusada.`
        );
      }

      // 3. Master SOBRESCREVE o aprovador e reprova
      await connection.query(
        `UPDATE combustivel_request_estoque 
         SET id_aprovador = ?,
             aprovado = FALSE,
             status = 'Reprovado',
             data_aprovacao = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      await connection.commit();

      return {
        message:
          "Requisição de combustível estoque recusada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          aprovador_original: req.id_aprovador,
          aprovador_sobrescrito_por_master: id_master,
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao recusar combustível estoque (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ========================================================================
   * MÓDULO: ESTOQUE
   * ========================================================================
   */

  /**
   * Master aprova requisição de estoque
   *
   * Módulo simples: 1 aprovador, sem validações externas
   * ⚠️ Nota: Tabela NÃO tem campo "aprovado", apenas status
   *
   * @param id_requisicao - ID da requisição de estoque
   * @param id_master - ID do usuário Master
   */
  public async aprovarEstoque(id_requisicao: number, id_master: number) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, status, id_aprovador, id_solicitante
         FROM requisicoes_estoque 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição de estoque não encontrada.");
      }

      const req = requisicao[0];

      // 2. Validar status
      if (req.status === "Aprovado") {
        throw new Error("Requisição já foi aprovada.");
      }

      if (req.status === "Reprovado") {
        throw new Error("Requisição já foi reprovada.");
      }

      if (req.status !== "Pendente") {
        throw new Error(
          `Requisição está no status "${req.status}" e não pode ser aprovada.`
        );
      }

      // 3. Master SOBRESCREVE o aprovador e aprova
      // ⚠️ Tabela não tem campo "aprovado", apenas status
      await connection.query(
        `UPDATE requisicoes_estoque 
         SET id_aprovador = ?,
             status = 'Aprovado',
             data_aprovacao = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      // 4. Criar hash de relação
      const payload_relation: Ihash = {
        id_requisicao: id_requisicao,
        tabela: "requisicoes_estoque_id",
      };
      await createRequestRelation(payload_relation, connection);

      await connection.commit();

      return {
        message: "Requisição de estoque aprovada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          aprovador_original: req.id_aprovador,
          aprovador_sobrescrito_por_master: id_master,
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao aprovar estoque (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Master recusa requisição de estoque
   *
   * @param id_requisicao - ID da requisição de estoque
   * @param id_master - ID do usuário Master
   * @param motivo - Motivo da recusa (opcional)
   */
  public async recusarEstoque(id_requisicao: number, id_master: number) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, status, id_aprovador, id_solicitante
         FROM requisicoes_estoque 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição de estoque não encontrada.");
      }

      const req = requisicao[0];

      // 2. Validar status
      if (req.status === "Aprovado") {
        throw new Error("Não é possível recusar uma requisição já aprovada.");
      }

      if (req.status === "Reprovado") {
        throw new Error("Requisição já foi reprovada.");
      }

      if (req.status !== "Pendente") {
        throw new Error(
          `Requisição está no status "${req.status}" e não pode ser recusada.`
        );
      }

      // 3. Master SOBRESCREVE o aprovador e reprova
      await connection.query(
        `UPDATE requisicoes_estoque 
         SET id_aprovador = ?,
             status = 'Reprovado',
             data_aprovacao = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      await connection.commit();

      return {
        message: "Requisição de estoque recusada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          aprovador_original: req.id_aprovador,
          aprovador_sobrescrito_por_master: id_master,
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao recusar estoque (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ========================================================================
   * MÓDULO: CLIENTE
   * ========================================================================
   */

  /**
   * Master aprova requisição de cliente
   *
   * Módulo simples: 1 aprovador, sem validações externas
   * ⚠️ Nota: Tabela NÃO tem campo "aprovado", apenas status
   *
   * @param id_requisicao - ID da requisição de cliente
   * @param id_master - ID do usuário Master
   */
  public async aprovarCliente(id_requisicao: number, id_master: number) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, status, id_aprovador, id_solicitante
         FROM cliente_request 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição de cliente não encontrada.");
      }

      const req = requisicao[0];

      // 2. Validar status
      if (req.status === "Aprovado") {
        throw new Error("Requisição já foi aprovada.");
      }

      if (req.status === "Reprovado") {
        throw new Error("Requisição já foi reprovada.");
      }

      if (req.status !== "Pendente") {
        throw new Error(
          `Requisição está no status "${req.status}" e não pode ser aprovada.`
        );
      }

      // 3. Master SOBRESCREVE o aprovador e aprova
      // ⚠️ Tabela não tem campo "aprovado", apenas status
      await connection.query(
        `UPDATE cliente_request 
         SET id_aprovador = ?,
             status = 'Aprovado',
             data_aprovacao = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      // 4. Criar hash de relação
      const payload_relation: Ihash = {
        id_requisicao: id_requisicao,
        tabela: "cliente_request_id",
      };
      await createRequestRelation(payload_relation, connection);

      await connection.commit();

      return {
        message: "Requisição de cliente aprovada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          aprovador_original: req.id_aprovador,
          aprovador_sobrescrito_por_master: id_master,
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao aprovar cliente (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Master recusa requisição de cliente
   *
   * @param id_requisicao - ID da requisição de cliente
   * @param id_master - ID do usuário Master
   * @param motivo - Motivo da recusa (opcional)
   */
  public async recusarCliente(id_requisicao: number, id_master: number) {
    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verificar se a requisição existe
      const [requisicao] = await connection.query<RowDataPacket[]>(
        `SELECT id, status, id_aprovador, id_solicitante
         FROM cliente_request 
         WHERE id = ?`,
        [id_requisicao]
      );

      if (!requisicao.length) {
        throw new Error("Requisição de cliente não encontrada.");
      }

      const req = requisicao[0];

      // 2. Validar status
      if (req.status === "Aprovado") {
        throw new Error("Não é possível recusar uma requisição já aprovada.");
      }

      if (req.status === "Reprovado") {
        throw new Error("Requisição já foi reprovada.");
      }

      if (req.status !== "Pendente") {
        throw new Error(
          `Requisição está no status "${req.status}" e não pode ser recusada.`
        );
      }

      // 3. Master SOBRESCREVE o aprovador e reprova
      await connection.query(
        `UPDATE cliente_request 
         SET id_aprovador = ?,
             status = 'Reprovado',
             data_aprovacao = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_master, id_requisicao]
      );

      await connection.commit();

      return {
        message: "Requisição de cliente recusada com sucesso pelo Master.",
        detalhes: {
          id_requisicao,
          aprovador_original: req.id_aprovador,
          aprovador_sobrescrito_por_master: id_master,
        },
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Erro ao recusar cliente (Master):", error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ========================================================================
   * MÉTODOS AUXILIARES
   * ========================================================================
   */

  /**
   * Buscar nome do solicitante
   */
  private async buscarNomeSolicitante(
    id_solicitante: number,
    connection: PoolConnection
  ): Promise<string> {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT nome FROM Funcionarios WHERE id = ?",
      [id_solicitante]
    );
    return rows[0]?.nome || "Nome não encontrado";
  }

  /**
   * ========================================================================
   * CONSULTAS (GET)
   * ========================================================================
   */

  /**
   * Listar requisições de um módulo específico
   *
   * Delega para o serviço correspondente do módulo
   * Master vê TODAS as requisições (não filtradas por id_aprovador)
   *
   * @param modulo - Nome do módulo
   * @param page - Página atual
   * @param pageSize - Itens por página
   * @param filtros - Filtros de busca (search, status, dataInicio)
   */
  public async listarRequisicoesPorModulo(
    modulo: string,
    page: number,
    pageSize: number,
    filtros: {
      search?: string;
      status?: string;
      dataInicio?: string;
    }
  ) {
    const moduloNormalizado = modulo.toLowerCase();

    try {
      switch (moduloNormalizado) {
        case "despesas":
          // Para despesas, precisamos buscar TODAS (não por aprovador específico)
          // Vamos criar uma query customizada aqui
          return await this.listarTodasDespesas(page, pageSize, filtros);

        case "combustivel-frota":
        case "frota":
          // Frota não tem método genérico, vamos criar uma query customizada
          return await this.listarTodasFrota(page, pageSize, filtros);

        case "combustivel-estoque":
          // Combustível Estoque não tem filtro por aprovador, podemos usar direto
          return await this.listarTodasCombustivelEstoque(
            page,
            pageSize,
            filtros
          );

        case "estoque":
          // Estoque: vamos criar query customizada
          return await this.listarTodasEstoque(page, pageSize, filtros);

        case "cliente":
        case "clientes":
          // Cliente: vamos criar query customizada
          return await this.listarTodasCliente(page, pageSize, filtros);

        default:
          throw new Error(`Módulo '${modulo}' não reconhecido`);
      }
    } catch (error: any) {
      console.error(`Erro ao listar requisições do módulo ${modulo}:`, error);
      throw error;
    }
  }

  /**
   * Buscar requisição específica por ID e módulo
   *
   * Delega para o serviço correspondente do módulo
   *
   * @param modulo - Nome do módulo
   * @param id_requisicao - ID da requisição
   */
  public async buscarRequisicaoPorId(modulo: string, id_requisicao: number) {
    const moduloNormalizado = modulo.toLowerCase();

    try {
      switch (moduloNormalizado) {
        case "despesas":
          return await despesasService.getRequisicaoPorId(id_requisicao);

        case "combustivel-frota":
        case "frota":
          return await frotaCombustivelService.getSolicitacaoFrotaById(
            id_requisicao
          );

        case "combustivel-estoque":
          return await combustivelEstoqueService.getRequisicaoPorId(
            id_requisicao
          );

        case "estoque":
          return await estoqueService.getRequisicaoPorId(id_requisicao);

        case "cliente":
        case "clientes":
          return await clienteService.getRequisicaoPorId(id_requisicao);

        default:
          throw new Error(`Módulo '${modulo}' não reconhecido`);
      }
    } catch (error: any) {
      console.error(
        `Erro ao buscar requisição ${id_requisicao} do módulo ${modulo}:`,
        error
      );
      throw error;
    }
  }

  /**
   * ========================================================================
   * MÉTODOS AUXILIARES PARA LISTAGEM (Master vê TODAS as requisições)
   * ========================================================================
   */

  /**
   * Listar TODAS as despesas (Master não filtra por aprovador)
   */
  private async listarTodasDespesas(
    page: number,
    pageSize: number,
    filtros: { search?: string; status?: string; dataInicio?: string }
  ) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * pageSize;

      // Query base
      let queryBase = `
        FROM requisicoes r
        LEFT JOIN Funcionarios f ON r.id_solicitante = f.id
        WHERE 1=1
      `;

      const params: any[] = [];

      // Aplicar filtros
      if (filtros.search) {
        queryBase += ` AND (f.nome LIKE ? OR r.descricao LIKE ?)`;
        params.push(`%${filtros.search}%`, `%${filtros.search}%`);
      }

      if (filtros.status) {
        // Normalizar status para aceitar variações
        const statusNormalizado = filtros.status.toLowerCase();
        if (
          statusNormalizado.includes("aprovad") ||
          statusNormalizado.includes("aprovado")
        ) {
          queryBase += ` AND (r.status LIKE '%Aprovad%' OR r.status LIKE '%Aprovado%')`;
        } else if (
          statusNormalizado.includes("reprov") ||
          statusNormalizado.includes("rejeit") ||
          statusNormalizado.includes("recusad")
        ) {
          queryBase += ` AND (r.status LIKE '%Reprov%' OR r.status LIKE '%Rejeit%' OR r.status LIKE '%Recusad%')`;
        } else if (statusNormalizado.includes("pendent")) {
          queryBase += ` AND r.status LIKE '%Pendent%'`;
        } else {
          queryBase += ` AND r.status = ?`;
          params.push(filtros.status);
        }
      }

      if (filtros.dataInicio) {
        queryBase += ` AND DATE(r.data_requisicao) = ?`;
        params.push(filtros.dataInicio);
      }

      // Count total
      const [countResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total ${queryBase}`,
        params
      );
      const total = countResult[0].total;

      // Buscar dados paginados
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT 
          r.*,
          f.nome as nome_solicitante,
          f.cargo as cargo_solicitante
        ${queryBase}
        ORDER BY r.data_requisicao DESC
        LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      return {
        data: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Listar TODAS as requisições de combustível frota
   */
  private async listarTodasFrota(
    page: number,
    pageSize: number,
    filtros: { search?: string; status?: string; dataInicio?: string }
  ) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * pageSize;

      let queryBase = `
        FROM combustivel_request cr
        LEFT JOIN Funcionarios f ON cr.id_solicitante = f.id
        LEFT JOIN veiculos v ON cr.veiculo_id = v.id
        LEFT JOIN Departamentos d ON cr.id_departamento = d.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filtros.search) {
        queryBase += ` AND (f.nome LIKE ? OR v.placa LIKE ? OR v.modelo LIKE ? OR cr.tipo_combustivel LIKE ?)`;
        params.push(
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`
        );
      }

      if (filtros.status) {
        // Normalizar status para aceitar variações
        const statusNormalizado = filtros.status.toLowerCase();
        if (
          statusNormalizado.includes("aprovad") ||
          statusNormalizado.includes("aprovado")
        ) {
          queryBase += ` AND (cr.status LIKE '%Aprovad%' OR cr.status LIKE '%Aprovado%')`;
        } else if (
          statusNormalizado.includes("reprov") ||
          statusNormalizado.includes("rejeit") ||
          statusNormalizado.includes("recusad")
        ) {
          queryBase += ` AND (cr.status LIKE '%Reprov%' OR cr.status LIKE '%Rejeit%' OR cr.status LIKE '%Recusad%')`;
        } else if (statusNormalizado.includes("pendent")) {
          queryBase += ` AND cr.status LIKE '%Pendent%'`;
        } else if (statusNormalizado.includes("aguardando cupom")) {
          queryBase += ` AND cr.status = 'Aguardando Cupom'`;
        } else if (statusNormalizado.includes("finalizado")) {
          queryBase += ` AND cr.status = 'Finalizado'`;
        } else {
          queryBase += ` AND cr.status = ?`;
          params.push(filtros.status);
        }
      }

      if (filtros.dataInicio) {
        queryBase += ` AND DATE(cr.data_solicitacao) = ?`;
        params.push(filtros.dataInicio);
      }

      const [countResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total ${queryBase}`,
        params
      );
      const total = countResult[0].total;

      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT 
          cr.*,
          f.nome as nome_solicitante,
          f.cargo as cargo_solicitante,
          v.placa as veiculo_placa,
          v.modelo as veiculo_modelo,
          d.nome as departamento_nome,
          CASE 
            WHEN cr.tanque_cheio = 1 THEN CONCAT('Tanque Cheio (', cr.tipo_combustivel, ') - ', v.modelo, ' (', v.placa, ')')
            ELSE CONCAT(cr.quantidade_litros, 'L de ', cr.tipo_combustivel, ' - ', v.modelo, ' (', v.placa, ')')
          END as descricao,
          CASE
            WHEN cr.status = 'Pendente' AND (cr.best_drive_res IS NULL OR cr.best_drive_res = 0) THEN 'Aguardando controlador de chaves'
            ELSE cr.status
          END as status_display
        ${queryBase}
        ORDER BY cr.data_solicitacao DESC
        LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      return {
        data: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Listar TODAS as requisições de combustível estoque
   */
  private async listarTodasCombustivelEstoque(
    page: number,
    pageSize: number,
    filtros: { search?: string; status?: string; dataInicio?: string }
  ) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * pageSize;

      let queryBase = `
        FROM combustivel_request_estoque cre
        LEFT JOIN Funcionarios f ON cre.id_solicitante = f.id
        LEFT JOIN Departamentos d ON cre.id_departamento = d.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filtros.search) {
        queryBase += ` AND (f.nome LIKE ? OR cre.placa LIKE ? OR cre.modelo LIKE ? OR cre.marca LIKE ? OR cre.chassi LIKE ? OR cre.tipo_combustivel LIKE ?)`;
        params.push(
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`
        );
      }

      if (filtros.status) {
        // Normalizar status para aceitar variações
        const statusNormalizado = filtros.status.toLowerCase();
        if (
          statusNormalizado.includes("aprovad") ||
          statusNormalizado.includes("aprovado")
        ) {
          queryBase += ` AND (cre.status LIKE '%Aprovad%' OR cre.status LIKE '%Aprovado%')`;
        } else if (
          statusNormalizado.includes("reprov") ||
          statusNormalizado.includes("rejeit") ||
          statusNormalizado.includes("recusad")
        ) {
          queryBase += ` AND (cre.status LIKE '%Reprov%' OR cre.status LIKE '%Rejeit%' OR cre.status LIKE '%Recusad%')`;
        } else if (statusNormalizado.includes("pendent")) {
          queryBase += ` AND cre.status LIKE '%Pendent%'`;
        } else {
          queryBase += ` AND cre.status = ?`;
          params.push(filtros.status);
        }
      }

      if (filtros.dataInicio) {
        queryBase += ` AND DATE(cre.data_solicitacao) = ?`;
        params.push(filtros.dataInicio);
      }

      const [countResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total ${queryBase}`,
        params
      );
      const total = countResult[0].total;

      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT 
          cre.*,
          f.nome as nome_solicitante,
          f.cargo as cargo_solicitante,
          d.nome as departamento_nome,
          CONCAT(cre.quantidade_litros, 'L de ', cre.tipo_combustivel, ' - ', cre.modelo, ' ', cre.marca) as descricao
        ${queryBase}
        ORDER BY cre.data_solicitacao DESC
        LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      return {
        data: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Listar TODAS as requisições de estoque
   */
  private async listarTodasEstoque(
    page: number,
    pageSize: number,
    filtros: { search?: string; status?: string; dataInicio?: string }
  ) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * pageSize;

      let queryBase = `
        FROM requisicoes_estoque re
        LEFT JOIN Funcionarios f ON re.id_solicitante = f.id
        LEFT JOIN itens_estoque ie ON re.id = ie.id_requisicao
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filtros.search) {
        queryBase += ` AND (f.nome LIKE ? OR re.fornecedor LIKE ? OR ie.descricao LIKE ? OR re.cliente_venda LIKE ?)`;
        params.push(
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`
        );
      }

      if (filtros.status) {
        // Normalizar status para aceitar variações
        const statusNormalizado = filtros.status.toLowerCase();
        if (
          statusNormalizado.includes("aprovad") ||
          statusNormalizado.includes("aprovado")
        ) {
          queryBase += ` AND (re.status LIKE '%Aprovad%' OR re.status LIKE '%Aprovado%')`;
        } else if (
          statusNormalizado.includes("reprov") ||
          statusNormalizado.includes("rejeit") ||
          statusNormalizado.includes("recusad")
        ) {
          queryBase += ` AND (re.status LIKE '%Reprov%' OR re.status LIKE '%Rejeit%' OR re.status LIKE '%Recusad%')`;
        } else if (statusNormalizado.includes("pendent")) {
          queryBase += ` AND re.status LIKE '%Pendent%'`;
        } else {
          queryBase += ` AND re.status = ?`;
          params.push(filtros.status);
        }
      }

      if (filtros.dataInicio) {
        queryBase += ` AND DATE(re.data_requisicao) = ?`;
        params.push(filtros.dataInicio);
      }

      const [countResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT re.id) as total ${queryBase}`,
        params
      );
      const total = countResult[0].total;

      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT 
          re.*,
          f.nome as nome_solicitante,
          f.cargo as cargo_solicitante,
          GROUP_CONCAT(CONCAT(ie.qtde, 'x ', ie.descricao) SEPARATOR ', ') as descricao
        ${queryBase}
        GROUP BY re.id
        ORDER BY re.data_requisicao DESC
        LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      return {
        data: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Listar TODAS as requisições de cliente
   */
  private async listarTodasCliente(
    page: number,
    pageSize: number,
    filtros: { search?: string; status?: string; dataInicio?: string }
  ) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * pageSize;

      let queryBase = `
        FROM cliente_request clr
        LEFT JOIN Funcionarios f ON clr.id_solicitante = f.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filtros.search) {
        queryBase += ` AND (f.nome LIKE ? OR clr.descricao LIKE ? OR clr.id LIKE ?)`;
        params.push(
          `%${filtros.search}%`,
          `%${filtros.search}%`,
          `%${filtros.search}%`
        );
      }

      if (filtros.status) {
        // Normalizar status para aceitar variações
        const statusNormalizado = filtros.status.toLowerCase();
        if (
          statusNormalizado.includes("aprovad") ||
          statusNormalizado.includes("aprovado")
        ) {
          queryBase += ` AND (clr.status LIKE '%Aprovad%' OR clr.status LIKE '%Aprovado%')`;
        } else if (
          statusNormalizado.includes("reprov") ||
          statusNormalizado.includes("rejeit") ||
          statusNormalizado.includes("recusad")
        ) {
          queryBase += ` AND (clr.status LIKE '%Reprov%' OR clr.status LIKE '%Rejeit%' OR clr.status LIKE '%Recusad%')`;
        } else if (statusNormalizado.includes("pendent")) {
          queryBase += ` AND clr.status LIKE '%Pendent%'`;
        } else {
          queryBase += ` AND clr.status = ?`;
          params.push(filtros.status);
        }
      }

      if (filtros.dataInicio) {
        queryBase += ` AND DATE(clr.data_solicitacao) = ?`;
        params.push(filtros.dataInicio);
      }

      const [countResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total ${queryBase}`,
        params
      );
      const total = countResult[0].total;

      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT 
          clr.*,
          f.nome as nome_solicitante,
          f.cargo as cargo_solicitante
        ${queryBase}
        ORDER BY clr.data_solicitacao DESC
        LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      return {
        data: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } finally {
      connection.release();
    }
  }
}

export default new MasterService();
