"use client";

import { motion } from "framer-motion";
import { itemVariants } from "../types";

export const PageHeader: React.FC = () => {
  return (
    <motion.div variants={itemVariants} className="mb-4">
      <div className="relative overflow-hidden rounded-xl bg-[#001e50] p-4">
        <div className="absolute inset-0 opacity-12">
          <div className="absolute top-0 left-1/4 w-48 h-48 bg-white rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-5 font-semibold text-white mb-1">
            Análise de Consumo
          </h1>
          <p className="text-blue-50 text-sm">
            Relatórios inteligentes de consumo dos veículos
          </p>
        </div>
      </div>
    </motion.div>
  );
};
