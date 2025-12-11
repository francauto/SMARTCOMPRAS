import { Request, Response } from "express";
import RelatorioCombustivelEstoqueService from "../../services/relatorios/combustivel-estoque.service";
import { IFiltroRelatorioCombustivelEstoque } from "../../interfaces/relatorios/combustivel-estoque.interface";
import { gerarPDFRelatorioCombustivelEstoque } from "../../services/pdf.service";
import path from "path";
import fs from "fs";

class RelatorioCombustivelEstoqueController {
  // Helper para extrair filtros comuns da query
  private extrairFiltros(query: any): IFiltroRelatorioCombustivelEstoque {
    return {
      dataInicio: query.dataInicio as string,
      dataFim: query.dataFim as string,
      tipo_periodo: query.tipo_periodo as
        | "dia"
        | "semana"
        | "mes"
        | "ano"
        | undefined,
      solicitante: query.solicitante ? Number(query.solicitante) : undefined,
      aprovador: query.aprovador ? Number(query.aprovador) : undefined,
      departamento: query.departamento ? Number(query.departamento) : undefined,
      tipo_combustivel: query.tipo_combustivel as string | undefined,
      placa: query.placa as string | undefined,
      chassi: query.chassi as string | undefined,
      marca: query.marca as string | undefined,
      modelo: query.modelo as string | undefined,
    };
  }

  // 1. GET /consumo-por-veiculo
  async getConsumoPorVeiculo(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados =
        await RelatorioCombustivelEstoqueService.getConsumoPorVeiculo(filtros);

      res.status(200).json({
        message: "Relatório de consumo por veículo",
        total: dados.length,
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar consumo por veículo:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 2. GET /analise-temporal
  async getAnaliseTemporal(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioCombustivelEstoqueService.getAnaliseTemporal(
        filtros
      );

      res.status(200).json({
        message: "Relatório de análise temporal de consumo",
        total: dados.length,
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar análise temporal:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 3. GET /por-tipo-combustivel
  async getPorTipoCombustivel(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados =
        await RelatorioCombustivelEstoqueService.getPorTipoCombustivel(filtros);

      res.status(200).json({
        message: "Relatório por tipo de combustível",
        total: dados.length,
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar relatório por tipo combustível:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 4. GET /por-departamento
  async getPorDepartamento(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioCombustivelEstoqueService.getPorDepartamento(
        filtros
      );

      res.status(200).json({
        message: "Relatório por departamento",
        total: dados.length,
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar relatório por departamento:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 5. GET /por-solicitante
  async getPorSolicitante(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioCombustivelEstoqueService.getPorSolicitante(
        filtros
      );

      res.status(200).json({
        message: "Relatório por solicitante",
        total: dados.length,
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar relatório por solicitante:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 6. GET /por-marca-modelo
  async getPorMarcaModelo(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioCombustivelEstoqueService.getPorMarcaModelo(
        filtros
      );

      res.status(200).json({
        message: "Relatório por marca/modelo",
        total: dados.length,
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar relatório por marca/modelo:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 7. GET /tempo-aprovacao - REMOVIDO

  // 8. GET /resumo-geral
  async getResumoGeral(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioCombustivelEstoqueService.getResumoGeral(
        filtros
      );

      res.status(200).json({
        message: "Resumo geral do combustível estoque",
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar resumo geral:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 9. GET /todas
  async getTodasRequisicoes(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados =
        await RelatorioCombustivelEstoqueService.getTodasRequisicoes(filtros);

      res.status(200).json({
        message: "Todas as requisições de combustível estoque",
        total: dados.length,
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar todas as requisições:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 10. POST /gerar-pdf
  async gerarPDFRelatorio(req: Request, res: Response) {
    try {
      const {
        relatorios,
        dataInicio,
        dataFim,
        tipo_periodo,
        solicitante,
        aprovador,
        departamento,
        status,
        tipo_combustivel,
        placa,
        chassi,
        marca,
        modelo,
      } = req.body;

      // Validações
      if (
        !relatorios ||
        !Array.isArray(relatorios) ||
        relatorios.length === 0
      ) {
        return res.status(400).json({
          error: "Campo obrigatório: relatorios (array não vazio)",
        });
      }

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Campos obrigatórios: dataInicio, dataFim",
        });
      }

      // Montar payload
      const payload = {
        relatorios,
        dataInicio,
        dataFim,
        tipo_periodo,
        solicitante: solicitante ? Number(solicitante) : undefined,
        aprovador: aprovador ? Number(aprovador) : undefined,
        departamento: departamento ? Number(departamento) : undefined,
        status,
        tipo_combustivel,
        placa,
        chassi,
        marca,
        modelo,
      };

      // Gerar PDF
      const pdfPath = await gerarPDFRelatorioCombustivelEstoque(payload);

      // Enviar arquivo PDF diretamente
      const fileName = path.basename(pdfPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.sendFile(pdfPath, (err) => {
        if (err) {
          console.error("❌ Erro ao enviar PDF:", err);
        } else {
          // Deletar arquivo após envio bem-sucedido
          fs.unlink(pdfPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("❌ Erro ao deletar PDF:", unlinkErr);
            } else {
              console.log(`🗑️ PDF deletado: ${fileName}`);
            }
          });
        }
      });
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      res.status(500).json({
        error: "Erro ao gerar PDF",
        details: error.message,
      });
    }
  }
}

export default new RelatorioCombustivelEstoqueController();
