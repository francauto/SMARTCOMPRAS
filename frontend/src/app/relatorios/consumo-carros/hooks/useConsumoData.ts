import { useState, useEffect } from "react";
import { consumoService } from "@/services/consumoService";
import type { ConsumptionResponse, ConsumptionFilters } from "@/types/consumo";
import type { Car, VehicleFilter } from "../types";

export const useConsumoData = () => {
  const [loading, setLoading] = useState(false);
  const [loadingCars, setLoadingCars] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ConsumptionResponse | null>(null);
  const [cars, setCars] = useState<Car[]>([]);

  const [filters, setFilters] = useState<ConsumptionFilters>({
    dataInicio: "",
    dataFim: "",
    departamento: "",
    placa: "",
  });

  const [vehicleFilters, setVehicleFilters] = useState<VehicleFilter[]>([
    { id: '1', carId: null, placa: '', modelo: '' }
  ]);

  const [selectedAnaliseIndex, setSelectedAnaliseIndex] = useState<number>(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Carregar carros
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoadingCars(true);
        const response = await consumoService.getCars();
        setCars(response.data || response);
      } catch (err) {
        console.error("Erro ao carregar carros:", err);
      } finally {
        setLoadingCars(false);
      }
    };

    fetchCars();
  }, []);

  const handleFilterChange = (
    field: keyof ConsumptionFilters,
    value: string
  ) => {
    if (data) {
      setData(null);
      setError(null);
      setSelectedAnaliseIndex(0);
    }
    
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLimparFiltros = () => {
    setFilters({
      dataInicio: "",
      dataFim: "",
      departamento: "",
      placa: "",
    });
    setVehicleFilters([{ id: '1', carId: null, placa: '', modelo: '' }]);
    setData(null);
    setError(null);
    setSelectedAnaliseIndex(0);
    setSelectedVehicleId(null);
  };

  const addVehicleFilter = () => {
    if (data) {
      setData(null);
      setError(null);
      setSelectedAnaliseIndex(0);
    }
    
    const newId = (Math.max(...vehicleFilters.map(v => parseInt(v.id)), 0) + 1).toString();
    setVehicleFilters([...vehicleFilters, { id: newId, carId: null, placa: '', modelo: '' }]);
  };

  const removeVehicleFilter = (id: string) => {
    if (vehicleFilters.length > 1) {
      if (data) {
        setData(null);
        setError(null);
        setSelectedAnaliseIndex(0);
      }
      
      setVehicleFilters(vehicleFilters.filter(v => v.id !== id));
    }
  };

  const updateVehicleFilter = (id: string, field: 'placa' | 'modelo', value: string) => {
    if (data) {
      setData(null);
      setError(null);
      setSelectedAnaliseIndex(0);
    }
    
    setVehicleFilters(vehicleFilters.map(v => {
      if (v.id === id) {
        const updatedFilter = { ...v, [field]: value };
        
        const car = cars.find((c) => {
          if (field === 'placa') return c.PLACA === value;
          if (field === 'modelo') return c.modelo === value;
          return false;
        });

        if (car) {
          updatedFilter.carId = car.id;
          updatedFilter.placa = car.PLACA;
          updatedFilter.modelo = car.modelo;
        } else if (value === '') {
          updatedFilter.carId = null;
          updatedFilter.placa = '';
          updatedFilter.modelo = '';
        }

        return updatedFilter;
      }
      return v;
    }));
  };

  const handleGerarAnalise = async () => {
    setLoading(true);
    setError(null);

    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      ) as ConsumptionFilters;

      const selectedVehicles = vehicleFilters.filter(v => v.carId !== null);

      let response: ConsumptionResponse;
      
      if (selectedVehicles.length > 0) {
        const promises = selectedVehicles.map(vehicle =>
          consumoService.getVehicleConsumptionDetails(
            vehicle.carId!,
            activeFilters
          )
        );
        
        const responses = await Promise.all(promises);
        const allVehiclesData = responses.flatMap(r => r.data);
        const allAnalises = responses.map(r => r.analiseIA).filter(Boolean);
        
        const totalKmPercorrido = allVehiclesData.reduce((sum, v) => sum + v.km_rodado, 0);
        const totalLitrosConsumidos = allVehiclesData.reduce((sum, v) => sum + v.litros_abastecidos, 0);
        const custoTotalGeral = allVehiclesData.reduce((sum, v) => sum + v.valor_gasto, 0);
        
        response = {
          status: true,
          total: allVehiclesData.length,
          data: allVehiclesData,
          analiseIA: allAnalises.length > 0 ? allAnalises[0] : {
            resumo: `Análise combinada de ${selectedVehicles.length} veículo(s) selecionado(s).`,
            alertas: [],
            recomendacoes: []
          },
          summary: {
            totalVeiculos: allVehiclesData.length,
            totalKmPercorrido: totalKmPercorrido,
            totalLitrosConsumidos: totalLitrosConsumidos,
            consumoMedioGeral: allVehiclesData.length > 0
              ? allVehiclesData.reduce((sum, v) => sum + v.consumo_medio_km_por_litro, 0) / allVehiclesData.length
              : 0,
            custoTotalGeral: custoTotalGeral,
            mediaAbastecimentosPorVeiculo: allVehiclesData.length > 0 
              ? allVehiclesData.length / selectedVehicles.length
              : 0,
          },
        };
      } else {
        response = await consumoService.getConsumptionData(activeFilters);
      }

      setData(response);
      setSelectedAnaliseIndex(0);
      setSelectedVehicleId(null);
    } catch (err) {
      setError("Erro ao gerar análise de consumo. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loadingCars,
    error,
    data,
    cars,
    filters,
    vehicleFilters,
    selectedAnaliseIndex,
    selectedVehicleId,
    setSelectedAnaliseIndex,
    setSelectedVehicleId,
    handleFilterChange,
    handleLimparFiltros,
    addVehicleFilter,
    removeVehicleFilter,
    updateVehicleFilter,
    handleGerarAnalise,
  };
};
