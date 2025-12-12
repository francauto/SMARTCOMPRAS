import axios from "axios";
import pool from "../config/db";
import { PrinterParamsInterfaceAgent } from "../interfaces/printerParams.interface";
import { geradorPDF } from "./pdf.service";
import { IPdf } from "../interfaces/pdf.interface";
import fs from "fs";
import path from "path";

export async function printRequestsAgentService(
  params: PrinterParamsInterfaceAgent
): Promise<{ success: boolean; message: string }> {
  const connection = await pool.getConnection();
  const { id_requisicao, nametable, printer_ip, file_url } = params;

  try {
    console.log(
      `🖨️ Enviando requisição ${id_requisicao} (${nametable}) para impressora (${printer_ip})`
    );
    let moduloNumber: number = 1;
    if (nametable === "combustivel_request") {
      moduloNumber = 2;
    } else if (nametable === "combustivel_request_estoque") {
      moduloNumber = 3;
    } else if (nametable === "requisicoes_estoque") {
      moduloNumber = 4;
    } else if (nametable === "cliente_request") {
      moduloNumber = 5;
    } else if (nametable === "requisicoes") {
      moduloNumber = 1;
    }
    const pdf: IPdf = {
      id_modulo: moduloNumber,
      id_requisicao: id_requisicao,
    };
    const fileUrl = await geradorPDF(pdf, connection);
    console.log("FILE URL = " + fileUrl);
    const { data }: any = await axios.post(`http://211.2.100.245:4005/print`, {
      id_requisicao,
      tipo: nametable,
      printer_ip,
      file_url: fileUrl,
    });

    const status = data.success ? 1 : 0;
    const msg = data.error || null;

    await connection.beginTransaction();
    if (nametable === "combustivel_request") {
      await connection.query(
        `UPDATE ?? 
       SET impresso = ?, 
           status = 'Aguardando Cupom' 
       WHERE id = ?`,
        [nametable, status, id_requisicao]
      );
    } else {
      await connection.query(
        `UPDATE ?? 
       SET impresso = ?
       WHERE id = ?`,
        [nametable, status, id_requisicao]
      );
    }
    await connection.commit();

    console.log(
      data.success
        ? `✅ Impressão concluída (${id_requisicao})`
        : `❌ Falha ao imprimir (${id_requisicao}): ${msg}`
    );

    // Se a impressão foi bem-sucedida, apaga o PDF
    if (data.success && fileUrl) {
      try {
        // Extrai o caminho do arquivo da URL
        // Exemplo: http://localhost:3000/pdfs/arquivo.pdf -> pdfs/arquivo.pdf
        const urlPath = new URL(fileUrl).pathname;
        const filePath = path.join(process.cwd(), urlPath);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ PDF deletado: ${filePath}`);
        }
      } catch (deleteError: any) {
        console.warn(
          `⚠️ Não foi possível deletar o PDF: ${deleteError.message}`
        );
        // Não interrompe o fluxo, apenas registra o aviso
      }
    }

    return {
      success: data.success,
      message: data.success
        ? "Impressão realizada com sucesso"
        : `Falha na impressão: ${msg}`,
    };
  } catch (error: any) {
    console.error("❌ Erro ao enviar para agente:", error.message);
    await connection.rollback();
    return {
      success: false,
      message: `Erro ao comunicar com o agente: ${error.message}`,
    };
  } finally {
    connection.release();
  }
}

export async function getPrinters() {
  let connection;
  connection = await pool.getConnection();
  try {
    const [getPrinters]: any = await connection.query(
      `SELECT name_printer, ip_printer FROM printers;`
    );
    return getPrinters;
  } catch (error) {
    console.log("erro ao buscar impressora" + error);
    throw error;
  } finally {
    connection.release();
  }
}
