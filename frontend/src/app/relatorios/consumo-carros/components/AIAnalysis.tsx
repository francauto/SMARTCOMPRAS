"use client";

import { motion } from "framer-motion";
import type { ConsumptionResponse } from "@/types/consumo";
import { itemVariants } from "../types";

interface AIAnalysisProps {
  data: ConsumptionResponse;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ data }) => {
  if (!data.analiseIA) return null;

  const vehicleCount = [...new Set(data.data.map(v => v.veiculo_id))].length;

  return (
    <motion.div variants={itemVariants} className="mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-100 via-blue-100 to-cyan-100 p-8 border border-purple-200">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-slate-800">
              {vehicleCount > 1 ? 'Análise Comparativa da Frota' : 'Análise Inteligente'}
            </h3>
          </div>
          <p className="text-slate-700 text-lg leading-relaxed mb-6">
            {data.analiseIA.resumo}
          </p>

          {data.analiseIA.alertas && data.analiseIA.alertas.length > 0 && (
            <div className="mb-6 bg-orange-50 border border-orange-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <h4 className="font-semibold text-black">Alertas</h4>
              </div>
              <ul className="space-y-2">
                {data.analiseIA.alertas.map((alerta, index) => (
                  <li key={index} className="text-black flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{alerta}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.analiseIA.recomendacoes && data.analiseIA.recomendacoes.length > 0 && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h4 className="font-semibold text-black">Recomendações</h4>
              </div>
              <ul className="space-y-2">
                {data.analiseIA.recomendacoes.map((recom, index) => (
                  <li key={index} className="text-black flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{recom}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
