"use client";

import { motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import type { VehicleGroup } from "../types";

interface VehicleNavigationProps {
  vehicles: VehicleGroup[];
  selectedVehicleId: number | null;
  selectedAnaliseIndex: number;
  setSelectedVehicleId: (id: number | null) => void;
  setSelectedAnaliseIndex: (index: number) => void;
}

export const VehicleNavigation: React.FC<VehicleNavigationProps> = ({
  vehicles,
  selectedVehicleId,
  selectedAnaliseIndex,
  setSelectedVehicleId,
  setSelectedAnaliseIndex,
}) => {
  const hasMultipleVehicles = vehicles.length > 1;

  if (!hasMultipleVehicles) return null;

  const currentVehicle = vehicles.find(v => v.veiculo_id === selectedVehicleId);
  const hasMultipleAnalyses = currentVehicle && currentVehicle.records.length > 1;

  return (
    <>
      {/* Menu de navegação entre veículos */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
          Selecione um veículo para ver detalhes:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {/* Botão "Todos" */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedVehicleId(null);
              setSelectedAnaliseIndex(0);
            }}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              selectedVehicleId === null
                ? 'bg-[#001e50] text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({vehicles.length})
          </motion.button>
          
          {vehicles.map((vehicle) => (
            <motion.button
              key={vehicle.veiculo_id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedVehicleId(vehicle.veiculo_id);
                setSelectedAnaliseIndex(0);
              }}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                selectedVehicleId === vehicle.veiculo_id
                  ? 'bg-[#001e50] text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {vehicle.placa}
              {vehicle.records.length > 1 && (
                <span className="ml-1 text-xs opacity-75">({vehicle.records.length})</span>
              )}
            </motion.button>
          ))}
        </Box>
      </Box>

      {/* Menu de navegação entre análises do veículo selecionado */}
      {hasMultipleAnalyses && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {currentVehicle!.records.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedAnaliseIndex(index)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                selectedAnaliseIndex === index
                  ? 'bg-[#001e50] text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Análise {index + 1}
            </motion.button>
          ))}
        </Box>
      )}
    </>
  );
};
