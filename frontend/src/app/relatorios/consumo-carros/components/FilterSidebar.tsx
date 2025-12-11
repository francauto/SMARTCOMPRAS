"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { ConsumptionFilters } from "@/types/consumo";
import type { Car, VehicleFilter } from "../types";
import { itemVariants } from "../types";
import { getUniqueOptions } from "../utils/dataProcessing";

interface FilterSidebarProps {
  filters: ConsumptionFilters;
  vehicleFilters: VehicleFilter[];
  cars: Car[];
  loadingCars: boolean;
  loading: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  handleFilterChange: (field: keyof ConsumptionFilters, value: string) => void;
  updateVehicleFilter: (id: string, field: 'placa' | 'modelo', value: string) => void;
  removeVehicleFilter: (id: string) => void;
  addVehicleFilter: () => void;
  handleGerarAnalise: () => void;
  handleLimparFiltros: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  vehicleFilters,
  cars,
  loadingCars,
  loading,
  isSidebarOpen,
  setIsSidebarOpen,
  handleFilterChange,
  updateVehicleFilter,
  removeVehicleFilter,
  addVehicleFilter,
  handleGerarAnalise,
  handleLimparFiltros,
}) => {
  const filterOptions = getUniqueOptions(cars);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Overlay para mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: isMobile && !isSidebarOpen ? -320 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed md:static top-0 left-0 h-full w-80 bg-white shadow-xl p-4 md:p-5 overflow-y-auto flex flex-col gap-3 z-50"
      >
      {/* Header Sidebar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Filtros</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalize sua análise
          </p>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <svg
            className="w-6 h-6 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Linha decorativa */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>

      {/* Filtros de Data */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Período</h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Data Início */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Início
            </label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
              className="w-full px-2 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition duration-200"
            />
          </div>
          {/* Data Fim */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fim
            </label>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => handleFilterChange('dataFim', e.target.value)}
              className="w-full px-2 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition duration-200"
            />
          </div>
        </div>
      </div>

      {/* Linha decorativa */}
      <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>

      {/* Veículos Dinâmicos */}
      <div className="space-y-4">
        {vehicleFilters.map((vehicleFilter, index) => (
          <div key={vehicleFilter.id} className="relative">
            {/* Cabeçalho com contador e botão remover */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600">
                Veículo {index + 1}
              </span>
              {vehicleFilters.length > 1 && (
                <button
                  onClick={() => removeVehicleFilter(vehicleFilter.id)}
                  className="p-1 hover:bg-red-50 text-red-500 rounded transition"
                  title="Remover veículo"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Placa */}
            <motion.div variants={itemVariants} className="relative mb-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Placa
              </label>
              <input
                type="text"
                list={`car-placas-${vehicleFilter.id}`}
                value={vehicleFilter.placa}
                onChange={(e) => updateVehicleFilter(vehicleFilter.id, 'placa', e.target.value.toUpperCase())}
                disabled={loadingCars}
                placeholder="Digite ou selecione a placa"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition duration-200"
              />
              <datalist id={`car-placas-${vehicleFilter.id}`}>
                {cars.map((car) => (
                  <option key={car.id} value={car.PLACA} />
                ))}
              </datalist>
            </motion.div>

            {/* Modelo */}
            <motion.div variants={itemVariants} className="relative mb-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Modelo
              </label>
              <input
                type="text"
                list={`car-modelos-${vehicleFilter.id}`}
                value={vehicleFilter.modelo}
                onChange={(e) => updateVehicleFilter(vehicleFilter.id, 'modelo', e.target.value)}
                disabled={loadingCars}
                placeholder="Digite ou selecione o modelo"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition duration-200"
              />
              <datalist id={`car-modelos-${vehicleFilter.id}`}>
                {filterOptions.modelos.map((modelo) => (
                  <option key={modelo} value={modelo} />
                ))}
              </datalist>
            </motion.div>

            {/* Divisor entre veículos */}
            {index < vehicleFilters.length - 1 && (
              <div className="h-px bg-slate-200 mt-4"></div>
            )}
          </div>
        ))}

        {/* Botão Adicionar Veículo */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addVehicleFilter}
          className="w-full px-3 py-2 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 text-sm font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Adicionar Veículo
        </motion.button>
      </div>

      {/* Linha decorativa */}
      <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>

      {/* Botões */}
      <div className="flex flex-col gap-2 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGerarAnalise}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-[#001e50] hover:bg-[#002d73] disabled:from-slate-400 disabled:via-slate-400 disabled:to-slate-500 text-white text-sm font-bold rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Gerando...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
              Gerar Análise
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLimparFiltros}
          className="w-full px-4 py-2  text-black text-sm font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg border border-red-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Limpar Filtros
        </motion.button>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-slate-700">
            <span className="font-semibold text-blue-600">Dica:</span> Use
            os filtros para refinar sua busca e obter dados mais
            específicos sobre o consumo de combustível dos veículos desejados.
          </p>
        </div>

        {/* Lista de Carros */}
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xs font-bold text-slate-800">
              Veículos Cadastrados ({cars.length})
            </h3>
          </div>
          {loadingCars ? (
            <p className="text-xs text-slate-500 text-center py-2">Carregando veículos...</p>
          ) : cars.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">Nenhum veículo encontrado</p>
          ) : (
            <ul className="space-y-1">
              {cars.map((car) => (
                <li
                  key={car.id}
                  className="text-xs text-slate-700 py-1 px-2 hover:bg-slate-50 rounded transition cursor-default"
                >
                  <span className="font-semibold text-blue-600">{car.PLACA}</span>
                  {" - "}
                  <span>{car.modelo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
    </>
  );
};
