"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ConsumptionResponse } from "@/types/consumo";
import type { PreparedChartData, VehicleGroup } from "../types";
import { prepareChartData } from "../utils/dataProcessing";
import { formatCurrency } from "../utils/formatters";
import { itemVariants } from "../types";

interface ChartsProps {
  data: ConsumptionResponse;
  vehicles: VehicleGroup[];
  selectedVehicleId: number | null;
  selectedAnaliseIndex: number;
  chartData: PreparedChartData;
}

export const Charts: React.FC<ChartsProps> = ({
  data,
  vehicles,
  selectedVehicleId,
  selectedAnaliseIndex,
  chartData,
}) => {
  const hasMultipleVehicles = vehicles.length > 1;
  const currentVehicleId = hasMultipleVehicles ? selectedVehicleId : vehicles[0]?.veiculo_id;

  let dataToAnalyze;
  let currentChartData;

  if (currentVehicleId === null) {
    dataToAnalyze = data.data;
    currentChartData = prepareChartData(data, dataToAnalyze);
  } else {
    const currentVehicle = vehicles.find(v => v.veiculo_id === currentVehicleId);
    const currentRecord = currentVehicle?.records[selectedAnaliseIndex];

    if (!currentRecord) return null;

    dataToAnalyze = [currentRecord];
    currentChartData = prepareChartData(data, dataToAnalyze);
  }

  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    const item = chartData.vehicleData.find((v) => v.name === payload.value);

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#64748b"
          fontSize="11px"
        >
          {payload.value}
        </text>
        <rect
          x={-25}
          y={22}
          width={50}
          height={16}
          fill="transparent"
          stroke="#94a3b8"
          strokeWidth={1.5}
          rx={4}
        />
        <text
          x={0}
          y={0}
          dy={34}
          textAnchor="middle"
          fill="#64748b"
          fontSize="9px"
          fontWeight="600"
        >
          {item?.combustivel}
        </text>
      </g>
    );
  };

  return (
    <motion.div variants={itemVariants} className="mb-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        Análise Detalhada
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumo Médio */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Consumo Médio (km/L)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentChartData?.vehicleData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tick={CustomTick}
                height={70}
              />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#1e293b" }}
                formatter={(value: number, name: string, props: any) => [
                  value,
                  `Consumo (${props.payload.combustivel})`
                ]}
              />
              <Bar dataKey="consumo" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* KM Rodado */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Quilometragem Rodada
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentChartData?.vehicleData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tick={CustomTick}
                height={70}
              />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#1e293b" }}
                formatter={(value: number, name: string, props: any) => [
                  value,
                  `KM (${props.payload.combustivel})`
                ]}
              />
              <Bar dataKey="km" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Custo Total */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Custo Total por Veículo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentChartData?.vehicleData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tick={CustomTick}
                height={70}
              />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#1e293b" }}
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const item = payload[0].payload;
                    return `${label} - ${item.combustivel}`;
                  }
                  return label;
                }}
              />
              <Line
                type="monotone"
                dataKey="custo"
                stroke="#ec4899"
                strokeWidth={3}
                dot={{ fill: "#ec4899", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};
