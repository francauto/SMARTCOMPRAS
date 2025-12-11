import { IPdf } from "../interfaces/pdf.interface";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

// Importar os serviços de cada módulo
import { DespesasService } from "./despesas.service";
import { getRequisicaoPorId as getRequisicaoCombustivelEstoque } from "./combustivel-estoque.service";
import { getSolicitacaoFrotaById } from "./frotaCombustivel.service";
import { getRequisicaoPorId as getRequisicaoEstoque } from "./estoque.service";
import { getRequisicaoPorId as getRequisicaoCliente } from "./cliente.service";
import { generateHashFallback } from "./hash.service";
import pool from "../config/db";
import { PoolConnection } from "mysql2";

const despesasService = new DespesasService();

// Diretório para armazenar os PDFs gerados
const PDF_DIR = path.join(__dirname, "../../pdfs");

// Criar diretório se não existir
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Função principal - USO INTERNO
export async function geradorPDF(
  payload: IPdf,
  connection: any
): Promise<string> {
  let browser = null;

  try {
    const { id_modulo, id_requisicao } = payload;
    const [modulos] = await connection.query(
      `SELECT * FROM modulos WHERE id = ?`,
      [id_modulo]
    );

    if (modulos.length === 0) {
      throw new Error(`Módulo com ID ${id_modulo} não encontrado`);
    }

    // Buscar hash e gerar QR Code
    let hash = await getHash(id_modulo, id_requisicao, connection);

    // FALLBACK: Se hash não existe, tenta gerar automaticamente (se requisição estiver aprovada)
    if (!hash) {
      console.warn(
        `[PDF SERVICE] Hash não encontrado para requisição ${id_requisicao}. Tentando gerar automaticamente...`
      );

      hash = await generateHashFallback(id_modulo, id_requisicao, connection);

      if (!hash) {
        throw new Error(
          `QR Code não disponível para esta requisição. ` +
            `A requisição ${id_requisicao} do módulo ${id_modulo} não possui hash registrado e não foi possível gerar automaticamente. ` +
            `Verifique se a requisição está aprovada. O QR Code é obrigatório para a impressão.`
        );
      }

      console.log(
        `[PDF SERVICE] Hash gerado automaticamente com sucesso! Requisição: ${id_requisicao}, Hash: ${hash}`
      );
    }

    const qrCodeDataURL = await generateQRCode(hash);

    let requisicao: any = null;
    let htmlContent: string = "";
    let fileName: string = "";

    switch (id_modulo) {
      case 1:
        requisicao = await despesasService.getRequisicaoPorId(id_requisicao);
        htmlContent = gerarHTMLDespesas(requisicao, qrCodeDataURL);
        fileName = `despesas_${id_requisicao}.pdf`;
        break;
      case 2:
        const frotaData = await getSolicitacaoFrotaById(id_requisicao);
        requisicao = Array.isArray(frotaData) ? frotaData[0] : frotaData;
        htmlContent = gerarHTMLCombustivelFrota(requisicao, qrCodeDataURL);
        fileName = `combustivel_frota_${id_requisicao}.pdf`;
        break;
      case 3:
        requisicao = await getRequisicaoCombustivelEstoque(id_requisicao);
        htmlContent = gerarHTMLCombustivelEstoque(requisicao, qrCodeDataURL);
        fileName = `combustivel_estoque_${id_requisicao}.pdf`;
        break;
      case 4:
        requisicao = await getRequisicaoEstoque(id_requisicao);
        htmlContent = gerarHTMLEstoque(requisicao, qrCodeDataURL);
        fileName = `estoque_${id_requisicao}.pdf`;
        break;
      case 5:
        requisicao = await getRequisicaoCliente(id_requisicao);
        htmlContent = gerarHTMLClientes(requisicao, qrCodeDataURL);
        fileName = `clientes_${id_requisicao}.pdf`;
        break;
      default:
        throw new Error(`Módulo não implementado`);
    }

    if (!requisicao) {
      throw new Error(`Requisição ${id_requisicao} não encontrada`);
    }

    const pdfPath = path.join(PDF_DIR, fileName);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    // Retornar URL pública ao invés do caminho local
    // Usa PDF_BASE_URL para permitir URL diferente em desenvolvimento (IP interno) e produção (domínio)
    const baseUrl =
      process.env.PDF_BASE_URL ||
      process.env.BASE_URL ||
      "http://localhost:3000";
    const publicUrl = `${baseUrl}/pdfs/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function getBaseHTMLTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      font-size: 11px; 
      line-height: 1.5; 
      color: #333; 
      background: #fff;
      padding: 20px;
    }
    
    /* Header */
    .header { 
      margin-bottom: 20px; 
      padding-bottom: 15px; 
      border-bottom: 4px solid #1976D2; 
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      padding: 15px;
      border-radius: 8px;
    }
    
    .header-grid { 
      display: grid; 
      grid-template-columns: 120px 1fr 120px; 
      gap: 15px; 
      align-items: center; 
    }
    
    .header-logo { 
      text-align: center; 
    }
    
    .header-logo img {
      max-width: 100px;
      height: auto;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
    }
    
    .header-content { 
      text-align: center; 
    }
    
    .header-extra { 
      text-align: center; 
    }
    
    .header h1 { 
      font-size: 18px; 
      color: #1976D2; 
      margin-bottom: 10px; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      font-weight: 700;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }
    
    .header-info { 
      font-size: 10px; 
      color: #666; 
      margin-top: 8px; 
      line-height: 1.6;
    }
    
    /* Sections */
    .info-section { 
      margin-bottom: 15px; 
      page-break-inside: avoid;
    }
    
    .info-section h2 { 
      font-size: 14px; 
      color: #fff; 
      margin-bottom: 10px; 
      padding: 8px 12px; 
      background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); 
      border-radius: 5px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .info-section h3 {
      font-size: 12px;
      color: #1976D2;
      margin: 15px 0 8px 0;
      padding-bottom: 5px;
      border-bottom: 2px solid #E3F2FD;
    }
    
    /* Info Grid */
    .info-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 10px; 
    }
    
    .info-item { 
      display: flex; 
      flex-direction: column;
      padding: 10px; 
      background: #f8f9fa; 
      border-radius: 5px;
      border-left: 3px solid #2196F3;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    .info-item .label { 
      font-weight: 600; 
      color: #666; 
      font-size: 10px; 
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-item .value { 
      color: #1976D2; 
      font-size: 14px; 
      font-weight: 700;
    }
    
    /* Tables */
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 15px; 
      font-size: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.08);
      border-radius: 5px;
      overflow: hidden;
    }
    
    table th { 
      background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%); 
      color: white; 
      padding: 8px 10px; 
      text-align: left; 
      font-size: 10px; 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    table td { 
      padding: 6px 10px; 
      border-bottom: 1px solid #e0e0e0; 
      font-size: 10px; 
    }
    
    table tr:nth-child(even) { 
      background-color: #f8f9fa; 
    }
    
    table tr:hover {
      background-color: #e3f2fd;
    }
    
    table td:last-child,
    table th:last-child {
      text-align: right;
    }
    
    /* Status Badges */
    .status-badge { 
      display: inline-block; 
      padding: 3px 10px; 
      border-radius: 15px; 
      font-size: 9px; 
      font-weight: 600; 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    
    .status-aprovado { 
      background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
      color: white; 
    }
    
    .status-pendente { 
      background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
      color: white; 
    }
    
    .status-reprovado { 
      background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
      color: white; 
    }
    
    /* Value Box */
    .value-box { 
      display: inline-block; 
      background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); 
      padding: 6px 15px; 
      border-radius: 5px; 
      font-weight: 700; 
      color: #2E7D32; 
      font-size: 13px;
      border: 2px solid #4CAF50;
      box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
    }
    
    /* Highlight */
    .highlight { 
      background: linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%); 
      padding: 10px; 
      border-radius: 5px; 
      border-left: 4px solid #FBC02D; 
      margin-bottom: 10px; 
      font-size: 11px;
      box-shadow: 0 2px 4px rgba(251, 192, 45, 0.2);
    }
    
    /* Footer */
    .footer { 
      margin-top: 30px;
      padding-top: 15px;
      border-top: 3px solid #2196F3;
    }
    
    .footer-line { 
      height: 3px; 
      background: linear-gradient(90deg, #2196F3 0%, #1976D2 50%, #2196F3 100%); 
      margin-bottom: 12px; 
      border-radius: 2px; 
    }
    
    .footer-content { 
      display: grid; 
      grid-template-columns: 1fr 1fr 1fr; 
      gap: 15px; 
      font-size: 9px; 
      color: #666; 
    }
    
    .footer-item { 
      line-height: 1.6; 
    }
    
    .footer-item strong {
      color: #1976D2;
      font-size: 10px;
    }
    
    /* Page Break */
    .page-break {
      page-break-before: always;
    }
    
    /* Print Styles */
    @media print {
      body {
        padding: 10px;
      }
      
      .info-section {
        page-break-inside: avoid;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>${content}</body>
</html>`;
}

function gerarHTMLDespesas(req: any, qrCodeDataURL: string = ""): string {
  const statusClass =
    req.status === "Aprovada"
      ? "status-aprovado"
      : req.status === "Reprovada"
      ? "status-reprovado"
      : "status-pendente";

  // Filtrar apenas fornecedores/cotas aprovados
  const fornecedoresAprovados =
    req.fornecedores?.filter(
      (f: any) =>
        f.status === "Aprovada" ||
        f.status === "aprovada" ||
        f.status === "Aprovado" ||
        f.status === "aprovado"
    ) || [];

  // Gerar HTML para fornecedores aprovados - uma tabela por fornecedor com seus itens
  let fornHTML = "";
  let valorTotalGeral = 0;

  if (fornecedoresAprovados.length > 0) {
    fornecedoresAprovados.forEach((f: any) => {
      valorTotalGeral += f.valor_total || 0;
      fornHTML += `<div class="info-section"><h2>📦 Fornecedor: ${f.nome}</h2>`;

      if (f.itens && f.itens.length > 0) {
        fornHTML += `<table><thead><tr><th>Descrição</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Valor Unit.</th><th style="text-align:right;">Subtotal</th></tr></thead><tbody>${f.itens
          .map((i: any) => {
            const subtotal = i.qtde * i.valor_unitario;
            return `<tr><td>${i.descricao}</td><td style="text-align:center;">${
              i.qtde
            }</td><td style="text-align:right;">R$ ${formatarValor(
              i.valor_unitario
            )}</td><td style="text-align:right;font-weight:600;">R$ ${formatarValor(
              subtotal
            )}</td></tr>`;
          })
          .join("")}`;

        // Linha de total do fornecedor
        fornHTML += `<tr style="background-color:#E3F2FD;font-weight:bold;"><td colspan="3" style="text-align:right;padding-right:10px;">TOTAL:</td><td style="text-align:right;">R$ ${formatarValor(
          f.valor_total || 0
        )}</td></tr>`;
        fornHTML += `</tbody></table>`;
      } else {
        fornHTML += `<p style="padding:10px;color:#666;">Sem itens cadastrados</p>`;
      }

      fornHTML += `</div>`;
    });
  } else {
    fornHTML = `<div class="info-section"><p style="padding:10px;color:#666;text-align:center;">Nenhum fornecedor aprovado</p></div>`;
  }

  // Gerar HTML para departamentos em tabela
  let depHTML = "";
  if (req.departamentos && req.departamentos.length > 0) {
    depHTML = `<div class="info-section"><h2>🏢 Departamentos</h2><table><thead><tr><th>Departamento</th><th style="text-align:center;">Percentual</th><th style="text-align:right;">Valor</th></tr></thead><tbody>`;

    req.departamentos.forEach((d: any) => {
      depHTML += `<tr><td>${d.nome}</td><td style="text-align:center;">${
        d.percent
      }%</td><td style="text-align:right;">R$ ${formatarValor(
        d.valor_gasto || 0
      )}</td></tr>`;
    });

    depHTML += `</tbody></table></div>`;
  }
  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  const content = `<div class="header">
    <div class="header-grid">
      <div class="header-logo">
        ${
          logoExists
            ? `<img src="${logoBase64}" alt="SmartCompras Logo" style="max-width:100%;height:auto;max-height:60px;">`
            : '<div style="color:#ccc;font-size:10px;">LOGO</div>'
        }
      </div>
      <div class="header-content">
        <h1>REQUISIÇÃO DE DESPESAS - ${req.descricao || "Sem descrição"} - #${
    req.id
  }</h1>
        <div class="header-info">
          <span><strong>Data Solicitação:</strong> ${formatarData(
            req.data_requisicao
          )}</span>
          <span style="margin-left:20px;"><strong>Data Aprovação:</strong> ${
            req.data_aprovacao_diretor
              ? formatarData(req.data_aprovacao_diretor)
              : "Pendente"
          }</span>
        </div>
        <div class="header-info">
          <span><strong>Solicitante:</strong> ${req.nome_solicitante}</span>
          <span style="margin-left:20px;"><strong>Diretor Aprovador:</strong> ${
            req.nome_aprovador_diretor || "Aguardando aprovação"
          }</span>
        </div>
      </div>
      <div class="header-extra">
        ${
          qrCodeDataURL
            ? `<img src="${qrCodeDataURL}" alt="QR Code" style="max-width:100%;height:auto;max-height:80px;">`
            : '<div style="color:#ccc;font-size:9px;">QR Code<br>não disponível</div>'
        }
      </div>
    </div>
  </div>
  <div class="total-section">
    <div class="total-box">
      <div class="total-label">VALOR TOTAL APROVADO</div>
      <div class="total-value">R$ ${formatarValor(valorTotalGeral)}</div>
    </div>
  </div>${fornHTML}${depHTML}
  <div class="footer">
    <div class="footer-line"></div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;">
      <div style="text-align:left;font-size:9px;">
        <strong>SmartCompras</strong><br>
        Sistema de Gestão de Compras
      </div>
      <div style="text-align:center;">
        <div style="font-size:9px;color:#888;">Documento gerado em</div>
        <div style="font-weight:600;font-size:10px;">${formatarDataHora(
          new Date()
        )}</div>
      </div>
      <div style="text-align:right;font-size:9px;color:#888;">
        &copy; 2025 Francauto Labs<br>
        Todos os direitos reservados
      </div>
    </div>
  </div>`;
  return getBaseHTMLTemplate("Requisição de Despesas", content);
}

function gerarHTMLCombustivelFrota(
  req: any,
  qrCodeDataURL: string = ""
): string {
  const statusClass =
    req.status === "Aprovado"
      ? "status-aprovado"
      : req.status === "Reprovado"
      ? "status-reprovado"
      : "status-pendente";

  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  const valorTotal = req.quantidade_litros || 0;

  const content = `<div class="header">
    <div class="header-grid">
      <div class="header-logo">
        ${
          logoExists
            ? `<img src="${logoBase64}" alt="SmartCompras Logo" style="max-width:100%;height:auto;max-height:60px;">`
            : '<div style="color:#ccc;font-size:10px;">LOGO</div>'
        }
      </div>
      <div class="header-content">
        <h1>REQUISIÇÃO DE COMBUSTÍVEL - FROTA - #${req.id}</h1>
        <div class="header-info">
          <span><strong>Data Solicitação:</strong> ${formatarData(
            req.data_solicitacao
          )}</span>
          <span style="margin-left:20px;"><strong>Data Aprovação:</strong> ${
            req.data_aprovacao ? formatarData(req.data_aprovacao) : "Pendente"
          }</span>
        </div>
        <div class="header-info">
          <span><strong>Solicitante:</strong> ${
            req.nome_solicitante || "N/A"
          }</span>
          <span style="margin-left:20px;"><strong>Aprovador:</strong> ${
            req.nome_aprovador || "Aguardando aprovação"
          }</span>
        </div>
      </div>
      <div class="header-extra">
        ${
          qrCodeDataURL
            ? `<img src="${qrCodeDataURL}" alt="QR Code" style="max-width:100%;height:auto;max-height:80px;">`
            : '<div style="color:#ccc;font-size:9px;">QR Code<br>não disponível</div>'
        }
      </div>
    </div>
  </div>
  <div class="info-section"><h2>🚗 Dados do Veículo</h2><div class="info-grid"><div class="info-item"><span class="label">Modelo:</span><span class="value">${
    req.modelo
  }</span></div><div class="info-item"><span class="label">Placa:</span><span class="value">${
    req.placa
  }</span></div><div class="info-item"><span class="label">KM Atual:</span><span class="value">${
    req.km_veiculo
  }</span></div>${
    req.departamento_nome
      ? `<div class="info-item"><span class="label">Departamento:</span><span class="value">${req.departamento_nome}</span></div>`
      : ""
  }</div></div>
  <div class="info-section"><h2>⛽ Dados do Combustível</h2><div class="info-grid"><div class="info-item"><span class="label">Tipo:</span><span class="value">${
    req.tipo_combustivel
  }</span></div><div class="info-item"><span class="label">${
    req.tanque_cheio ? "Tanque:" : "Quantidade:"
  }</span><span class="value"><span class="value-box">${
    req.tanque_cheio ? "TANQUE CHEIO ✓" : `${req.quantidade_litros} litros`
  }</span></span></div></div></div>
  <div class="total-section">
    <div class="total-box">
      <div class="total-label">${
        req.tanque_cheio ? "ABASTECIMENTO" : "QUANTIDADE TOTAL"
      }</div>
      <div class="total-value">${
        req.tanque_cheio ? "TANQUE CHEIO" : `${valorTotal} LITROS`
      }</div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-line"></div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;">
      <div style="text-align:left;font-size:9px;">
        <strong>SmartCompras</strong><br>
        Sistema de Gestão de Compras
      </div>
      <div style="text-align:center;">
        <div style="font-size:9px;color:#888;">Documento gerado em</div>
        <div style="font-weight:600;font-size:10px;">${formatarDataHora(
          new Date()
        )}</div>
      </div>
      <div style="text-align:right;font-size:9px;color:#888;">
        &copy; 2025 Francauto Labs<br>
        Todos os direitos reservados
      </div>
    </div>
  </div>`;
  return getBaseHTMLTemplate("Requisição de Combustível - Frota", content);
}

function gerarHTMLCombustivelEstoque(
  req: any,
  qrCodeDataURL: string = ""
): string {
  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  const statusClass =
    req.status === "Aprovado"
      ? "status-aprovado"
      : req.status === "Reprovado"
      ? "status-reprovado"
      : "status-pendente";

  const content = `
    <div class="header">
      <div class="header-grid">
        <div class="header-logo">
          ${
            logoExists
              ? `<img src="${logoBase64}" alt="SmartCompras" style="max-width: 100%; max-height: 80px;" />`
              : '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; border-radius: 8px; font-weight: bold; text-align: center;">LOGO</div>'
          }
        </div>
        <div class="header-content">
          <h1>REQUISIÇÃO DE COMBUSTÍVEL - ESTOQUE - #${req.id}</h1>
          <div class="header-info">
            <strong>Data Solicitação:</strong> ${formatarData(
              req.data_solicitacao
            )}
            ${
              req.data_aprovacao
                ? ` | <strong>Data Aprovação:</strong> ${formatarData(
                    req.data_aprovacao
                  )}`
                : ""
            }
          </div>
          <div class="header-info">
            <strong>Solicitante:</strong> ${req.solicitante_nome}
            ${
              req.aprovador_nome
                ? ` | <strong>Aprovador:</strong> ${req.aprovador_nome}`
                : ""
            }
          </div>
          <div class="header-info">
            <strong>Status:</strong> <span class="status-badge ${statusClass}">${
    req.status
  }</span>
          </div>
        </div>
        <div class="header-extra">
          ${
            qrCodeDataURL
              ? `<img src="${qrCodeDataURL}" alt="QR Code" style="width: 80px; height: 80px;" />`
              : '<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; text-align: center;">QR Code</div>'
          }
        </div>
      </div>
    </div>

    <div class="info-section">
      <h2>🚗 Dados do Veículo</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Modelo:</span>
          <span class="value">${req.modelo}</span>
        </div>
        <div class="info-item">
          <span class="label">Marca:</span>
          <span class="value">${req.marca}</span>
        </div>
        ${
          req.placa
            ? `<div class="info-item"><span class="label">Placa:</span><span class="value">${req.placa}</span></div>`
            : ""
        }
        ${
          req.chassi
            ? `<div class="info-item"><span class="label">Chassi:</span><span class="value">${req.chassi}</span></div>`
            : ""
        }
        ${
          req.departamento_nome
            ? `<div class="info-item"><span class="label">Departamento:</span><span class="value">${req.departamento_nome}</span></div>`
            : ""
        }
      </div>
    </div>

    <div class="info-section">
      <h2>⛽ Dados do Combustível</h2>
      <div class="info-grid">
        ${
          req.tipo_combustivel
            ? `<div class="info-item"><span class="label">Tipo:</span><span class="value">${req.tipo_combustivel}</span></div>`
            : ""
        }
        <div class="info-item">
          <span class="label">Quantidade:</span>
          <span class="value"><span class="value-box">${
            req.quantidade_litros
          } litros</span></span>
        </div>
      </div>
    </div>

    <div class="total-section">
      <div class="total-box">
        <div class="total-label">TOTAL DE COMBUSTÍVEL</div>
        <div class="total-value">${req.quantidade_litros} litros</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <div class="footer-item">
          <strong>SmartCompras</strong><br>
          Sistema de Gestão de Compras
        </div>
        <div class="footer-item" style="text-align: center;">
          <strong>Documento Gerado em:</strong><br>
          ${formatarDataHora(new Date())}
        </div>
        <div class="footer-item" style="text-align: right;">
          <strong>Francauto Labs</strong><br>
          &copy; 2025 - Todos os direitos reservados
        </div>
      </div>
    </div>
  `;

  return getBaseHTMLTemplate("Requisição de Combustível - Estoque", content);
}

function gerarHTMLEstoque(req: any, qrCodeDataURL: string = ""): string {
  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  const statusClass =
    req.status === "Aprovado"
      ? "status-aprovado"
      : req.status === "Reprovado"
      ? "status-reprovado"
      : "status-pendente";

  let itensHTML = "";
  if (req.itens && req.itens.length > 0) {
    itensHTML = `
      <div class="info-section">
        <h2>📦 Itens Solicitados</h2>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th style="text-align:center;">Qtd</th>
              <th style="text-align:right;">Valor Unit.</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${req.itens
              .map((item: any) => {
                const subtotal = item.qtde * item.valor_unitario;
                return `<tr>
                  <td>${item.descricao}</td>
                  <td style="text-align:center;">${item.qtde}</td>
                  <td style="text-align:right;">R$ ${formatarValor(
                    item.valor_unitario
                  )}</td>
                  <td style="text-align:right;font-weight:600;">R$ ${formatarValor(
                    subtotal
                  )}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>`;
  }

  const content = `
    <div class="header">
      <div class="header-grid">
        <div class="header-logo">
          ${
            logoExists
              ? `<img src="${logoBase64}" alt="SmartCompras" style="max-width: 100%; max-height: 80px;" />`
              : '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; border-radius: 8px; font-weight: bold; text-align: center;">LOGO</div>'
          }
        </div>
        <div class="header-content">
          <h1>REQUISIÇÃO DE ESTOQUE - #${req.id}</h1>
          <div class="header-info">
            <strong>Data Solicitação:</strong> ${formatarData(
              req.data_requisicao
            )}
            ${
              req.data_aprovacao
                ? ` | <strong>Data Aprovação:</strong> ${formatarData(
                    req.data_aprovacao
                  )}`
                : ""
            }
          </div>
          <div class="header-info">
            <strong>Solicitante:</strong> ${req.nome_solicitante}
            ${
              req.nome_aprovador
                ? ` | <strong>Aprovador:</strong> ${req.nome_aprovador}`
                : ""
            }
          </div>
          <div class="header-info">
            <strong>Status:</strong> <span class="status-badge ${statusClass}">${
    req.status
  }</span>
          </div>
        </div>
        <div class="header-extra">
          ${
            qrCodeDataURL
              ? `<img src="${qrCodeDataURL}" alt="QR Code" style="width: 80px; height: 80px;" />`
              : '<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; text-align: center;">QR Code</div>'
          }
        </div>
      </div>
    </div>

    <div class="total-section">
      <div class="total-box">
        <div class="total-label">VALOR CUSTO TOTAL</div>
        <div class="total-value">R$ ${formatarValor(
          req.valor_custo_total || 0
        )}</div>
      </div>
    </div>

    <div class="info-section">
      <h2>🏢 Fornecedor e Cliente</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Fornecedor:</span>
          <span class="value">${req.fornecedor}</span>
        </div>
        ${
          req.cliente_venda
            ? `<div class="info-item"><span class="label">Cliente:</span><span class="value">${
                req.cliente_venda
              }${req.cod_cliente ? ` (${req.cod_cliente})` : ""}</span></div>`
            : ""
        }
      </div>
    </div>

    ${itensHTML}

    <div class="info-section">
      <h2>💰 Valores</h2>
      <div class="info-grid">
        ${
          req.valor_venda
            ? `<div class="info-item"><span class="label">Valor Venda:</span><span class="value">R$ ${formatarValor(
                req.valor_venda
              )}</span></div>`
            : ""
        }
        ${
          req.valor_frete
            ? `<div class="info-item"><span class="label">Valor Frete:</span><span class="value">R$ ${formatarValor(
                req.valor_frete
              )}</span></div>`
            : ""
        }
        <div class="info-item">
          <span class="label">Entrega Direta:</span>
          <span class="value">${req.entrega_direta ? "Sim ✓" : "Não ✗"}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <div class="footer-item">
          <strong>SmartCompras</strong><br>
          Sistema de Gestão de Compras
        </div>
        <div class="footer-item" style="text-align: center;">
          <strong>Documento Gerado em:</strong><br>
          ${formatarDataHora(new Date())}
        </div>
        <div class="footer-item" style="text-align: right;">
          <strong>Francauto Labs</strong><br>
          &copy; 2025 - Todos os direitos reservados
        </div>
      </div>
    </div>
  `;

  return getBaseHTMLTemplate("Requisição de Estoque", content);
}

function gerarHTMLClientes(req: any, qrCodeDataURL: string = ""): string {
  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  const statusClass =
    req.status === "Aprovado"
      ? "status-aprovado"
      : req.status === "Reprovado"
      ? "status-reprovado"
      : "status-pendente";

  const content = `
    <div class="header">
      <div class="header-grid">
        <div class="header-logo">
          ${
            logoExists
              ? `<img src="${logoBase64}" alt="SmartCompras" style="max-width: 100%; max-height: 80px;" />`
              : '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; border-radius: 8px; font-weight: bold; text-align: center;">LOGO</div>'
          }
        </div>
        <div class="header-content">
          <h1>REQUISIÇÃO DE CLIENTE - #${req.id}</h1>
          <div class="header-info">
            <strong>Data Solicitação:</strong> ${formatarData(
              req.data_solicitacao
            )}
            ${
              req.data_aprovacao
                ? ` | <strong>Data Aprovação:</strong> ${formatarData(
                    req.data_aprovacao
                  )}`
                : ""
            }
          </div>
          <div class="header-info">
            <strong>Solicitante:</strong> ${req.solicitante_nome}
            ${
              req.aprovador_nome
                ? ` | <strong>Aprovador:</strong> ${req.aprovador_nome}`
                : ""
            }
          </div>
          <div class="header-info">
            <strong>Status:</strong> <span class="status-badge ${statusClass}">${
    req.status
  }</span>
          </div>
        </div>
        <div class="header-extra">
          ${
            qrCodeDataURL
              ? `<img src="${qrCodeDataURL}" alt="QR Code" style="width: 80px; height: 80px;" />`
              : '<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; text-align: center;">QR Code</div>'
          }
        </div>
      </div>
    </div>

    <div class="info-section">
      <h2>📝 Descrição da Requisição</h2>
      <div class="highlight">${req.descricao}</div>
    </div>

    <div class="total-section">
      <div class="total-box">
        <div class="total-label">VALOR TOTAL</div>
        <div class="total-value">R$ ${formatarValor(req.valor)}</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <div class="footer-item">
          <strong>SmartCompras</strong><br>
          Sistema de Gestão de Compras
        </div>
        <div class="footer-item" style="text-align: center;">
          <strong>Documento Gerado em:</strong><br>
          ${formatarDataHora(new Date())}
        </div>
        <div class="footer-item" style="text-align: right;">
          <strong>Francauto Labs</strong><br>
          &copy; 2025 - Todos os direitos reservados
        </div>
      </div>
    </div>
  `;

  return getBaseHTMLTemplate("Requisição de Cliente", content);
}

function formatarData(data: Date | string): string {
  if (!data) return "N/A";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(data: Date | string): string {
  if (!data) return "N/A";
  const d = new Date(data);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatarValor(valor: number | string): string {
  if (valor === null || valor === undefined) return "0,00";
  const numValue = typeof valor === "string" ? parseFloat(valor) : valor;
  if (isNaN(numValue)) return "0,00";
  return numValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarMoeda(valor: number | string): string {
  return `R$ ${formatarValor(valor)}`;
}

// Função para recuperar o hash da tabela request_relations
async function getHash(
  id_modulo: number,
  id_requisicao: number,
  connection: any
): Promise<string | null> {
  try {
    // Mapeamento dos módulos para as colunas da tabela request_relations
    const moduloColumnMap: { [key: number]: string } = {
      1: "requisicoes_id", // Despesas
      2: "combustivel_request_id", // Combustível Frota
      3: "combustivel_request_estoque_id", // Combustível Estoque
      4: "requisicoes_estoque_id", // Estoque
      5: "cliente_request_id", // Clientes
    };

    const columnName = moduloColumnMap[id_modulo];

    if (!columnName) {
      throw new Error(`Módulo ${id_modulo} não encontrado no mapeamento`);
    }

    const query = `
      SELECT hash_code, usado, funcionario_validador, date_used
      FROM request_relations
      WHERE ${columnName} = ?
    `;

    const [rows]: any = await connection.query(query, [id_requisicao]);

    if (rows.length === 0) {
      console.warn(
        `[QR CODE] Hash não encontrado - Módulo: ${id_modulo}, Requisição: ${id_requisicao}, Coluna: ${columnName}`
      );
      return null;
    }

    console.log(
      `[QR CODE] Hash encontrado - Módulo: ${id_modulo}, Requisição: ${id_requisicao}, Hash: ${rows[0].hash_code}`
    );
    return rows[0].hash_code;
  } catch (error) {
    console.error("Erro ao buscar hash:", error);
    throw error;
  }
}

// Função para gerar QR Code em base64
async function generateQRCode(text: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 150,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("Erro ao gerar QR Code:", error);
    throw error;
  }
}

// ==================== RELATÓRIOS DE ESTOQUE ====================

import RelatorioEstoqueService from "./relatorios/estoque.service";
import {
  IPayloadPDFRelatorio,
  IDadosRelatoriosPDF,
  IFiltroRelatorioEstoque,
} from "../interfaces/relatorios/estoque.interface";

export async function gerarPDFRelatorioEstoque(
  payload: IPayloadPDFRelatorio
): Promise<string> {
  let browser = null;

  try {
    const {
      relatorios,
      dataInicio,
      dataFim,
      tipo_periodo,
      fornecedor,
      solicitante,
      entregaDireta,
    } = payload;

    console.log(
      `📊 Gerando PDF de relatórios de estoque: ${relatorios.join(", ")}`
    );

    // Construir objeto de filtros
    const filtros: IFiltroRelatorioEstoque = {
      dataInicio,
      dataFim,
      tipo_periodo,
      fornecedor,
      solicitante,
      entregaDireta,
    };

    // Buscar dados de todos os relatórios solicitados
    const dadosRelatorios = await RelatorioEstoqueService.getDadosParaPDF(
      relatorios,
      filtros
    );

    // Gerar HTML com os relatórios
    const htmlContent = gerarHTMLRelatorioEstoque(dadosRelatorios, filtros);

    // Gerar nome do arquivo com timestamp
    const timestamp = Date.now();
    const fileName = `relatorio_estoque_${timestamp}.pdf`;
    const pdfPath = path.join(PDF_DIR, fileName);

    // Converter HTML para PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    console.log(`✅ PDF de relatórios de estoque gerado: ${pdfPath}`);
    return pdfPath;
  } catch (error) {
    console.error("❌ Erro ao gerar PDF de relatórios:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function gerarHTMLRelatorioEstoque(
  dados: IDadosRelatoriosPDF,
  filtros: IFiltroRelatorioEstoque
): string {
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  // Formatar datas corretamente sem problemas de fuso horário
  const formatarDataSemFuso = (dataStr: string): string => {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const periodoFormatado = `${formatarDataSemFuso(
    filtros.dataInicio
  )} a ${formatarDataSemFuso(filtros.dataFim)}`;

  let sectionsHTML = "";

  // 1. Valor Compra x Venda
  if (dados.valorCompraVenda && dados.valorCompraVenda.length > 0) {
    const totalCompra = dados.valorCompraVenda.reduce(
      (sum, item) => sum + parseFloat(item.valorTotalCompra.toString()),
      0
    );
    const totalVenda = dados.valorCompraVenda.reduce(
      (sum, item) => sum + parseFloat(item.valorTotalVenda.toString()),
      0
    );
    const totalMargem = totalVenda - totalCompra;
    const totalPercentual =
      totalCompra > 0 ? (totalMargem / totalCompra) * 100 : 0;

    sectionsHTML += `
      <div class="info-section">
        <h2>📊 Análise de Compra x Venda</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">Período</th>
              <th style="width: 16%; text-align: right;">Valor Compra</th>
              <th style="width: 16%; text-align: right;">Valor Venda</th>
              <th style="width: 16%; text-align: right;">Margem (R$)</th>
              <th style="width: 12%; text-align: center;">Margem %</th>
              <th style="width: 10%; text-align: center;">Requisições</th>
            </tr>
          </thead>
          <tbody>
            ${dados.valorCompraVenda
              .map((item) => {
                const margem = parseFloat(item.margem.toString());
                const margemClass =
                  margem >= 0
                    ? "color: #2E7D32; font-weight: 600;"
                    : "color: #C62828; font-weight: 600;";
                return `
              <tr>
                <td><strong>${item.periodo}</strong></td>
                <td style="text-align: right;">${formatarMoeda(
                  item.valorTotalCompra
                )}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.valorTotalVenda
                )}</td>
                <td style="text-align: right; ${margemClass}">${formatarMoeda(
                  margem
                )}</td>
                <td style="text-align: center; ${margemClass}">${parseFloat(
                  item.margemPercentual.toString()
                ).toFixed(1)}%</td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
              </tr>
            `;
              })
              .join("")}
            <tr style="background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); font-weight: 700; border-top: 2px solid #1976D2;">
              <td><strong>TOTAL GERAL</strong></td>
              <td style="text-align: right;">${formatarMoeda(totalCompra)}</td>
              <td style="text-align: right;">${formatarMoeda(totalVenda)}</td>
              <td style="text-align: right; color: ${
                totalMargem >= 0 ? "#2E7D32" : "#C62828"
              };">${formatarMoeda(totalMargem)}</td>
              <td style="text-align: center; color: ${
                totalPercentual >= 0 ? "#2E7D32" : "#C62828"
              }; font-size: 12px;">${totalPercentual.toFixed(1)}%</td>
              <td style="text-align: center;">${dados.valorCompraVenda.reduce(
                (sum, item) => sum + item.quantidadeRequisicoes,
                0
              )}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // 2. Valor de Frete
  if (dados.valorFrete && dados.valorFrete.length > 0) {
    const totalFrete = dados.valorFrete.reduce(
      (sum, item) => sum + parseFloat(item.valorTotalFrete.toString()),
      0
    );
    const totalReqs = dados.valorFrete.reduce(
      (sum, item) => sum + item.quantidadeRequisicoes,
      0
    );
    const mediaGeral = totalReqs > 0 ? totalFrete / totalReqs : 0;

    sectionsHTML += `
      <div class="info-section">
        <h2>🚚 Análise de Custos com Frete</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Período</th>
              <th style="width: 25%; text-align: right;">Valor Total Frete</th>
              <th style="width: 20%; text-align: center;">Requisições</th>
              <th style="width: 25%; text-align: right;">Média por Requisição</th>
            </tr>
          </thead>
          <tbody>
            ${dados.valorFrete
              .map(
                (item) => `
              <tr>
                <td><strong>${item.periodo}</strong></td>
                <td style="text-align: right; color: #F57C00; font-weight: 600;">${formatarMoeda(
                  item.valorTotalFrete
                )}</td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.mediaFretePorRequisicao
                )}</td>
              </tr>
            `
              )
              .join("")}
            <tr style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); font-weight: 700; border-top: 2px solid #F57C00;">
              <td><strong>TOTAL GERAL</strong></td>
              <td style="text-align: right; color: #E65100; font-size: 12px;">${formatarMoeda(
                totalFrete
              )}</td>
              <td style="text-align: center;">${totalReqs}</td>
              <td style="text-align: right; font-size: 11px;">${formatarMoeda(
                mediaGeral
              )}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // 3. Requisições por Solicitante
  if (dados.porSolicitante && dados.porSolicitante.length > 0) {
    sectionsHTML += `
      <div class="info-section">
        <h2>👥 Análise por Solicitante (Top 20)</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 30%;">Solicitante</th>
              <th style="width: 12%; text-align: center;">Qtd Req.</th>
              <th style="width: 18%; text-align: right;">Valor Gasto</th>
              <th style="width: 18%; text-align: right;">Valor Vendido</th>
              <th style="width: 17%; text-align: right;">Margem</th>
            </tr>
          </thead>
          <tbody>
            ${dados.porSolicitante
              .slice(0, 20)
              .map((item, index) => {
                const margem = parseFloat(item.margem.toString());
                const margemClass =
                  margem >= 0
                    ? "color: #2E7D32; font-weight: 600;"
                    : "color: #C62828; font-weight: 600;";
                const rowStyle =
                  index < 3
                    ? "background-color: #FFF9C4; font-weight: 600;"
                    : "";
                return `
              <tr style="${rowStyle}">
                <td style="text-align: center; color: #666; font-weight: 600;">${
                  index + 1
                }º</td>
                <td><strong>${item.solicitante}</strong></td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.valorBrutoGasto
                )}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.valorVendido
                )}</td>
                <td style="text-align: right; ${margemClass}">${formatarMoeda(
                  margem
                )}</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
        ${
          dados.porSolicitante.length > 20
            ? `<p style="text-align: center; color: #666; font-style: italic; margin-top: 5px; font-size: 9px;">Exibindo top 20 de ${dados.porSolicitante.length} solicitantes</p>`
            : ""
        }
      </div>
    `;
  }

  // 4. Entregas Diretas
  if (dados.entregasDiretas && dados.entregasDiretas.length > 0) {
    sectionsHTML += `
      <div class="info-section">
        <h2>📦 Entregas Diretas por Período</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 40%;">Período</th>
              <th style="width: 30%; text-align: center;">Quantidade</th>
              <th style="width: 30%; text-align: right;">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${dados.entregasDiretas
              .map(
                (item) => `
              <tr>
                <td><strong>${item.periodo}</strong></td>
                <td style="text-align: center;">${item.quantidadeEntregas}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.valorTotal
                )}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // 5. Resumo Geral
  let resumoGeralHTML = "";
  if (dados.resumoGeral) {
    const resumo = dados.resumoGeral;
    resumoGeralHTML = `
      <div class="info-section">
        <h2>📈 Resumo Geral</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Total Requisições:</span>
            <span class="value">${resumo.totais.requisicoes}</span>
          </div>
          <div class="info-item">
            <span class="label">Entregas Diretas:</span>
            <span class="value">${resumo.totais.entregasDiretas}</span>
          </div>
          <div class="info-item">
            <span class="label">Valor Compra:</span>
            <span class="value">${formatarMoeda(
              resumo.totais.valorCompra
            )}</span>
          </div>
          <div class="info-item">
            <span class="label">Valor Venda:</span>
            <span class="value">${formatarMoeda(
              resumo.totais.valorVenda
            )}</span>
          </div>
          <div class="info-item">
            <span class="label">Valor Frete:</span>
            <span class="value">${formatarMoeda(
              resumo.totais.valorFrete
            )}</span>
          </div>
          <div class="info-item">
            <span class="label">Margem Total:</span>
            <span class="value value-box">${formatarMoeda(
              resumo.totais.margem
            )}</span>
          </div>
        </div>
      </div>
    `;
  }

  // 6. Todas as Requisições
  if (dados.todas && dados.todas.length > 0) {
    sectionsHTML += `
      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; color: #fff; margin-bottom: 10px; padding: 8px 12px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); border-radius: 5px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📄 Todas as Requisições (${
          dados.todas.length
        })</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">ID</th>
              <th style="width: 9%;">Data</th>
              <th style="width: 15%;">Fornecedor</th>
              <th style="width: 15%;">Cliente</th>
              <th style="width: 8%;">Cód.</th>
              <th style="width: 12%; text-align: right;">Valor Compra</th>
              <th style="width: 12%; text-align: right;">Valor Venda</th>
              <th style="width: 9%; text-align: right;">Frete</th>
              <th style="width: 15%;">Solicitante</th>
            </tr>
          </thead>
          <tbody>
            ${dados.todas
              .slice(0, 100)
              .map(
                (item) => `
              <tr>
                <td style="text-align: center;">${item.id}</td>
                <td>${item.data_requisicao}</td>
                <td>${item.fornecedor}</td>
                <td>${item.cliente_venda}</td>
                <td>${item.cod_cliente}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.valor_custo_total
                )}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.valor_venda
                )}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.valor_frete
                )}</td>
                <td>${item.nome_solicitante}</td>
              </tr>
            `
              )
              .join("")}
            ${
              dados.todas.length > 100
                ? `<tr><td colspan="9" style="text-align: center; font-style: italic; color: #666;">... e mais ${
                    dados.todas.length - 100
                  } requisições</td></tr>`
                : ""
            }
          </tbody>
        </table>
      </div>
    `;
  }

  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  const content = `
    <div class="header">
      <div class="header-grid">
        <div class="header-logo">
          ${
            logoExists
              ? `<img src="${logoBase64}" alt="SmartCompras Logo" style="max-width:100%;height:auto;max-height:60px;">`
              : '<div style="color:#ccc;font-size:10px;">LOGO</div>'
          }
        </div>
        <div class="header-content">
          <h1>📊 Relatório de Estoque</h1>
          <div class="header-info">
            <strong>Data de Geração:</strong> ${dataAtual}
            ${
              filtros.fornecedor
                ? `<br><strong>Filtro - Fornecedor:</strong> ${filtros.fornecedor}`
                : ""
            }
            ${
              filtros.solicitante
                ? `<br><strong>Filtro - Solicitante ID:</strong> ${filtros.solicitante}`
                : ""
            }
            ${
              filtros.tipo_periodo
                ? `<br><strong>Agrupamento:</strong> ${
                    filtros.tipo_periodo === "dia"
                      ? "Diário"
                      : filtros.tipo_periodo === "semana"
                      ? "Semanal"
                      : filtros.tipo_periodo === "mes"
                      ? "Mensal"
                      : "Anual"
                  }`
                : ""
            }
          </div>
        </div>
        <div class="header-extra">
          <div style="font-size: 10px; color: #666; text-align: center;">
            <strong style="display: block; margin-bottom: 5px;">Status</strong>
            <span class="status-badge status-aprovado">✓ Aprovado</span>
          </div>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); padding: 15px 20px; border-radius: 8px; margin-bottom: 15px; border-left: 5px solid #1976D2; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
        <div style="font-size: 24px;">📅</div>
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #1976D2; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Período do Relatório</div>
          <div style="font-size: 16px; color: #0D47A1; font-weight: 700;">${periodoFormatado}</div>
        </div>
      </div>
    </div>

    ${resumoGeralHTML}

    ${sectionsHTML}

    <div class="footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <div class="footer-item">
          <strong>SMARTCOMPRAS</strong><br>
          Sistema de Gestão de Compras<br>
          Relatório de Estoque
        </div>
        <div class="footer-item" style="text-align: center;">
          <strong>Gerado em</strong><br>
          ${dataAtual}<br>
          <em style="color: #999; font-size: 8px;">Documento gerado automaticamente</em>
        </div>
        <div class="footer-item" style="text-align: right;">
          <strong>Francauto</strong><br>
          www.francauto.com.br<br>
          <em style="color: #999; font-size: 8px;">Todos os direitos reservados</em>
        </div>
      </div>
    </div>
  `;

  return getBaseHTMLTemplate("Relatório de Estoque", content);
}

