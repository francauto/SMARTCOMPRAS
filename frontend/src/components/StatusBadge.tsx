import React from "react";
import { Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

interface StatusBadgeProps {
  status: string;
  size?: "small" | "medium";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "small",
}) => {
  const normalizedStatus = status.toLowerCase().trim();

  // Determinar cor e ícone baseado no status
  const getStatusConfig = (): {
    color: "success" | "error" | "warning" | "info" | "default";
    icon: any;
    label: string;
    customColor?: string;
  } => {
    // Status aprovado (verde)
    if (
      normalizedStatus === "aprovado" ||
      normalizedStatus === "aprovada" ||
      normalizedStatus === "finalizado"
    ) {
      return {
        color: "success" as const,
        icon: CheckCircleIcon,
        label: status,
      };
    }

    // Status rejeitados (vermelho)
    if (
      normalizedStatus === "reprovado" ||
      normalizedStatus === "reprovada" ||
      normalizedStatus === "rejeitado" ||
      normalizedStatus === "rejeitada" ||
      normalizedStatus === "recusado" ||
      normalizedStatus === "recusada"
    ) {
      return {
        color: "error" as const,
        icon: CancelIcon,
        label: status,
      };
    }

    // Status pendente (amarelo customizado)
    if (normalizedStatus === "pendente") {
      return {
        color: "default" as const,
        icon: HourglassEmptyIcon,
        label: status,
        customColor: "#ffd700", // Amarelo ouro
      };
    }

    // Status aguardando controlador de chaves (laranja)
    if (normalizedStatus === "aguardando controlador de chaves") {
      return {
        color: "default" as const,
        icon: HourglassEmptyIcon,
        label: status,
        customColor: "#ff9800", // Laranja
      };
    }

    // Status impresso (azul/info)
    if (normalizedStatus === "impresso") {
      return {
        color: "info" as const,
        icon: CheckCircleIcon,
        label: status,
      };
    }

    // Status não impresso (cinza)
    if (normalizedStatus === "não impresso") {
      return {
        color: "default" as const,
        icon: CancelIcon,
        label: status,
      };
    }

    // Status não se aplica (cinza claro)
    if (normalizedStatus === "não se aplica" || normalizedStatus === "n/a") {
      return {
        color: "default" as const,
        icon: null,
        label: status,
        customColor: "#e0e0e0", // Cinza claro
      };
    }

    // Default (cinza)
    return {
      color: "default" as const,
      icon: null,
      label: status,
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Chip
      label={config.label}
      color={config.customColor ? "default" : config.color}
      size={size}
      icon={
        IconComponent ? (
          <IconComponent
            sx={{
              fontSize: size === "small" ? 16 : 20,
              color: config.customColor ? "#000" : "inherit",
            }}
          />
        ) : undefined
      }
      sx={{
        fontWeight: 600,
        fontSize: size === "small" ? "0.75rem" : "0.875rem",
        transition: "all 0.3s ease",
        backgroundColor: config.customColor || undefined,
        color: config.customColor ? "#000" : undefined,
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: 2,
          backgroundColor: config.customColor || undefined,
        },
      }}
    />
  );
};

export default StatusBadge;
