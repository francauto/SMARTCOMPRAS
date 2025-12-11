import type { ConsumptionResponse } from "@/types/consumo";
import type { PreparedChartData } from "../types";

export const prepareChartData = (
  data: ConsumptionResponse | null,
  dataItems?: ConsumptionResponse['data']
): PreparedChartData | null => {
  if (!data && !dataItems) return null;
  
  const sourceData = dataItems || data?.data || [];

  // Agrupar por veículo_id e pegar apenas o mais recente de cada um
  const latestByVehicle = sourceData.reduce((acc, current) => {
    const vehicleId = current.veiculo_id;
    const existing = acc.get(vehicleId);
    
    if (!existing || new Date(current.data_ultimo_abastecimento) > new Date(existing.data_ultimo_abastecimento)) {
      acc.set(vehicleId, current);
    }
    
    return acc;
  }, new Map());

  // Converter Map para array e pegar no máximo 10 registros
  const uniqueVehicles = Array.from(latestByVehicle.values()).slice(0, 10);

  const vehicleData = uniqueVehicles.map((v) => {
    const tipoCombustivel = v.tipo_combustivel || 'N/A';
    const placa = v.placa || `Veículo ${v.veiculo_id}`;
    
    return {
      name: placa,
      fullName: `${placa} - ${tipoCombustivel}`,
      combustivel: tipoCombustivel,
      consumo: Number.parseFloat(v.consumo_medio_km_por_litro.toFixed(2)),
      km: v.km_rodado,
      custo: Number.parseFloat(v.valor_gasto.toFixed(2)),
    };
  });

  return { vehicleData };
};

export const getUniqueOptions = (cars: any[]) => {
  const placas = [...new Set(cars.map((car) => car.PLACA))].sort();
  const modelos = [...new Set(cars.map((car) => car.modelo))].sort();
  const marcas = [...new Set(cars.map((car) => car.marca))].sort();

  return { placas, modelos, marcas };
};

export const groupVehicleData = (data: any[]) => {
  return data.reduce((acc, item) => {
    const key = item.veiculo_id;
    if (!acc[key]) {
      acc[key] = {
        placa: item.placa,
        modelo: item.modelo || '',
        veiculo_id: item.veiculo_id,
        records: []
      };
    }
    acc[key].records.push(item);
    return acc;
  }, {} as Record<number, { placa: string; modelo: string; veiculo_id: number; records: any[] }>);
};
