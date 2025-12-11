import { Request, Response } from "express";
import RelatorioClienteService from "../../services/relatorios/cliente.service";
import { IFiltroRelatorioCliente } from "../../interfaces/relatorios/cliente.interface";
import { gerarPDFRelatorioCliente } from "../../services/pdf.service";
import path from "path";
import fs from "fs";

class RelatorioClienteController {
  // Helper para extrair filtros comuns da query
  private extrairFiltros(query: any): IFiltroRelatorioCliente {
    return {
      dataInicio: query.dataInicio as string,
      dataFim: query.dataFim as string,
      solicitante: query.solicitante ? Number(query.solicitante) : undefined,
      aprovador: query.aprovador ? Number(query.aprovador) : undefined,
    };
  }

  // 1. GET /todas
  async getTodasRequisicoes(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios: dataInicio, dataFim",
        });
      }

      const filtros = this.extrairFiltros(req.query);
      const dados = await RelatorioClienteService.getTodasRequisicoes(filtros);

      res.status(200).json({
        message: "Relatório de todas as requisições de cliente",
        total: dados.length,
        filtros,
        dados,
      });
    } catch (error: any) {
      console.error("Erro ao buscar requisições de cliente:", error);
      res.status(500).json({ error: "Erro ao buscar relatório" });
    }
  }

  // 2. POST /gerar-pdf
  async gerarPDFRelatorio(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim, solicitante, aprovador, status } = req.body;

      // Validações
      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Campos obrigatórios: dataInicio, dataFim",
        });
      }

      // Montar payload
      const payload = {
        dataInicio,
        dataFim,
        solicitante: solicitante ? Number(solicitante) : undefined,
        aprovador: aprovador ? Number(aprovador) : undefined,
        status,
      };

      // Gerar PDF
      const pdfPath = await gerarPDFRelatorioCliente(payload);

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

export default new RelatorioClienteController();
