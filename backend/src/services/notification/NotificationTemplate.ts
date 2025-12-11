export interface TemplateData {
  [key: string]: string | number | boolean | undefined;
}

export interface NotificationTemplate {
  subject?: string | ((data: TemplateData) => string);
  text: (data: TemplateData, link?: string) => string;
  html?: (data: TemplateData, link?: string) => string;
  whatsapp?: (data: TemplateData, link?: string) => string;
}