// ==================== RELATÓRIOS DE COMBUSTÍVEL ESTOQUE ====================

import RelatorioCombustivelEstoqueService from "./relatorios/combustivel-estoque.service";
import {
  IPayloadPDFRelatorioCombustivel,
  IDadosRelatoriosCombustivelPDF,
  IFiltroRelatorioCombustivelEstoque,
} from "../interfaces/relatorios/combustivel-estoque.interface";

export async function gerarPDFRelatorioCombustivelEstoque(
  payload: IPayloadPDFRelatorioCombustivel
): Promise<string> {
  let browser = null;

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
    } = payload;

    console.log(
      `📊 Gerando PDF de relatórios de combustível estoque: ${relatorios.join(
        ", "
      )}`
    );

    // Construir objeto de filtros
    const filtros: IFiltroRelatorioCombustivelEstoque = {
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
    };

    // Buscar dados de todos os relatórios solicitados
    const dadosRelatorios =
      await RelatorioCombustivelEstoqueService.getDadosParaPDF(
        relatorios,
        filtros
      );

    // Gerar HTML com os relatórios
    const htmlContent = gerarHTMLRelatorioCombustivelEstoque(
      dadosRelatorios,
      filtros
    );

    // Gerar nome do arquivo com timestamp
    const timestamp = Date.now();
    const fileName = `relatorio_combustivel_estoque_${timestamp}.pdf`;
    const pdfPath = path.join(PDF_DIR, fileName);

    // Converter HTML para PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    console.log(
      `✅ PDF de relatórios de combustível estoque gerado: ${pdfPath}`
    );
    return pdfPath;
  } catch (error) {
    console.error(
      "❌ Erro ao gerar PDF de relatórios de combustível estoque:",
      error
    );
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper para formatar período de forma amigável no PDF
function formatarPeriodoPDF(periodo: string, tipoPeriodo?: string): string {
  if (!periodo) return periodo;

  // Se for ano (número puro)
  if (/^\d{4}$/.test(periodo)) {
    return periodo;
  }

  // Se for semana (formato: 202445)
  if (/^\d{6}$/.test(periodo) && tipoPeriodo === "semana") {
    const ano = periodo.substring(0, 4);
    const semana = periodo.substring(4);
    return `Semana ${semana}/${ano}`;
  }

  // Se for mês (formato: YYYY-MM)
  if (/^\d{4}-\d{2}$/.test(periodo)) {
    const [ano, mes] = periodo.split("-");
    return `${mes}/${ano}`;
  }

  // Se for data (formato: YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(periodo)) {
    const [ano, mes, dia] = periodo.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  // Retornar como está se não reconhecer o formato
  return periodo;
}

function gerarHTMLRelatorioCombustivelEstoque(
  dados: IDadosRelatoriosCombustivelPDF,
  filtros: IFiltroRelatorioCombustivelEstoque
): string {
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  // Formatar datas corretamente sem problemas de fuso horário
  const formatarDataSemFuso = (dataStr: string): string => {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const periodoFormatado = `${formatarDataSemFuso(
    filtros.dataInicio
  )} a ${formatarDataSemFuso(filtros.dataFim)}`;

  let sectionsHTML = "";

  // 1. Consumo por Veículo
  if (dados.consumoPorVeiculo && dados.consumoPorVeiculo.length > 0) {
    sectionsHTML += `
      <div class="info-section">
        <h2>🚗 Consumo por Veículo</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Placa</th>
              <th style="width: 10%;">Chassi</th>
              <th style="width: 15%;">Marca/Modelo</th>
              <th style="width: 12%;">Tipo</th>
              <th style="width: 13%; text-align: right;">Total Litros</th>
              <th style="width: 10%; text-align: center;">Requisições</th>
              <th style="width: 13%; text-align: right;">Média Litros</th>
              <th style="width: 15%;">Departamento</th>
            </tr>
          </thead>
          <tbody>
            ${dados.consumoPorVeiculo
              .slice(0, 50)
              .map(
                (item) => `
              <tr>
                <td>${item.placa || "-"}</td>
                <td>${item.chassi || "-"}</td>
                <td><strong>${item.marca} ${item.modelo}</strong></td>
                <td>${item.tipo_combustivel || "-"}</td>
                <td style="text-align: right; font-weight: 600; color: #F57C00;">${item.totalLitros.toFixed(
                  2
                )}L</td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
                <td style="text-align: right;">${item.mediaLitrosPorRequisicao.toFixed(
                  2
                )}L</td>
                <td>${item.departamento_nome || "-"}</td>
              </tr>
            `
              )
              .join("")}
            ${
              dados.consumoPorVeiculo.length > 50
                ? `<tr><td colspan="8" style="text-align: center; font-style: italic; color: #666;">Exibindo top 50 de ${dados.consumoPorVeiculo.length} veículos</td></tr>`
                : ""
            }
          </tbody>
        </table>
      </div>
    `;
  }

  // 2. Análise Temporal
  if (dados.analiseTemporal && dados.analiseTemporal.length > 0) {
    const totalLitros = dados.analiseTemporal.reduce(
      (sum, item) => sum + parseFloat(item.totalLitros.toString()),
      0
    );
    const totalReqs = dados.analiseTemporal.reduce(
      (sum, item) => sum + item.quantidadeRequisicoes,
      0
    );

    sectionsHTML += `
      <div class="info-section">
        <h2>📅 Análise Temporal de Consumo</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Período</th>
              <th style="width: 20%; text-align: right;">Total Litros</th>
              <th style="width: 15%; text-align: center;">Requisições</th>
              <th style="width: 20%; text-align: right;">Média Litros/Req</th>
              <th style="width: 20%; text-align: center;">Veículos Únicos</th>
            </tr>
          </thead>
          <tbody>
            ${dados.analiseTemporal
              .map(
                (item) => `
              <tr>
                <td><strong>${formatarPeriodoPDF(
                  item.periodo.toString(),
                  filtros.tipo_periodo
                )}</strong></td>
                <td style="text-align: right; color: #F57C00; font-weight: 600;">${parseFloat(
                  item.totalLitros.toString()
                ).toFixed(2)}L</td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
                <td style="text-align: right;">${parseFloat(
                  item.mediaLitrosPorRequisicao.toString()
                ).toFixed(2)}L</td>
                <td style="text-align: center;">${item.veiculosUnicos}</td>
              </tr>
            `
              )
              .join("")}
            <tr style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); font-weight: 700; border-top: 2px solid #F57C00;">
              <td><strong>TOTAL</strong></td>
              <td style="text-align: right; color: #E65100;">${totalLitros.toFixed(
                2
              )}L</td>
              <td style="text-align: center;">${totalReqs}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // 3. Por Tipo de Combustível
  if (dados.porTipoCombustivel && dados.porTipoCombustivel.length > 0) {
    sectionsHTML += `
      <div class="info-section">
        <h2>⛽ Análise por Tipo de Combustível</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Tipo</th>
              <th style="width: 20%; text-align: right;">Total Litros</th>
              <th style="width: 15%; text-align: center;">Requisições</th>
              <th style="width: 15%; text-align: center;">% do Total</th>
              <th style="width: 25%; text-align: right;">Média por Req</th>
            </tr>
          </thead>
          <tbody>
            ${dados.porTipoCombustivel
              .map(
                (item) => `
              <tr>
                <td><strong>${item.tipo_combustivel}</strong></td>
                <td style="text-align: right; font-weight: 600; color: #F57C00;">${parseFloat(
                  item.totalLitros.toString()
                ).toFixed(2)}L</td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
                <td style="text-align: center; font-weight: 600; color: #1976D2;">${parseFloat(
                  item.percentualTotal.toString()
                ).toFixed(1)}%</td>
                <td style="text-align: right;">${parseFloat(
                  item.mediaLitrosPorRequisicao.toString()
                ).toFixed(2)}L</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // 4. Por Departamento
  if (dados.porDepartamento && dados.porDepartamento.length > 0) {
    sectionsHTML += `
      <div class="info-section">
        <h2>🏢 Consumo por Departamento</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Departamento</th>
              <th style="width: 18%; text-align: right;">Total Litros</th>
              <th style="width: 13%; text-align: center;">Requisições</th>
              <th style="width: 13%; text-align: center;">Veículos</th>
              <th style="width: 26%; text-align: right;">Média Litros/Req</th>
            </tr>
          </thead>
          <tbody>
            ${dados.porDepartamento
              .map(
                (item) => `
              <tr>
                <td><strong>${item.departamento_nome}</strong></td>
                <td style="text-align: right; font-weight: 600; color: #F57C00;">${parseFloat(
                  item.totalLitros.toString()
                ).toFixed(2)}L</td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
                <td style="text-align: center;">${item.veiculosUnicos}</td>
                <td style="text-align: right;">${parseFloat(
                  item.mediaLitrosPorRequisicao.toString()
                ).toFixed(2)}L</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // 5. Por Solicitante
  if (dados.porSolicitante && dados.porSolicitante.length > 0) {
    sectionsHTML += `
      <div class="info-section">
        <h2>👥 Análise por Solicitante (Top 20)</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 35%;">Solicitante</th>
              <th style="width: 15%; text-align: center;">Requisições</th>
              <th style="width: 22%; text-align: right;">Total Litros</th>
              <th style="width: 23%; text-align: right;">Média Litros/Req</th>
            </tr>
          </thead>
          <tbody>
            ${dados.porSolicitante
              .slice(0, 20)
              .map((item, index) => {
                const rowStyle =
                  index < 3
                    ? "background-color: #FFF9C4; font-weight: 600;"
                    : "";
                return `
              <tr style="${rowStyle}">
                <td style="text-align: center; color: #666; font-weight: 600;">${
                  index + 1
                }º</td>
                <td><strong>${item.solicitante}</strong></td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
                <td style="text-align: right; color: #F57C00; font-weight: 600;">${parseFloat(
                  item.totalLitros.toString()
                ).toFixed(2)}L</td>
                <td style="text-align: right;">${parseFloat(
                  item.mediaLitrosPorRequisicao.toString()
                ).toFixed(2)}L</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
        ${
          dados.porSolicitante.length > 20
            ? `<p style="text-align: center; color: #666; font-style: italic; margin-top: 5px; font-size: 9px;">Exibindo top 20 de ${dados.porSolicitante.length} solicitantes</p>`
            : ""
        }
      </div>
    `;
  }

  // 6. Por Marca/Modelo
  if (dados.porMarcaModelo && dados.porMarcaModelo.length > 0) {
    sectionsHTML += `
      <div class="info-section">
        <h2>🚙 Consumo por Marca/Modelo (Top 20)</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Marca</th>
              <th style="width: 25%;">Modelo</th>
              <th style="width: 15%; text-align: right;">Total Litros</th>
              <th style="width: 12%; text-align: center;">Requisições</th>
              <th style="width: 11%; text-align: center;">Veículos</th>
              <th style="width: 12%; text-align: right;">Média/Veíc.</th>
            </tr>
          </thead>
          <tbody>
            ${dados.porMarcaModelo
              .slice(0, 20)
              .map(
                (item) => `
              <tr>
                <td><strong>${item.marca}</strong></td>
                <td>${item.modelo}</td>
                <td style="text-align: right; font-weight: 600; color: #F57C00;">${parseFloat(
                  item.totalLitros.toString()
                ).toFixed(2)}L</td>
                <td style="text-align: center;">${
                  item.quantidadeRequisicoes
                }</td>
                <td style="text-align: center;">${item.veiculosUnicos}</td>
                <td style="text-align: right;">${parseFloat(
                  item.mediaLitrosPorVeiculo.toString()
                ).toFixed(2)}L</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        ${
          dados.porMarcaModelo.length > 20
            ? `<p style="text-align: center; color: #666; font-style: italic; margin-top: 5px; font-size: 9px;">Exibindo top 20 de ${dados.porMarcaModelo.length} modelos</p>`
            : ""
        }
      </div>
    `;
  }

  // 7. Tempo de Aprovação - REMOVIDO

  // 8. Resumo Geral
  let resumoGeralHTML = "";
  if (dados.resumoGeral) {
    const resumo = dados.resumoGeral;
    resumoGeralHTML = `
      <div class="info-section">
        <h2>📈 Resumo Geral</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Total Requisições:</span>
            <span class="value">${resumo.totais.requisicoes}</span>
          </div>
          <div class="info-item">
            <span class="label">Total Litros:</span>
            <span class="value value-box">${resumo.totais.litros.toFixed(
              2
            )}L</span>
          </div>
          <div class="info-item">
            <span class="label">Veículos Únicos:</span>
            <span class="value">${resumo.totais.veiculosUnicos}</span>
          </div>
          <div class="info-item">
            <span class="label">Média Litros/Req:</span>
            <span class="value">${resumo.totais.mediaLitrosPorRequisicao.toFixed(
              2
            )}L</span>
          </div>
        </div>
      </div>
    `;
  }

  // 9. Todas as Requisições
  if (dados.todas && dados.todas.length > 0) {
    sectionsHTML += `
      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; color: #fff; margin-bottom: 10px; padding: 8px 12px; background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); border-radius: 5px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📄 Todas as Requisições (${
          dados.todas.length
        })</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">ID</th>
              <th style="width: 8%;">Placa</th>
              <th style="width: 12%;">Marca/Modelo</th>
              <th style="width: 8%;">Tipo</th>
              <th style="width: 10%; text-align: right;">Litros</th>
              <th style="width: 10%;">Data</th>
              <th style="width: 8%;">Status</th>
              <th style="width: 15%;">Solicitante</th>
              <th style="width: 12%;">Departamento</th>
            </tr>
          </thead>
          <tbody>
            ${dados.todas
              .slice(0, 100)
              .map(
                (item) => `
              <tr>
                <td style="text-align: center;">${item.id}</td>
                <td>${item.placa || item.chassi || "-"}</td>
                <td>${item.marca} ${item.modelo}</td>
                <td>${item.tipo_combustivel || "-"}</td>
                <td style="text-align: right; font-weight: 600;">${parseFloat(
                  item.quantidade_litros.toString()
                ).toFixed(2)}L</td>
                <td style="font-size: 9px;">${item.data_solicitacao}</td>
                <td><span class="status-badge status-${item.status.toLowerCase()}">${
                  item.status
                }</span></td>
                <td>${item.nome_solicitante}</td>
                <td>${item.departamento_nome || "-"}</td>
              </tr>
            `
              )
              .join("")}
            ${
              dados.todas.length > 100
                ? `<tr><td colspan="9" style="text-align: center; font-style: italic; color: #666;">... e mais ${
                    dados.todas.length - 100
                  } requisições</td></tr>`
                : ""
            }
          </tbody>
        </table>
      </div>
    `;
  }

  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  const content = `
    <div class="header">
      <div class="header-grid">
        <div class="header-logo">
          ${
            logoExists
              ? `<img src="${logoBase64}" alt="SmartCompras Logo" style="max-width:100%;height:auto;max-height:60px;">`
              : '<div style="color:#ccc;font-size:10px;">LOGO</div>'
          }
        </div>
        <div class="header-content">
          <h1>⛽ Relatório de Combustível - Estoque</h1>
          <div class="header-info">
            <strong>Data de Geração:</strong> ${dataAtual}
            ${
              filtros.tipo_combustivel
                ? `<br><strong>Filtro - Tipo:</strong> ${filtros.tipo_combustivel}`
                : ""
            }
            ${
              filtros.placa
                ? `<br><strong>Filtro - Placa:</strong> ${filtros.placa}`
                : ""
            }
            ${
              filtros.departamento
                ? `<br><strong>Filtro - Departamento ID:</strong> ${filtros.departamento}`
                : ""
            }
            ${
              filtros.tipo_periodo
                ? `<br><strong>Agrupamento:</strong> ${
                    filtros.tipo_periodo === "dia"
                      ? "Diário"
                      : filtros.tipo_periodo === "semana"
                      ? "Semanal"
                      : filtros.tipo_periodo === "mes"
                      ? "Mensal"
                      : "Anual"
                  }`
                : ""
            }
          </div>
        </div>
        <div class="header-extra">
          <div style="font-size: 10px; color: #666; text-align: center;">
            <strong style="display: block; margin-bottom: 5px;">Status</strong>
            <span class="status-badge status-aprovado">✓ Aprovado</span>
          </div>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); padding: 15px 20px; border-radius: 8px; margin-bottom: 15px; border-left: 5px solid #F57C00; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
        <div style="font-size: 24px;">📅</div>
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #F57C00; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Período do Relatório</div>
          <div style="font-size: 16px; color: #E65100; font-weight: 700;">${periodoFormatado}</div>
        </div>
      </div>
    </div>

    ${resumoGeralHTML}

    ${sectionsHTML}

    <div class="footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <div class="footer-item">
          <strong>SMARTCOMPRAS</strong><br>
          Sistema de Gestão de Compras<br>
          Relatório de Combustível - Estoque
        </div>
        <div class="footer-item" style="text-align: center;">
          <strong>Gerado em</strong><br>
          ${dataAtual}<br>
          <em style="color: #999; font-size: 8px;">Documento gerado automaticamente</em>
        </div>
        <div class="footer-item" style="text-align: right;">
          <strong>Francauto</strong><br>
          www.francauto.com.br<br>
          <em style="color: #999; font-size: 8px;">Todos os direitos reservados</em>
        </div>
      </div>
    </div>
  `;

  return getBaseHTMLTemplate("Relatório de Combustível - Estoque", content);
}

// ==================== RELATÓRIOS DE CLIENTE ====================

import RelatorioClienteService from "./relatorios/cliente.service";
import {
  IPayloadPDFRelatorioCliente,
  IDadosRelatoriosClientePDF,
  IFiltroRelatorioCliente,
} from "../interfaces/relatorios/cliente.interface";

export async function gerarPDFRelatorioCliente(
  payload: IPayloadPDFRelatorioCliente
): Promise<string> {
  let browser = null;

  try {
    const { dataInicio, dataFim, solicitante, aprovador, status } = payload;

    console.log(`📊 Gerando PDF de relatórios de cliente`);

    // Construir objeto de filtros
    const filtros: IFiltroRelatorioCliente = {
      dataInicio,
      dataFim,
      solicitante,
      aprovador,
      status,
    };

    // Buscar dados
    const dadosRelatorios = await RelatorioClienteService.getDadosParaPDF(
      filtros
    );

    // Gerar HTML
    const htmlContent = gerarHTMLRelatorioCliente(dadosRelatorios, filtros);

    // Gerar nome do arquivo com timestamp
    const timestamp = Date.now();
    const fileName = `relatorio_cliente_${timestamp}.pdf`;
    const pdfPath = path.join(PDF_DIR, fileName);

    // Converter HTML para PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    console.log(`✅ PDF de relatórios de cliente gerado: ${pdfPath}`);
    return pdfPath;
  } catch (error) {
    console.error("❌ Erro ao gerar PDF de relatórios de cliente:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function gerarHTMLRelatorioCliente(
  dados: IDadosRelatoriosClientePDF,
  filtros: IFiltroRelatorioCliente
): string {
  // Carregar logo em base64
  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  // Formatar datas sem problemas de fuso horário
  const formatarDataSemFuso = (dataStr: string): string => {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  // Data atual formatada
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Formatar período
  const dataInicioFormatada = formatarDataSemFuso(filtros.dataInicio);
  const dataFimFormatada = formatarDataSemFuso(filtros.dataFim);
  const periodoFormatado = `${dataInicioFormatada} a ${dataFimFormatada}`;

  let sectionsHTML = "";

  // Todas as Requisições
  if (dados.todas && dados.todas.length > 0) {
    const totalValor = dados.todas.reduce(
      (sum, item) => sum + parseFloat(item.valor.toString()),
      0
    );

    sectionsHTML += `
      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; color: #fff; margin-bottom: 10px; padding: 8px 12px; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); border-radius: 5px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📋 Todas as Requisições de Cliente</h2>
        <p style="margin-bottom: 15px; color: #666;">Total de ${
          dados.todas.length
        } requisições | Valor Total: <strong style="color: #4CAF50;">R$ ${totalValor.toFixed(
      2
    )}</strong></p>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">ID</th>
              <th style="width: 30%;">Descrição</th>
              <th style="width: 10%; text-align: right;">Valor</th>
              <th style="width: 12%; text-align: center;">Data Solicitação</th>
              <th style="width: 12%; text-align: center;">Data Aprovação</th>
              <th style="width: 8%; text-align: center;">Status</th>
              <th style="width: 15%;">Solicitante</th>
              <th style="width: 8%; text-align: center;">Impresso</th>
            </tr>
          </thead>
          <tbody>
            ${dados.todas
              .slice(0, 100)
              .map((item) => {
                const statusColor =
                  item.status === "Aprovado"
                    ? "#4CAF50"
                    : item.status === "Pendente"
                    ? "#FF9800"
                    : "#F44336";

                return `
              <tr>
                <td style="text-align: center;"><strong>${item.id}</strong></td>
                <td style="font-size: 11px;">${item.descricao || "-"}</td>
                <td style="text-align: right; font-weight: 600; color: #4CAF50;">R$ ${parseFloat(
                  item.valor.toString()
                ).toFixed(2)}</td>
                <td style="text-align: center;">${item.data_solicitacao}</td>
                <td style="text-align: center;">${
                  item.data_aprovacao || "-"
                }</td>
                <td style="text-align: center;">
                  <span style="background: ${statusColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;">
                    ${item.status}
                  </span>
                </td>
                <td style="font-size: 11px;">${item.nome_solicitante}</td>
                <td style="text-align: center;">${
                  item.impresso ? "✓" : "-"
                }</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
        ${
          dados.todas.length > 100
            ? `<p style="margin-top: 15px; color: #666; font-style: italic;">* Exibindo as primeiras 100 requisições de ${dados.todas.length} total</p>`
            : ""
        }
      </div>
    `;
  }

  const content = `
    <div class="header">
      <div class="header-grid">
        <div class="header-logo">
          ${
            logoExists
              ? `<img src="${logoBase64}" alt="SmartCompras Logo" style="max-width:100%;height:auto;max-height:60px;">`
              : '<div style="color:#ccc;font-size:10px;">LOGO</div>'
          }
        </div>
        <div class="header-content">
          <h1>👥 Relatório de Requisições de Cliente</h1>
          <div class="header-info">
            <strong>Data de Geração:</strong> ${dataAtual}
            ${
              filtros.solicitante
                ? `<br><strong>Filtro - Solicitante ID:</strong> ${filtros.solicitante}`
                : ""
            }
            ${
              filtros.aprovador
                ? `<br><strong>Filtro - Aprovador ID:</strong> ${filtros.aprovador}`
                : ""
            }
            ${
              filtros.status
                ? `<br><strong>Filtro - Status:</strong> ${filtros.status}`
                : ""
            }
          </div>
        </div>
        <div class="header-extra">
          <div style="font-size: 10px; color: #666; text-align: center;">
            <strong style="display: block; margin-bottom: 5px;">Status</strong>
            <span class="status-badge status-aprovado">✓ Aprovado</span>
          </div>
        </div>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); padding: 15px 20px; border-radius: 8px; margin-bottom: 15px; border-left: 5px solid #2E7D32; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
        <div style="font-size: 24px;">📅</div>
        <div style="text-align: center;">
          <div style="font-size: 11px; color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Período do Relatório</div>
          <div style="font-size: 16px; color: white; font-weight: 700;">${periodoFormatado}</div>
        </div>
      </div>
    </div>
    ${sectionsHTML}
    <div class="footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <div class="footer-item">
          <strong>SMARTCOMPRAS</strong><br>
          Sistema de Gestão de Compras<br>
          Relatório de Cliente
        </div>
        <div class="footer-item" style="text-align: center;">
          <strong>Gerado em</strong><br>
          ${dataAtual}<br>
          <em style="color: #999; font-size: 8px;">Documento gerado automaticamente</em>
        </div>
        <div class="footer-item" style="text-align: right;">
          <strong>Francauto</strong><br>
          www.francauto.com.br<br>
          <em style="color: #999; font-size: 8px;">Todos os direitos reservados</em>
        </div>
      </div>
    </div>
  `;

  return getBaseHTMLTemplate("Relatório de Cliente", content);
}

// ==================== RELATÓRIOS DE DESPESAS ====================

import RelatorioDespesasService from "./relatorios/despesas.service";
import {
  IPayloadPDFRelatorioDespesas,
  IDadosRelatoriosDespesasPDF,
  IFiltroRelatorioDespesas,
} from "../interfaces/relatorios/despesas.interface";

export async function gerarPDFRelatorioDespesas(
  payload: IPayloadPDFRelatorioDespesas
): Promise<string> {
  let browser = null;

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
    } = payload;

    console.log(
      `📊 Gerando PDF de relatórios de despesas: ${relatorios.join(", ")}`
    );

    // Construir objeto de filtros
    const filtros: IFiltroRelatorioDespesas = {
      dataInicio,
      dataFim,
      tipo_periodo,
      solicitante,
      aprovador,
      departamento,
      status,
    };

    // Buscar dados
    const dados = await RelatorioDespesasService.getDadosParaPDF(
      relatorios,
      filtros
    );

    // Gerar HTML
    const html = gerarHTMLRelatorioDespesas(dados, filtros);

    // Configurar Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Gerar PDF
    const timestamp = Date.now();
    const filename = `relatorio_despesas_${timestamp}.pdf`;
    const pdfPath = path.join(__dirname, "../../pdfs", filename);

    await page.pdf({
      path: pdfPath,
      format: "A4",
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      printBackground: true,
    });

    console.log(`✅ PDF gerado: ${pdfPath}`);

    await browser.close();
    return pdfPath;
  } catch (error) {
    console.error("❌ Erro ao gerar PDF de despesas:", error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

function gerarHTMLRelatorioDespesas(
  dados: IDadosRelatoriosDespesasPDF,
  filtros: IFiltroRelatorioDespesas
): string {
  // Carregar logo em base64
  const logoPath = path.join(__dirname, "../../assets/SMARTCOMPRAS.svg");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists
    ? `data:image/svg+xml;base64,${fs
        .readFileSync(logoPath)
        .toString("base64")}`
    : "";

  // Formatar datas sem problemas de fuso horário
  const formatarDataSemFuso = (dataStr: string): string => {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  // Formatar período para exibição no PDF
  const formatarPeriodoPDF = (
    periodo: string,
    tipo_periodo?: string
  ): string => {
    switch (tipo_periodo) {
      case "dia":
        return formatarDataSemFuso(periodo);
      case "semana":
        const ano = periodo.substring(0, 4);
        const semana = periodo.substring(4);
        return `Semana ${semana}/${ano}`;
      case "mes":
        const [anoMes, mes] = periodo.split("-");
        return `${mes}/${anoMes}`;
      case "ano":
        return periodo;
      default:
        return periodo.includes("-")
          ? `${periodo.split("-")[1]}/${periodo.split("-")[0]}`
          : periodo;
    }
  };

  // Data atual formatada
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Formatar período do relatório
  const dataInicioFormatada = formatarDataSemFuso(filtros.dataInicio);
  const dataFimFormatada = formatarDataSemFuso(filtros.dataFim);
  const periodoFormatado = `${dataInicioFormatada} a ${dataFimFormatada}`;

  // Formatar moeda
  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  let sectionsHTML = "";

  // 1. Análise Temporal
  if (dados.analiseTemporal && dados.analiseTemporal.length > 0) {
    const totalRequisicoes = dados.analiseTemporal.reduce(
      (sum, item) => sum + item.total_requisicoes,
      0
    );
    const totalValor = dados.analiseTemporal.reduce(
      (sum, item) => sum + item.valor_total,
      0
    );

    sectionsHTML += `
      <div class="info-section">
        <h2>📊 Análise Temporal</h2>
        <p style="margin-bottom: 15px; color: #666;">Total de ${totalRequisicoes} requisições | Valor Total: <strong style="color: #9C27B0;">${formatarMoeda(
      totalValor
    )}</strong></p>
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">Período</th>
              <th style="width: 15%; text-align: center;">Total Req.</th>
              <th style="width: 12%; text-align: center;">Aprovadas</th>
              <th style="width: 12%; text-align: center;">Reprovadas</th>
              <th style="width: 20%; text-align: right;">Valor Total</th>
              <th style="width: 21%; text-align: right;">Ticket Médio</th>
            </tr>
          </thead>
          <tbody>
            ${dados.analiseTemporal
              .map(
                (item) => `
              <tr>
                <td><strong>${formatarPeriodoPDF(
                  item.periodo,
                  filtros.tipo_periodo
                )}</strong></td>
                <td style="text-align: center;">${item.total_requisicoes}</td>
                <td style="text-align: center; color: #4CAF50; font-weight: 600;">${
                  item.aprovadas
                }</td>
                <td style="text-align: center; color: #F44336; font-weight: 600;">${
                  item.reprovadas
                }</td>
                <td style="text-align: right; font-weight: 600;">${formatarMoeda(
                  item.valor_total
                )}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.ticket_medio
                )}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // 2. Gastos por Departamento com Top 3 Solicitantes
  if (dados.gastosPorDepartamento && dados.gastosPorDepartamento.length > 0) {
    sectionsHTML += `
      <div class="info-section">
        <h2>🏢 Gastos por Departamento</h2>
        ${dados.gastosPorDepartamento
          .map(
            (dept) => `
          <div style="margin-bottom: 25px; border-left: 4px solid #9C27B0; padding-left: 15px; background: #F3E5F5; padding: 10px 15px; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="margin: 0; font-size: 14px; color: #7B1FA2;">${
                dept.departamento
              }</h3>
              <span style="font-size: 16px; font-weight: 700; color: #9C27B0;">${formatarMoeda(
                dept.valor_total
              )}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px;">
              <div style="background: white; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="font-size: 9px; color: #666; text-transform: uppercase;">Total Req.</div>
                <div style="font-size: 14px; font-weight: 700; color: #9C27B0;">${
                  dept.total_requisicoes
                }</div>
              </div>
              <div style="background: white; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="font-size: 9px; color: #666; text-transform: uppercase;">Ticket Médio</div>
                <div style="font-size: 12px; font-weight: 700; color: #9C27B0;">${formatarMoeda(
                  dept.ticket_medio
                )}</div>
              </div>
              <div style="background: white; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="font-size: 9px; color: #666; text-transform: uppercase;">Solicitantes</div>
                <div style="font-size: 14px; font-weight: 700; color: #9C27B0;">${
                  dept.solicitantes_unicos
                }</div>
              </div>
              <div style="background: white; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="font-size: 9px; color: #666; text-transform: uppercase;">% do Total</div>
                <div style="font-size: 12px; font-weight: 700; color: #9C27B0;">--</div>
              </div>
            </div>
            ${
              dept.top_solicitantes.length > 0
                ? `
            <div style="background: white; padding: 10px; border-radius: 4px;">
              <div style="font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">🏆 Top 3 Solicitantes:</div>
              ${dept.top_solicitantes
                .map(
                  (sol, idx) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #E0E0E0;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: ${
                      idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : "#CD7F32"
                    }; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${
                    idx + 1
                  }</span>
                    <span style="font-size: 11px; font-weight: 600;">${
                      sol.nome_solicitante
                    }</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 12px; font-weight: 700; color: #9C27B0;">${formatarMoeda(
                      sol.valor_total
                    )}</div>
                    <div style="font-size: 9px; color: #666;">${
                      sol.total_requisicoes
                    } req.</div>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
            `
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // 3. Comparativo de Cotações
  if (dados.comparativoCotacoes && dados.comparativoCotacoes.length > 0) {
    const economiaTotal = dados.comparativoCotacoes.reduce(
      (sum, item) => sum + item.economia,
      0
    );

    sectionsHTML += `
      <div class="info-section">
        <h2>💰 Comparativo de Cotações - Economia Gerada</h2>
        <p style="margin-bottom: 15px; color: #666;">Total economizado: <strong style="color: #4CAF50; font-size: 16px;">${formatarMoeda(
          economiaTotal
        )}</strong> | ${
      dados.comparativoCotacoes.length
    } requisições com múltiplas cotações</p>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">ID</th>
              <th style="width: 25%;">Descrição</th>
              <th style="width: 8%; text-align: center;">Cotas</th>
              <th style="width: 12%; text-align: right;">Menor Valor</th>
              <th style="width: 12%; text-align: right;">Maior Valor</th>
              <th style="width: 12%; text-align: right;">Economia</th>
              <th style="width: 6%; text-align: center;">%</th>
              <th style="width: 20%;">Fornecedor Escolhido</th>
            </tr>
          </thead>
          <tbody>
            ${dados.comparativoCotacoes
              .slice(0, 50)
              .map(
                (item) => `
              <tr>
                <td style="text-align: center;"><strong>${
                  item.requisicao_id
                }</strong></td>
                <td style="font-size: 10px;">${item.descricao || "N/A"}</td>
                <td style="text-align: center;">${item.num_fornecedores}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.menor_valor
                )}</td>
                <td style="text-align: right;">${formatarMoeda(
                  item.maior_valor
                )}</td>
                <td style="text-align: right; color: #4CAF50; font-weight: 700;">${formatarMoeda(
                  item.economia
                )}</td>
                <td style="text-align: center; background: ${
                  item.percentual_economia > 20
                    ? "#C8E6C9"
                    : item.percentual_economia > 10
                    ? "#FFF9C4"
                    : "#FFCCBC"
                }; font-weight: 600;">${item.percentual_economia.toFixed(
                  1
                )}%</td>
                <td style="font-size: 10px;">${item.fornecedor_escolhido}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        ${
          dados.comparativoCotacoes.length > 50
            ? `<p style="margin-top: 15px; color: #666; font-style: italic;">* Exibindo as 50 maiores economias de ${dados.comparativoCotacoes.length} total</p>`
            : ""
        }
      </div>
    `;
  }

  // 4. Resumo Geral
  let resumoGeralHTML = "";
  if (dados.resumoGeral) {
    const resumo = dados.resumoGeral;
    resumoGeralHTML = `
      <div class="info-section">
        <h2>📈 Resumo Geral</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Total Requisições:</span>
            <span class="value">${resumo.totais.requisicoes}</span>
          </div>
          <div class="info-item">
            <span class="label">Aprovadas:</span>
            <span class="value" style="color: #4CAF50;">${
              resumo.totais.aprovadas
            }</span>
          </div>
          <div class="info-item">
            <span class="label">Reprovadas:</span>
            <span class="value" style="color: #F44336;">${
              resumo.totais.reprovadas
            }</span>
          </div>
          <div class="info-item">
            <span class="label">Pendentes:</span>
            <span class="value" style="color: #FF9800;">${
              resumo.totais.pendentes
            }</span>
          </div>
          <div class="info-item">
            <span class="label">Valor Total:</span>
            <span class="value value-box">${formatarMoeda(
              resumo.totais.valor_total_aprovado
            )}</span>
          </div>
          <div class="info-item">
            <span class="label">Ticket Médio:</span>
            <span class="value">${formatarMoeda(
              resumo.totais.ticket_medio
            )}</span>
          </div>
          <div class="info-item">
            <span class="label">Economia Gerada:</span>
            <span class="value" style="color: #4CAF50;">${formatarMoeda(
              resumo.totais.economia_total_gerada
            )}</span>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Todas as Requisições
  if (dados.todas && dados.todas.length > 0) {
    sectionsHTML += `
      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; color: #fff; margin-bottom: 10px; padding: 8px 12px; background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); border-radius: 5px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📄 Todas as Requisições (${
          dados.todas.length
        })</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">ID</th>
              <th style="width: 12%;">Data</th>
              <th style="width: 25%;">Descrição</th>
              <th style="width: 12%;">Departamento</th>
              <th style="width: 12%;">Solicitante</th>
              <th style="width: 8%; text-align: center;">Status</th>
              <th style="width: 12%; text-align: right;">Valor</th>
              <th style="width: 14%;">Fornecedor</th>
            </tr>
          </thead>
          <tbody>
            ${dados.todas
              .slice(0, 100)
              .map((item) => {
                const statusColor =
                  item.status === "Aprovada"
                    ? "#4CAF50"
                    : item.status === "Pendente"
                    ? "#FF9800"
                    : "#F44336";

                return `
              <tr>
                <td style="text-align: center;"><strong>${item.id}</strong></td>
                <td style="font-size: 10px;">${item.data_requisicao}</td>
                <td style="font-size: 10px;">${item.descricao}</td>
                <td style="font-size: 10px;">${item.departamento}</td>
                <td style="font-size: 10px;">${item.nome_solicitante}</td>
                <td style="text-align: center;">
                  <span style="background: ${statusColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 600;">
                    ${item.status}
                  </span>
                </td>
                <td style="text-align: right; font-weight: 600; color: #9C27B0;">${formatarMoeda(
                  item.valor
                )}</td>
                <td style="font-size: 10px;">${item.fornecedor_escolhido}</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
        ${
          dados.todas.length > 100
            ? `<p style="margin-top: 15px; color: #666; font-style: italic;">* Exibindo as primeiras 100 requisições de ${dados.todas.length} total</p>`
            : ""
        }
      </div>
    `;
  }

  const content = `
    <div class="header">
      <div class="header-grid">
        <div class="header-logo">
          ${
            logoExists
              ? `<img src="${logoBase64}" alt="SmartCompras Logo" style="max-width:100%;height:auto;max-height:60px;">`
              : '<div style="color:#ccc;font-size:10px;">LOGO</div>'
          }
        </div>
        <div class="header-content">
          <h1>💳 Relatório de Despesas</h1>
          <div class="header-info">
            <strong>Data de Geração:</strong> ${dataAtual}
            ${
              filtros.departamento
                ? `<br><strong>Filtro - Departamento ID:</strong> ${filtros.departamento}`
                : ""
            }
            ${
              filtros.solicitante
                ? `<br><strong>Filtro - Solicitante ID:</strong> ${filtros.solicitante}`
                : ""
            }
            ${
              filtros.status
                ? `<br><strong>Filtro - Status:</strong> ${filtros.status}`
                : ""
            }
            ${
              filtros.tipo_periodo
                ? `<br><strong>Agrupamento:</strong> ${
                    filtros.tipo_periodo === "dia"
                      ? "Diário"
                      : filtros.tipo_periodo === "semana"
                      ? "Semanal"
                      : filtros.tipo_periodo === "mes"
                      ? "Mensal"
                      : "Anual"
                  }`
                : ""
            }
          </div>
        </div>
        <div class="header-extra">
          <div style="font-size: 10px; color: #666; text-align: center;">
            <strong style="display: block; margin-bottom: 5px;">Relatório</strong>
            <span class="status-badge status-aprovado">✓ Gerado</span>
          </div>
        </div>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, #E1BEE7 0%, #CE93D8 100%); padding: 15px 20px; border-radius: 8px; margin-bottom: 15px; border-left: 5px solid #9C27B0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
        <div style="font-size: 24px;">📅</div>
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #6A1B9A; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Período do Relatório</div>
          <div style="font-size: 16px; color: #4A148C; font-weight: 700;">${periodoFormatado}</div>
        </div>
      </div>
    </div>
    ${resumoGeralHTML}
    ${sectionsHTML}
    <div class="footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <div class="footer-item">
          <strong>SMARTCOMPRAS</strong><br>
          Sistema de Gestão de Compras<br>
          Relatório de Despesas
        </div>
        <div class="footer-item" style="text-align: center;">
          <strong>Gerado em</strong><br>
          ${dataAtual}<br>
          <em style="color: #999; font-size: 8px;">Documento gerado automaticamente</em>
        </div>
        <div class="footer-item" style="text-align: right;">
          <strong>Francauto</strong><br>
          www.francauto.com.br<br>
          <em style="color: #999; font-size: 8px;">Todos os direitos reservados</em>
        </div>
      </div>
    </div>
  `;

  return getBaseHTMLTemplate("Relatório de Despesas", content);
}
