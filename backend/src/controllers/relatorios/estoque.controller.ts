import { Request, Response } from "express";
import RelatorioEstoqueService from "../../services/relatorios/estoque.service";
import {
  IFiltroRelatorioEstoque,
  IPayloadPDFRelatorio,
} from "../../interfaces/relatorios/estoque.interface";
import { gerarPDFRelatorioEstoque } from "../../services/pdf.service";
import path from "path";
import fs from "fs";

class RelatorioEstoqueController {
  // Validação e extração de filtros comuns
  private extrairFiltros(req: Request): IFiltroRelatorioEstoque {
    const {
      dataInicio,
      dataFim,
      tipo_periodo,
      fornecedor,
      item,
      solicitante,
      entregaDireta,
    } = req.query;

    // Validação básica de datas obrigatórias
    if (!dataInicio || !dataFim) {
      throw new Error("dataInicio e dataFim são obrigatórios");
    }

    // Validação do formato de data
    const regexData = /^\d{4}-\d{2}-\d{2}$/;
    if (
      !regexData.test(dataInicio as string) ||
      !regexData.test(dataFim as string)
    ) {
      throw new Error("Formato de data inválido. Use YYYY-MM-DD");
    }

    // Validação do tipo de período
    const tiposValidos = ["dia", "semana", "mes", "ano"];
    if (tipo_periodo && !tiposValidos.includes(tipo_periodo as string)) {
      throw new Error("tipo_periodo deve ser: dia, semana, mes ou ano");
    }

    return {
      dataInicio: dataInicio as string,
      dataFim: dataFim as string,
      tipo_periodo: tipo_periodo as
        | "dia"
        | "semana"
        | "mes"
        | "ano"
        | undefined,
      fornecedor: fornecedor as string | undefined,
      item: item as string | undefined,
      solicitante: solicitante ? parseInt(solicitante as string) : undefined,
      entregaDireta:
        entregaDireta === "true"
          ? true
          : entregaDireta === "false"
          ? false
          : undefined,
    };
  }

  // 1. Valor de compra X valor de venda
  async getValorCompraVenda(req: Request, res: Response): Promise<Response> {
    try {
      const filtros = this.extrairFiltros(req);
      const resultado = await RelatorioEstoqueService.getValorCompraVenda(
        filtros
      );

      return res.status(200).json({
        success: true,
        data: resultado,
        filtros: {
          periodo: `${filtros.dataInicio} a ${filtros.dataFim}`,
          agrupamento: filtros.tipo_periodo || "mes",
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Erro ao buscar relatório de valores",
      });
    }
  }

  // 2. Valor de frete total
  async getValorFrete(req: Request, res: Response): Promise<Response> {
    try {
      const filtros = this.extrairFiltros(req);
      const resultado = await RelatorioEstoqueService.getValorFrete(filtros);

      return res.status(200).json({
        success: true,
        data: resultado,
        filtros: {
          periodo: `${filtros.dataInicio} a ${filtros.dataFim}`,
          agrupamento: filtros.tipo_periodo || "mes",
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Erro ao buscar relatório de frete",
      });
    }
  }

  // 3. Requisições por solicitante
  async getRequisicoesPorSolicitante(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const filtros = this.extrairFiltros(req);
      const resultado =
        await RelatorioEstoqueService.getRequisicoesPorSolicitante(filtros);

      return res.status(200).json({
        success: true,
        data: resultado,
        total: resultado.length,
        filtros: {
          periodo: `${filtros.dataInicio} a ${filtros.dataFim}`,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Erro ao buscar relatório por solicitante",
      });
    }
  }

  // 4. Entregas diretas por período
  async getEntregasDiretas(req: Request, res: Response): Promise<Response> {
    try {
      const filtros = this.extrairFiltros(req);
      const resultado = await RelatorioEstoqueService.getEntregasDiretas(
        filtros
      );

      return res.status(200).json({
        success: true,
        data: resultado,
        filtros: {
          periodo: `${filtros.dataInicio} a ${filtros.dataFim}`,
          agrupamento: filtros.tipo_periodo || "mes",
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "Erro ao buscar relatório de entregas diretas",
      });
    }
  }

  // 6. Resumo geral
  async getResumoGeral(req: Request, res: Response): Promise<Response> {
    try {
      const filtros = this.extrairFiltros(req);
      const resultado = await RelatorioEstoqueService.getResumoGeral(filtros);

      return res.status(200).json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Erro ao buscar resumo geral",
      });
    }
  }

  // 7. Todas as requisições detalhadas
  async getTodasRequisicoes(req: Request, res: Response): Promise<Response> {
    try {
      const filtros = this.extrairFiltros(req);
      const resultado = await RelatorioEstoqueService.getTodasRequisicoes(
        filtros
      );

      return res.status(200).json({
        success: true,
        data: resultado,
        total: resultado.length,
        filtros: {
          periodo: `${filtros.dataInicio} a ${filtros.dataFim}`,
          fornecedor: filtros.fornecedor || "todos",
          status: "Aprovado",
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Erro ao buscar requisições",
      });
    }
  }

  // 8. Gerar PDF com relatórios e enviar arquivo diretamente
  async gerarPDFRelatorio(req: Request, res: Response): Promise<void> {
    try {
      const {
        relatorios,
        dataInicio,
        dataFim,
        tipo_periodo,
        fornecedor,
        solicitante,
        entregaDireta,
      } = req.body;

      // Validar que relatorios é um array
      if (!Array.isArray(relatorios) || relatorios.length === 0) {
        res.status(400).json({
          success: false,
          message:
            "É necessário informar ao menos um relatório para gerar o PDF",
        });
        return;
      }

      // Validar datas obrigatórias
      if (!dataInicio || !dataFim) {
        res.status(400).json({
          success: false,
          message:
            "É necessário informar dataInicio e dataFim no body da requisição",
        });
        return;
      }

      // Gerar PDF
      const pdfPath = await gerarPDFRelatorioEstoque({
        relatorios,
        dataInicio,
        dataFim,
        tipo_periodo,
        fornecedor,
        solicitante,
        entregaDireta,
      });

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
        success: false,
        message: error.message || "Erro ao gerar PDF de relatórios",
      });
    }
  }
}

export default new RelatorioEstoqueController();
