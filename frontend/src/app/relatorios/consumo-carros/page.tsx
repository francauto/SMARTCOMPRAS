"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/middleware/ProtectedRoute";
import { motion } from "framer-motion";
import {
  FilterSidebar,
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  NoDataState,
  AIAnalysis,
  VehicleNavigation,
  VehicleSummaryCards,
  Charts,
} from "./components";
import { useConsumoData } from "./hooks/useConsumoData";
import { prepareChartData, groupVehicleData } from "./utils/dataProcessing";
import { containerVariants } from "./types";

export default function ConsumoCarrosPage() {
  const { user } = useAuth();
  const router = useRouter();
  // Sidebar começa fechado no mobile, aberto no desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [permissaoVerificada, setPermissaoVerificada] = useState(false);

  // Verificação de permissão - PRIMEIRA COISA A SER EXECUTADA
  useEffect(() => {
    if (user && user.cargo) {
      const cargosPermitidos = ["ger", "dir", "admger", "admdir", "admfun"];
      const temPermissao = cargosPermitidos.some((cargo) =>
        user.cargo.includes(cargo)
      );

      if (!temPermissao) {
        router.replace("/menu");
      } else {
        setPermissaoVerificada(true);
      }
    }
  }, [user, router]);

  // Detectar tamanho da tela e abrir sidebar no desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Executar na montagem
    handleResize();

    // Adicionar listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
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
  } = useConsumoData();

  // Não renderiza nada até a permissão ser verificada
  if (!permissaoVerificada) {
    return null;
  }

  // Preparar dados para gráficos
  const chartData = prepareChartData(data);

  // Agrupar veículos
  const vehicles = data?.data
    ? Object.values(groupVehicleData(data.data)) as import("./types").VehicleGroup[]
    : [];

  return (
    <ProtectedRoute>
      <div className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="flex min-h-screen relative">
          {/* Botão flutuante para abrir menu no mobile */}
          {!isSidebarOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(true)}
              className="fixed bottom-6 left-6 z-30 md:hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </motion.button>
          )}

          {/* Sidebar Filtros */}
          <FilterSidebar
            filters={filters}
            vehicleFilters={vehicleFilters}
            cars={cars}
            loadingCars={loadingCars}
            loading={loading}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            handleFilterChange={handleFilterChange}
            updateVehicleFilter={updateVehicleFilter}
            removeVehicleFilter={removeVehicleFilter}
            addVehicleFilter={addVehicleFilter}
            handleGerarAnalise={handleGerarAnalise}
            handleLimparFiltros={handleLimparFiltros}
          />

          {/* Main Content */}
          <motion.div
            className="flex-1 p-4 md:p-8 overflow-y-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <PageHeader />

            {/* Error */}
            {error && <ErrorState error={error} />}

            {/* Loading State */}
            {loading && <LoadingState />}

            {/* No Data State */}
            {data && data.data && data.data.length === 0 && !loading && <NoDataState />}

            {/* Dados dos Veículos */}
            {data && data.data && data.data.length > 0 && !loading && (
              <>
                {/* Navegação entre veículos */}
                <VehicleNavigation
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  selectedAnaliseIndex={selectedAnaliseIndex}
                  setSelectedVehicleId={setSelectedVehicleId}
                  setSelectedAnaliseIndex={setSelectedAnaliseIndex}
                />

                {/* Cards de Resumo */}
                <VehicleSummaryCards
                  data={data}
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  selectedAnaliseIndex={selectedAnaliseIndex}
                />
              </>
            )}

            {/* Análise de IA */}
            {data && data.analiseIA && !loading && <AIAnalysis data={data} />}

            {/* Gráficos */}
            {data && data.data && data.data.length > 0 && chartData && !loading && (
              <Charts
                data={data}
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                selectedAnaliseIndex={selectedAnaliseIndex}
                chartData={chartData}
              />
            )}

            {/* Estado Inicial */}
            {!loading && !data && <EmptyState />}
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
