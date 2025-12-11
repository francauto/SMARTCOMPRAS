import { NotificationTemplate } from "../NotificationTemplate";
import { GENERIC_TEMPLATES } from "./generic.templates";

// ==================== MÓDULOS DISPONÍVEIS ====================

export type ModuleName =
  | "ESTOQUE"
  | "COMBUSTIVEL"
  | "COMBUSTIVEL_ESTOQUE"
  | "COMBUSTIVEL_FROTA"
  | "CLIENTES"
  | "DESPESAS"
  | "GENERIC";

// ==================== REGISTRY DE TEMPLATES ====================
// Todos os módulos usam os mesmos templates genéricos

const TEMPLATE_REGISTRY: Record<
  ModuleName,
  { [key: string]: NotificationTemplate }
> = {
  ESTOQUE: GENERIC_TEMPLATES,
  COMBUSTIVEL: GENERIC_TEMPLATES,
  COMBUSTIVEL_ESTOQUE: GENERIC_TEMPLATES,
  COMBUSTIVEL_FROTA: GENERIC_TEMPLATES,
  CLIENTES: GENERIC_TEMPLATES,
  DESPESAS: GENERIC_TEMPLATES,
  GENERIC: GENERIC_TEMPLATES,
};

// ==================== FUNÇÃO PARA OBTER TEMPLATES ====================

export function getTemplate(
  moduleName: ModuleName,
  templateKey: string
): NotificationTemplate | null {
  // Todos os módulos usam os mesmos templates
  return GENERIC_TEMPLATES[templateKey] || null;
}

// ==================== FUNÇÃO PARA LISTAR TEMPLATES DISPONÍVEIS ====================

export function listAvailableTemplates(): string[] {
  return Object.keys(GENERIC_TEMPLATES);
}

// ==================== EXPORTAÇÕES ====================

export { GENERIC_TEMPLATES };
export { TEMPLATE_REGISTRY };
