import { EmailNotificationChannel } from "./EmailNotificationChannel";
import { WhatsAppNotificationChannel } from "./WhatsAppNotificationChannel";
import {
  INotificationChannel,
  NotificationContent,
} from "./NotificationChannel.interface";
import { NotificationTemplate, TemplateData } from "./NotificationTemplate";
import { getTemplate, ModuleName } from "./templates";

interface NotificationOptions {
  recipients?: any[];
  solicitantes?: any[];
  aprovadores?: any[];
  template: NotificationTemplate | string;
  data: TemplateData;
  channels?: string[];
  link?: string;
  module?: ModuleName;
}

interface NotificationResult {
  success: Array<{ recipient: number; channel: string }>;
  failed: Array<{ recipient: number; channel: string; error: string }>;
}

export class NotificationService {
  private channels: Map<string, INotificationChannel>;

  constructor() {
    this.channels = new Map();
    this.channels.set("email", new EmailNotificationChannel());
    this.channels.set("whatsapp", new WhatsAppNotificationChannel());
  }

  async notify(options: NotificationOptions): Promise<NotificationResult> {
    const {
      recipients,
      solicitantes = [],
      aprovadores = [],
      template,
      data,
      channels = ["email", "whatsapp"],
      link,
      module = "GENERIC",
    } = options;

    const results: NotificationResult = {
      success: [],
      failed: [],
    };

    if (recipients && recipients.length > 0) {
      const templateObj =
        typeof template === "string" ? getTemplate(module, template) : template;

      if (!templateObj) {
        throw new Error(`Template "${template}" não encontrado`);
      }

      const enrichedData = { ...data, module: this.getModuleName(module) };

      await this.sendToRecipients(
        recipients,
        templateObj,
        enrichedData,
        channels,
        link,
        results
      );

      return results;
    }

    const enrichedData = { ...data, module: this.getModuleName(module) };

    // Enviar para SOLICITANTES
    if (solicitantes.length > 0) {
      const solicitanteTemplate = getTemplate(
        module,
        `${template}_SOLICITANTE`
      );

      if (solicitanteTemplate) {
        await this.sendToRecipients(
          solicitantes,
          solicitanteTemplate,
          enrichedData,
          channels,
          link,
          results
        );
      }
    }

    // Enviar para APROVADORES
    if (aprovadores.length > 0) {
      const aprovadorTemplate = getTemplate(module, `${template}_APROVADOR`);

      if (aprovadorTemplate) {
        await this.sendToRecipients(
          aprovadores,
          aprovadorTemplate,
          enrichedData,
          channels,
          link,
          results
        );
      }
    }

    return results;
  }

  private async sendToRecipients(
    recipients: any[],
    templateObj: NotificationTemplate,
    enrichedData: TemplateData,
    channels: string[],
    link: string | undefined,
    results: NotificationResult
  ): Promise<void> {
    for (const recipient of recipients) {
      for (const channelName of channels) {
        const channel = this.channels.get(channelName);

        if (!channel) {
          continue;
        }

        const isEnabled = channel.isEnabled(recipient);

        if (!isEnabled) {
          continue;
        }

        try {
          const content = this.buildContent(
            templateObj,
            enrichedData,
            channelName,
            link
          );

          const recipientContact =
            channelName === "email" ? recipient.mail : recipient.telefone;

          await channel.send(recipientContact, content);

          results.success.push({
            recipient: recipient.id,
            channel: channelName,
          });
        } catch (error: any) {
          results.failed.push({
            recipient: recipient.id,
            channel: channelName,
            error: error.message,
          });
        }
      }
    }
  }

  private getModuleName(module: ModuleName): string {
    const moduleNames: Record<ModuleName, string> = {
      ESTOQUE: "Estoque",
      COMBUSTIVEL: "Combustível",
      COMBUSTIVEL_ESTOQUE: "Combustível Estoque",
      COMBUSTIVEL_FROTA: "Combustível Frota",
      CLIENTES: "Clientes",
      DESPESAS: "Despesas",
      GENERIC: "Sistema",
    };
    return moduleNames[module] || module;
  }

  private buildContent(
    template: NotificationTemplate,
    data: TemplateData,
    channel: string,
    link?: string
  ): NotificationContent {
    if (channel === "email") {
      return {
        subject:
          typeof template.subject === "function"
            ? template.subject(data)
            : template.subject,
        message: template.text(data, link),
        html: template.html ? template.html(data, link) : undefined,
      };
    }
    if (channel === "whatsapp") {
      return {
        message: template.whatsapp
          ? template.whatsapp(data, link)
          : template.text(data, link),
      };
    }
    return { message: template.text(data, link) };
  }
}
