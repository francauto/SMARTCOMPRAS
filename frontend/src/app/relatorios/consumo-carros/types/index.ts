export interface Car {
  id: number;
  PLACA: string;
  modelo: string;
  marca: string;
  ano: number;
  data_registro: string | null;
  ativo: number;
  id_veiculo_bd: number | null;
}

export interface VehicleFilter {
  id: string;
  carId: number | null;
  placa: string;
  modelo: string;
}

export interface VehicleGroup {
  placa: string;
  modelo: string;
  veiculo_id: number;
  records: any[];
}

export interface ChartDataItem {
  name: string;
  fullName: string;
  combustivel: string;
  consumo: number;
  km: number;
  custo: number;
}

export interface PreparedChartData {
  vehicleData: ChartDataItem[];
}

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};
