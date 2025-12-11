import { NotificationTemplate, TemplateData } from "../NotificationTemplate";

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Formata o nome do campo para exibição (snake_case -> Título)
 */
function formatFieldName(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Verifica se um valor é um objeto (e não array ou null)
 */
function isObject(value: any): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Renderiza um valor (pode ser string, número, objeto, etc)
 */
function renderValue(value: any, level: number = 0): string {
  if (value === null || value === undefined) {
    return '<span style="color: #999; font-style: italic;">N/A</span>';
  }

  if (isObject(value)) {
    const indent = level * 20;
    const rows = Object.entries(value)
      .map(
        ([subKey, subValue]) => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 8px 12px; font-weight: 500; color: #555; padding-left: ${
            indent + 12
          }px;">
            ${formatFieldName(subKey)}:
          </td>
          <td style="padding: 8px 12px; color: #333;">
            ${renderValue(subValue, level + 1)}
          </td>
        </tr>
      `
      )
      .join("");
    return `<table style="width: 100%; margin: 5px 0;">${rows}</table>`;
  }

  if (Array.isArray(value)) {
    return value
      .map(
        (item, index) =>
          `<div style="margin-left: 10px;">• ${renderValue(item, level)}</div>`
      )
      .join("");
  }

  return `<span style="color: #333;">${String(value)}</span>`;
}

/**
 * Gera o HTML da tabela de dados
 */
function generateDataTable(data: TemplateData): string {
  const rows = Object.entries(data)
    .filter(([key]) => key !== "module")
    .map(
      ([key, value]) => `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px 16px; font-weight: 600; color: #555; width: 35%; background-color: #f9f9f9;">
          ${formatFieldName(key)}
        </td>
        <td style="padding: 12px 16px; color: #333;">
          ${renderValue(value)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      ${rows}
    </table>
  `;
}

/**
 * Template base do email com header, footer e estilos responsivos
 */
function emailTemplate(
  title: string,
  titleColor: string,
  icon: string,
  content: string,
  link?: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              
              <!-- Logo App -->
              <tr>
                <td style="background-color: #ffffff; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                  <img src="https://raw.githubusercontent.com/francauto/utils/refs/heads/main/SMARTCOMPRAS.svg" alt="SMARTCOMPRAS" style="width: 180px; height: auto; display: block; margin: 0 auto;" />
                </td>
              </tr>
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${titleColor} 0%, ${adjustColor(
    titleColor,
    -20
  )} 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                    ${icon} ${title}
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Action Button -->
              ${
                link
                  ? `
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <a href="${link}" style="display: inline-block; background-color: ${titleColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s;">
                    🔗 Acessar Sistema
                  </a>
                </td>
              </tr>
              `
                  : ""
              }
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    Atenciosamente,<br>
                    <strong style="color: #333;">Equipe Smartcompras</strong> 🛒
                  </p>
                  <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                    © ${new Date().getFullYear()} Smartcompras. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
              
              <!-- Logo Empresa -->
              <tr>
                <td style="background-color: #ffffff; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                  <img src="https://raw.githubusercontent.com/francauto/utils/refs/heads/main/francautolabsp.png" alt="Francauto Lab SP" style="width: 140px; height: auto; display: block; margin: 0 auto; opacity: 0.8;" />
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Ajusta a cor para criar gradiente (escurece ou clareia)
 */
function adjustColor(color: string, amount: number): string {
  const colorMap: { [key: string]: string } = {
    "#2196F3": amount < 0 ? "#1976D2" : "#42A5F5",
    "#28a745": amount < 0 ? "#218838" : "#48c774",
    "#dc3545": amount < 0 ? "#c82333" : "#e4606d",
  };
  return colorMap[color] || color;
}

// ==================== TEMPLATES GENÉRICOS ====================

export const GENERIC_TEMPLATES: { [key: string]: NotificationTemplate } = {
  NEW_REQUEST_SOLICITANTE: {
    subject: (data: TemplateData) =>
      `Nova Solicitação de ${data.module || "Sistema"} Enviada`,
    text: (data: TemplateData, link?: string) => {
      const details = Object.entries(data)
        .filter(([key]) => key !== "module")
        .map(([key, value]) => `${formatFieldName(key)}: ${value}`)
        .join("\n");
      return `Sua solicitação de ${
        data.module || "sistema"
      } foi enviada com sucesso.\n\n${details}${
        link ? `\n\nAcesse: ${link}` : ""
      }`;
    },
    html: (data: TemplateData, link?: string) => {
      const content = `
        <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px;">
          Sua solicitação de <strong>${
            data.module || "sistema"
          }</strong> foi <strong style="color: #2196F3;">enviada com sucesso</strong> e está aguardando aprovação.
        </p>
        
        <h3 style="color: #2196F3; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 2px solid #2196F3; padding-bottom: 8px;">
          📋 Detalhes da Solicitação
        </h3>
        
        ${generateDataTable(data)}
        
        <div style="margin-top: 20px; padding: 16px; background-color: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
          <p style="margin: 0; color: #1565C0; font-size: 14px;">
            💡 <strong>Próximos passos:</strong> Aguarde a análise do aprovador. Você receberá uma notificação assim que houver uma resposta.
          </p>
        </div>
      `;

      return emailTemplate(
        `Solicitação de ${data.module || "Sistema"} Enviada`,
        "#2196F3",
        "✅",
        content,
        link
      );
    },
    whatsapp: (data: TemplateData, link?: string) => {
      const details = Object.entries(data)
        .filter(([key]) => key !== "module")
        .map(([key, value]) => `📦 *${formatFieldName(key)}:* ${value}`)
        .join("\n");
      return `✅ *Solicitação de ${
        data.module || "Sistema"
      } Enviada*\n\nSua solicitação foi enviada com sucesso!\n\n${details}${
        link ? `\n\n🔎 Acesse: ${link}` : ""
      }`;
    },
  },

  NEW_REQUEST_APROVADOR: {
    subject: (data: TemplateData) =>
      `Nova Solicitação de ${data.module || "Sistema"} Aguardando Aprovação`,
    text: (data: TemplateData, link?: string) => {
      const details = Object.entries(data)
        .filter(([key]) => key !== "module")
        .map(([key, value]) => `${formatFieldName(key)}: ${value}`)
        .join("\n");
      return `Uma nova solicitação de ${
        data.module || "sistema"
      } aguarda sua análise.\n\n${details}${link ? `\n\nAcesse: ${link}` : ""}`;
    },
    html: (data: TemplateData, link?: string) => {
      const content = `
        <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px;">
          Uma nova solicitação de <strong>${
            data.module || "sistema"
          }</strong> foi enviada e <strong style="color: #ff9800;">aguarda sua análise</strong>.
        </p>
        
        <h3 style="color: #ff9800; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 2px solid #ff9800; padding-bottom: 8px;">
          📋 Detalhes da Solicitação
        </h3>
        
        ${generateDataTable(data)}
        
        <div style="margin-top: 20px; padding: 16px; background-color: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
          <p style="margin: 0; color: #e65100; font-size: 14px;">
            ⏰ <strong>Ação necessária:</strong> Esta solicitação precisa da sua aprovação. Clique no botão abaixo para analisar e responder.
          </p>
        </div>
      `;

      return emailTemplate(
        `Nova Solicitação Aguardando sua Análise`,
        "#ff9800",
        "📬",
        content,
        link
      );
    },
    whatsapp: (data: TemplateData, link?: string) => {
      const details = Object.entries(data)
        .filter(([key]) => key !== "module")
        .map(([key, value]) => `📦 *${formatFieldName(key)}:* ${value}`)
        .join("\n");
      return `⏰ *Nova Solicitação de ${
        data.module || "Sistema"
      } - Aguardando sua Análise*\n\n${details}${
        link ? `\n\n🔎 Acesse para aprovar/reprovar: ${link}` : ""
      }`;
    },
  },

  NEW_REQUEST: {
    subject: (data: TemplateData) =>
      `Nova Solicitação de ${data.module || "Sistema"}`,
    text: (data: TemplateData, link?: string) => {
      const details = Object.entries(data)
        .filter(([key]) => key !== "module")
        .map(([key, value]) => `${formatFieldName(key)}: ${value}`)
        .join("\n");
      return `Uma nova solicitação de ${
        data.module || "sistema"
      } foi enviada.\n\n${details}${link ? `\n\nAcesse: ${link}` : ""}`;
    },
    html: (data: TemplateData, link?: string) => {
      const content = `
        <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px;">
          Uma nova solicitação de <strong>${
            data.module || "sistema"
          }</strong> foi enviada.
        </p>
        
        <h3 style="color: #2196F3; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 2px solid #2196F3; padding-bottom: 8px;">
          📋 Detalhes da Solicitação
        </h3>
        
        ${generateDataTable(data)}
        
        <div style="margin-top: 20px; padding: 16px; background-color: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
          <p style="margin: 0; color: #1565C0; font-size: 14px;">
            💡 <strong>Dica:</strong> Clique no botão abaixo para acessar todos os detalhes no sistema.
          </p>
        </div>
      `;

      return emailTemplate(
        `Nova Solicitação de ${data.module || "Sistema"}`,
        "#2196F3",
        "📬",
        content,
        link
      );
    },
    whatsapp: (data: TemplateData, link?: string) => {
      const details = Object.entries(data)
        .filter(([key]) => key !== "module")
        .map(([key, value]) => `📦 *${formatFieldName(key)}:* ${value}`)
        .join("\n");
      return `📌 *Nova Solicitação de ${
        data.module || "Sistema"
      }*\n\n${details}${link ? `\n\n🔎 Acesse: ${link}` : ""}`;
    },
  },

  APROVACAO: {
    subject: (data: TemplateData) =>
      `Solicitação de ${data.module || "Sistema"} Aprovada`,
    text: (data: TemplateData, link?: string) => {
      return `Sua solicitação de ${
        data.module || "sistema"
      } foi APROVADA.\n\nNúmero da Solicitação: ${
        data.id_requisicao
      }\nData de Aprovação: ${data.data_aprovacao}${
        link ? `\n\nAcesse o sistema para mais detalhes: ${link}` : ""
      }\n\nAtenciosamente,\nEquipe Smartcompras`;
    },
    html: (data: TemplateData, link?: string) => {
      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background-color: #d4edda; border: 2px solid #28a745; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; font-size: 40px;">
            ✅
          </div>
        </div>
        
        <p style="font-size: 18px; color: #333; line-height: 1.6; text-align: center; margin-bottom: 30px;">
          Boa notícia! Sua solicitação de <strong>${
            data.module || "sistema"
          }</strong> foi <strong style="color: #28a745;">APROVADA</strong>! 🎉
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 16px; font-weight: 600; color: #555; width: 50%; border-right: 1px solid #dee2e6;">
              <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Solicitação</div>
              <div style="font-size: 20px; color: #28a745; font-weight: 700;">#${
                data.id_requisicao
              }</div>
            </td>
            <td style="padding: 16px; font-weight: 600; color: #555; width: 50%;">
              <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Aprovada em</div>
              <div style="font-size: 16px; color: #333;">📅 ${
                data.data_aprovacao
              }</div>
            </td>
          </tr>
        </table>
        
        <div style="margin-top: 25px; padding: 18px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
          <p style="margin: 0; color: #155724; font-size: 14px;">
            ✨ <strong>Próximos passos:</strong> Acesse o sistema para visualizar todos os detalhes e dar continuidade ao processo.
          </p>
        </div>
      `;

      return emailTemplate(
        "Solicitação Aprovada",
        "#28a745",
        "✅",
        content,
        link
      );
    },
    whatsapp: (data: TemplateData, link?: string) => {
      return `✅ *Solicitação de ${
        data.module || "Sistema"
      } Aprovada*\n\n📌 Solicitação N° *${
        data.id_requisicao
      }* foi: *APROVADA*\n📅 Data de Aprovação: ${data.data_aprovacao}${
        link ? `\n\n🔎 Acesse o sistema para mais detalhes: ${link}` : ""
      }\n\nAtenciosamente,\n*Equipe Smartcompras* 🛒`;
    },
  },

  REPROVACAO: {
    subject: (data: TemplateData) =>
      `Solicitação de ${data.module || "Sistema"} Reprovada`,
    text: (data: TemplateData, link?: string) => {
      return `Sua solicitação de ${
        data.module || "sistema"
      } foi REPROVADA.\n\nNúmero da Solicitação: ${
        data.id_requisicao
      }\nData de Reprovação: ${data.data_aprovacao}${
        data.motivo ? `\nMotivo: ${data.motivo}` : ""
      }${
        link ? `\n\nAcesse o sistema para mais detalhes: ${link}` : ""
      }\n\nAtenciosamente,\nEquipe Smartcompras`;
    },
    html: (data: TemplateData, link?: string) => {
      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background-color: #f8d7da; border: 2px solid #dc3545; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; font-size: 40px;">
            ❌
          </div>
        </div>
        
        <p style="font-size: 18px; color: #333; line-height: 1.6; text-align: center; margin-bottom: 30px;">
          Sua solicitação de <strong>${
            data.module || "sistema"
          }</strong> foi <strong style="color: #dc3545;">REPROVADA</strong>.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 16px; font-weight: 600; color: #555; width: 50%; border-right: 1px solid #dee2e6;">
              <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Solicitação</div>
              <div style="font-size: 20px; color: #dc3545; font-weight: 700;">#${
                data.id_requisicao
              }</div>
            </td>
            <td style="padding: 16px; font-weight: 600; color: #555; width: 50%;">
              <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Reprovada em</div>
              <div style="font-size: 16px; color: #333;">📅 ${
                data.data_aprovacao
              }</div>
            </td>
          </tr>
        </table>
        
        ${
          data.motivo
            ? `
        <div style="margin-top: 25px; padding: 18px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: 600;">
            📝 Motivo da Reprovação:
          </p>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ${data.motivo}
          </p>
        </div>
        `
            : ""
        }
        
        <div style="margin-top: 25px; padding: 18px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            💡 <strong>Próximos passos:</strong> Entre em contato com o aprovador para entender os motivos e, se necessário, faça uma nova solicitação.
          </p>
        </div>
      `;

      return emailTemplate(
        "Solicitação Reprovada",
        "#dc3545",
        "❌",
        content,
        link
      );
    },
    whatsapp: (data: TemplateData, link?: string) => {
      return `❌ *Solicitação de ${
        data.module || "Sistema"
      } Reprovada*\n\n📌 Solicitação N° *${
        data.id_requisicao
      }* foi: *REPROVADA*\n📅 Data de Reprovação: ${data.data_aprovacao}${
        data.motivo ? `\n📝 Motivo: ${data.motivo}` : ""
      }${
        link ? `\n\n🔎 Acesse o sistema para mais detalhes: ${link}` : ""
      }\n\nAtenciosamente,\n*Equipe Smartcompras* 🛒`;
    },
  },

  REQUEST_REJECTED: {
    subject: (data: TemplateData) =>
      `Solicitação de ${data.module || "Sistema"} Recusada`,
    text: (data: TemplateData, link?: string) => {
      return `Sua solicitação de ${
        data.module || "sistema"
      } foi RECUSADA.\n\nNúmero da Solicitação: ${
        data.id_requisicao
      }\nRecusada por: ${data.recusador || "Sistema"}\nData de Recusa: ${
        data.data_recusa
      }${data.motivo ? `\nMotivo: ${data.motivo}` : ""}${
        link ? `\n\nAcesse o sistema para mais detalhes: ${link}` : ""
      }\n\nAtenciosamente,\nEquipe Smartcompras`;
    },
    html: (data: TemplateData, link?: string) => {
      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background-color: #f8d7da; border: 2px solid #dc3545; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; font-size: 40px;">
            🚫
          </div>
        </div>
        
        <p style="font-size: 18px; color: #333; line-height: 1.6; text-align: center; margin-bottom: 30px;">
          Sua solicitação de <strong>${
            data.module || "sistema"
          }</strong> foi <strong style="color: #dc3545;">RECUSADA</strong>.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 16px; font-weight: 600; color: #555; width: 33%; border-right: 1px solid #dee2e6;">
              <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Solicitação</div>
              <div style="font-size: 20px; color: #dc3545; font-weight: 700;">#${
                data.id_requisicao
              }</div>
            </td>
            <td style="padding: 16px; font-weight: 600; color: #555; width: 34%; border-right: 1px solid #dee2e6;">
              <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Recusada por</div>
              <div style="font-size: 14px; color: #333;">👤 ${
                data.recusador || "Sistema"
              }</div>
            </td>
            <td style="padding: 16px; font-weight: 600; color: #555; width: 33%;">
              <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Recusada em</div>
              <div style="font-size: 14px; color: #333;">📅 ${
                data.data_recusa
              }</div>
            </td>
          </tr>
        </table>
        
        ${
          data.motivo
            ? `
        <div style="margin-top: 25px; padding: 18px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: 600;">
            📝 Motivo da Recusa:
          </p>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ${data.motivo}
          </p>
        </div>
        `
            : ""
        }
        
        <div style="margin-top: 25px; padding: 18px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            💡 <strong>Próximos passos:</strong> Entre em contato com ${
              data.recusador || "o responsável"
            } para entender os motivos e, se necessário, faça uma nova solicitação.
          </p>
        </div>
      `;

      return emailTemplate(
        "Solicitação Recusada",
        "#dc3545",
        "🚫",
        content,
        link
      );
    },
    whatsapp: (data: TemplateData, link?: string) => {
      return `🚫 *Solicitação de ${
        data.module || "Sistema"
      } Recusada*\n\n📌 Solicitação N° *${
        data.id_requisicao
      }* foi: *RECUSADA*\n👤 Recusada por: ${
        data.recusador || "Sistema"
      }\n📅 Data de Recusa: ${data.data_recusa}${
        data.motivo ? `\n📝 Motivo: ${data.motivo}` : ""
      }${
        link ? `\n\n🔎 Acesse o sistema para mais detalhes: ${link}` : ""
      }\n\nAtenciosamente,\n*Equipe Smartcompras* 🛒`;
    },
  },
};
