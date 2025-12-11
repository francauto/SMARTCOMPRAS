"use client";

import { motion } from "framer-motion";

export const LoadingState: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
    >
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="w-full h-full border-4 border-slate-200 border-t-blue-500 rounded-full"
        ></motion.div>
      </div>
      <p className="text-slate-600 text-lg text-center">Gerando Insights...</p>
    </motion.div>
  );
};

interface ErrorStateProps {
  error: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 flex items-center gap-3"
    >
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      {error}
    </motion.div>
  );
};

export const EmptyState: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="inline-block p-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <svg
          className="w-16 h-16 text-slate-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
        <p className="text-slate-600 text-lg">
          Clique em{" "}
          <span className="text-blue-500 font-semibold">
            "Gerar Análise"
          </span>{" "}
          para visualizar os dados de consumo.
        </p>
      </div>
    </motion.div>
  );
};

export const NoDataState: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="inline-block p-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Sem Dados para Analisar
        </h3>
        <p className="text-slate-600 text-base mb-4">
          Não foram encontrados registros para os filtros selecionados.
        </p>
        <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-slate-700 mb-2">
            <span className="font-semibold text-blue-600">Dicas:</span>
          </p>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Verifique o período selecionado</li>
            <li>Tente ampliar o intervalo de datas</li>
            <li>Verifique se o veículo possui registros</li>
            <li>Remova alguns filtros para uma busca mais ampla</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};
