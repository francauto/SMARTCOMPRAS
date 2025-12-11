"use client";

import { motion } from "framer-motion";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RoomIcon from "@mui/icons-material/Room";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import type { ConsumptionResponse } from "@/types/consumo";
import type { VehicleGroup } from "../types";
import { formatCurrency, formatNumber, formatDate } from "../utils/formatters";

interface VehicleSummaryCardsProps {
  data: ConsumptionResponse;
  vehicles: VehicleGroup[];
  selectedVehicleId: number | null;
  selectedAnaliseIndex: number;
}

export const VehicleSummaryCards: React.FC<VehicleSummaryCardsProps> = ({
  data,
  vehicles,
  selectedVehicleId,
  selectedAnaliseIndex,
}) => {
  const theme = useTheme();
  const hasMultipleVehicles = vehicles.length > 1;
  const currentVehicleId = hasMultipleVehicles ? selectedVehicleId : vehicles[0]?.veiculo_id;

  // Título e informação
  const renderHeader = () => {
    if (currentVehicleId === null) {
      // Agrupar por veículo_id e pegar apenas o último registro de cada veículo
      const latestByVehicle = data.data.reduce((acc, current) => {
        const vehicleId = current.veiculo_id;
        const existing = acc.get(vehicleId);
        
        if (!existing || new Date(current.data_ultimo_abastecimento) > new Date(existing.data_ultimo_abastecimento)) {
          acc.set(vehicleId, current);
        }
        
        return acc;
      }, new Map());

      const uniqueVehiclesCount = latestByVehicle.size;
      const totalRecords = data.data.length;
      
      return (
        <>
          <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary" mb={1}>
            Análise de diversos veículos
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {uniqueVehiclesCount} veículo(s) • {totalRecords} registro(s) de abastecimento • Exibindo última análise de cada veículo
          </Typography>
        </>
      );
    }

    const currentVehicle = vehicles.find(v => v.veiculo_id === currentVehicleId);
    const currentRecord = currentVehicle?.records[selectedAnaliseIndex];

    if (!currentRecord) return null;

    return (
      <>
        <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary" mb={1}>
          {currentVehicle!.records.length > 1 
            ? `Análise ${selectedAnaliseIndex + 1} - ${currentRecord.placa}`
            : currentRecord.placa
          }
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {currentRecord.modelo} • 
          Período: KM {currentRecord.km_inicial} até KM {currentRecord.km_final}
          {currentRecord.data_ultimo_abastecimento && 
            ` • Último abastecimento: ${formatDate(currentRecord.data_ultimo_abastecimento)}`
          }
        </Typography>
      </>
    );
  };

  // Badges de combustível
  const renderFuelBadges = () => {
    let dataToAnalyze;

    if (currentVehicleId === null) {
      // Agrupar por veículo_id e pegar apenas o último registro de cada veículo
      const latestByVehicle = data.data.reduce((acc, current) => {
        const vehicleId = current.veiculo_id;
        const existing = acc.get(vehicleId);
        
        if (!existing || new Date(current.data_ultimo_abastecimento) > new Date(existing.data_ultimo_abastecimento)) {
          acc.set(vehicleId, current);
        }
        
        return acc;
      }, new Map());

      // Converter Map para array - pega apenas os últimos registros de cada veículo
      dataToAnalyze = Array.from(latestByVehicle.values());
    } else {
      const currentVehicle = vehicles.find(v => v.veiculo_id === currentVehicleId);
      const currentRecord = currentVehicle?.records[selectedAnaliseIndex];
      if (!currentRecord) return null;
      dataToAnalyze = [currentRecord];
    }

    const tiposCombustivel = [...new Set(dataToAnalyze.map(v => v.tipo_combustivel))].filter(Boolean);
    const combustivelConfig: Record<string, { color: string; bgColor: string }> = {
      'gasolina': { color: '#64748b', bgColor: 'rgba(220, 38, 38, 0.1)' },
      'alcool': { color: '#64748b', bgColor: 'rgba(22, 163, 74, 0.1)' },
      'etanol': { color: '#64748b', bgColor: 'rgba(22, 163, 74, 0.1)' },
      'diesel': { color: '#64748b', bgColor: 'rgba(234, 88, 12, 0.1)' },
    };

    return tiposCombustivel.map((tipo) => {
      const tipoLower = tipo.toLowerCase();
      const config = combustivelConfig[tipoLower] || { color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' };
      const quantidade = dataToAnalyze.filter(v => v.tipo_combustivel === tipo).length;

      return (
        <Box
          key={tipo}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            borderRadius: 2,
            backgroundColor: config.bgColor,
            border: `1px solid ${config.color}40`,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: config.color,
            }}
          />
          <Typography
            component="span"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: config.color,
              textTransform: 'capitalize',
            }}
          >
            {tipo} {quantidade > 1 ? `(${quantidade})` : ''}
          </Typography>
        </Box>
      );
    });
  };

  // Cards de dados
  const renderCards = () => {
    let cards;

    if (currentVehicleId === null) {
      // Agrupar por veículo_id e pegar apenas o último registro de cada veículo
      const latestByVehicle = data.data.reduce((acc, current) => {
        const vehicleId = current.veiculo_id;
        const existing = acc.get(vehicleId);
        
        if (!existing || new Date(current.data_ultimo_abastecimento) > new Date(existing.data_ultimo_abastecimento)) {
          acc.set(vehicleId, current);
        }
        
        return acc;
      }, new Map());

      // Converter Map para array - pega apenas os últimos registros de cada veículo
      const dataToAnalyze = Array.from(latestByVehicle.values());
      
      const totalKm = dataToAnalyze.reduce((sum, r) => sum + r.km_rodado, 0);
      const totalLitros = dataToAnalyze.reduce((sum, r) => sum + r.litros_abastecidos, 0);
      const totalValor = dataToAnalyze.reduce((sum, r) => sum + r.valor_gasto, 0);
      const consumoMedio = totalKm / totalLitros;

      cards = [
        {
          label: "Total de Veículos",
          value: vehicles.length,
          Icon: DirectionsCarIcon,
          iconBgColor: "rgba(67, 56, 202, 0.1)",
          iconColor: "primary.dark",
        },
        {
          label: "KM Total Rodado",
          value: formatNumber(totalKm, 0),
          Icon: RoomIcon,
          iconBgColor: "rgba(147, 51, 234, 0.1)",
          iconColor: "#7e22ce",
        },
        {
          label: "Litros Totais",
          value: formatNumber(totalLitros, 2),
          Icon: LocalGasStationIcon,
          iconBgColor: "rgba(234, 88, 12, 0.1)",
          iconColor: "#d95a00",
        },
        {
          label: "Custo Total",
          value: formatCurrency(totalValor),
          Icon: AccountBalanceWalletIcon,
          iconBgColor: "rgba(22, 163, 74, 0.1)",
          iconColor: "success.dark",
        },
        {
          label: "Consumo Médio Geral",
          value: `${formatNumber(consumoMedio, 2)} km/L`,
          Icon: TrendingUpIcon,
          iconBgColor: "rgba(236, 72, 153, 0.1)",
          iconColor: "#db2777",
        },
      ];
    } else {
      const currentVehicle = vehicles.find(v => v.veiculo_id === currentVehicleId);
      const currentRecord = currentVehicle?.records[selectedAnaliseIndex];

      if (!currentRecord) return null;

      cards = [
        {
          label: "KM Rodado",
          value: formatNumber(currentRecord.km_rodado, 0),
          Icon: RoomIcon,
          iconBgColor: "rgba(147, 51, 234, 0.1)",
          iconColor: "#7e22ce",
        },
        {
          label: "Litros Abastecidos",
          value: formatNumber(currentRecord.litros_abastecidos, 2),
          Icon: LocalGasStationIcon,
          iconBgColor: "rgba(234, 88, 12, 0.1)",
          iconColor: "#d95a00",
        },
        {
          label: "Valor Gasto",
          value: formatCurrency(currentRecord.valor_gasto),
          Icon: AccountBalanceWalletIcon,
          iconBgColor: "rgba(22, 163, 74, 0.1)",
          iconColor: "success.dark",
        },
        {
          label: "Consumo Médio",
          value: `${formatNumber(currentRecord.consumo_medio_km_por_litro, 2)} km/L`,
          Icon: TrendingUpIcon,
          iconBgColor: "rgba(67, 56, 202, 0.1)",
          iconColor: "primary.dark",
        },
        {
          label: "Custo por KM",
          value: formatCurrency(currentRecord.custo_por_km),
          Icon: AccountBalanceWalletIcon,
          iconBgColor: "rgba(236, 72, 153, 0.1)",
          iconColor: "#db2777",
        },
      ];
    }

    return cards.map((card, idx) => (
      <Grid item xs={12} sm={6} md={2.4} key={idx}>
        <motion.div
          variants={{
            hidden: { y: 20, opacity: 0 },
            show: { y: 0, opacity: 1 },
          }}
          whileHover={{
            translateY: -6,
            transition: { duration: 0.2 },
          }}
        >
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              transition: "box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out",
              "&:hover": {
                boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.07)",
                borderColor: "transparent",
              },
            }}
          >
            <CardActionArea sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 140,
                }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    backgroundColor: card.iconBgColor,
                    mb: 2,
                  }}
                >
                  <card.Icon sx={{ color: card.iconColor, fontSize: 28 }} />
                </Avatar>
                <Typography variant="h5" component="p" fontWeight="bold" color="text.primary">
                  {card.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    textTransform: "uppercase",
                    fontWeight: "medium",
                    textAlign: "center",
                  }}
                >
                  {card.label}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        </motion.div>
      </Grid>
    ));
  };

  return (
    <Box sx={{ mb: 4 }}>
      {renderHeader()}
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {renderFuelBadges()}
      </Box>

      <Grid
        container
        spacing={3}
        component={motion.div}
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
        initial="hidden"
        animate="show"
      >
        {renderCards()}
      </Grid>
    </Box>
  );
};
