import { Request, Response } from "express";
import RelatorioDespesasService from "../../services/relatorios/despesas.service";
import { gerarPDFRelatorioDespesas } from "../../services/pdf.service";
import {
  IFiltroRelatorioDespesas,
  IPayloadPDFRelatorioDespesas,
} from "../../interfaces/relatorios/despesas.interface";
import path from "path";
import fs from "fs";

class RelatorioDespesasController {
  // Helper para extrair filtros dos query params
  private extrairFiltros(query: any): IFiltroRelatorioDespesas {
    return {
      dataInicio: query.dataInicio as string,
      dataFim: query.dataFim as string,
      tipo_periodo: query.tipo_periodo as
        | "dia"
        | "semana"
        | "mes"
        | "ano"
        | undefined,
      solicitante: query.solicitante
        ? parseInt(query.solicitante as string)
        : undefined,
      aprovador: query.aprovador
        ? parseInt(query.aprovador as string)
        : undefined,
      departamento: query.departamento
        ? parseInt(query.departamento as string)
        : undefined,
    };
  }

  // GET /api/relatorios/despesas/analise-temporal
  async getAnaliseTemporal(req: Request, res: Response): Promise<Response> {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res
          .status(400)
          .json({ error: "dataInicio e dataFim são obrigatórios" });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioDespesasService.getAnaliseTemporal(filtros);

      return res.json(dados);
    } catch (error) {
      console.error("Erro ao buscar análise temporal:", error);
      return res.status(500).json({ error: "Erro ao buscar análise temporal" });
    }
  }

  // GET /api/relatorios/despesas/gastos-por-departamento
  async getGastosPorDepartamento(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res
          .status(400)
          .json({ error: "dataInicio e dataFim são obrigatórios" });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioDespesasService.getGastosPorDepartamento(
        filtros
      );

      return res.json(dados);
    } catch (error) {
      console.error("Erro ao buscar gastos por departamento:", error);
      return res
        .status(500)
        .json({ error: "Erro ao buscar gastos por departamento" });
    }
  }

  // GET /api/relatorios/despesas/comparativo-cotacoes
  async getComparativoCotacoes(req: Request, res: Response): Promise<Response> {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res
          .status(400)
          .json({ error: "dataInicio e dataFim são obrigatórios" });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioDespesasService.getComparativoCotacoes(
        filtros
      );

      return res.json(dados);
    } catch (error) {
      console.error("Erro ao buscar comparativo de cotações:", error);
      return res
        .status(500)
        .json({ error: "Erro ao buscar comparativo de cotações" });
    }
  }

  // GET /api/relatorios/despesas/resumo-geral
  async getResumoGeral(req: Request, res: Response): Promise<Response> {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res
          .status(400)
          .json({ error: "dataInicio e dataFim são obrigatórios" });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioDespesasService.getResumoGeral(filtros);

      return res.json(dados);
    } catch (error) {
      console.error("Erro ao buscar resumo geral:", error);
      return res.status(500).json({ error: "Erro ao buscar resumo geral" });
    }
  }

  // GET /api/relatorios/despesas/todas
  async getTodasRequisicoes(req: Request, res: Response): Promise<Response> {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res
          .status(400)
          .json({ error: "dataInicio e dataFim são obrigatórios" });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioDespesasService.getTodasRequisicoes(filtros);

      return res.json(dados);
    } catch (error) {
      console.error("Erro ao buscar todas requisições:", error);
      return res
        .status(500)
        .json({ error: "Erro ao buscar todas requisições" });
    }
  }

  // POST /api/relatorios/despesas/gerar-pdf
  async gerarPDFRelatorio(req: Request, res: Response): Promise<void> {
    try {
      const payload: IPayloadPDFRelatorioDespesas = req.body;

      if (
        !payload.dataInicio ||
        !payload.dataFim ||
        !payload.relatorios ||
        payload.relatorios.length === 0
      ) {
        res.status(400).json({
          error:
            "dataInicio, dataFim e relatorios (array não vazio) são obrigatórios",
        });
        return;
      }

      console.log("📄 Gerando PDF de relatórios de despesas...");

      // Gerar PDF
      const pdfPath = await gerarPDFRelatorioDespesas(payload);

      // Enviar arquivo
      res.sendFile(pdfPath, (err) => {
        if (err) {
          console.error("❌ Erro ao enviar PDF:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Erro ao enviar PDF" });
          }
        } else {
          console.log("✅ PDF enviado com sucesso!");

          // Deletar arquivo após envio bem-sucedido
          fs.unlink(pdfPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("⚠️ Erro ao deletar PDF:", unlinkErr);
            } else {
              console.log("🗑️ PDF deletado com sucesso!");
            }
          });
        }
      });
    } catch (error) {
      console.error("❌ Erro ao gerar PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Erro ao gerar PDF de relatórios" });
      }
    }
  }
}

export default new RelatorioDespesasController();
