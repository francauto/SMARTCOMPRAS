"use client";
import { useState, useRef, useEffect } from "react";
import LockResetIcon from "@mui/icons-material/LockReset";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ChangePasswordModal from "@/components/passwordResetModal";
import ModalWhatsAppConfig from "@/components/ModalWhatsAppConfig";
// 1. Importar motion e AnimatePresence
import { motion, AnimatePresence } from "framer-motion";

// 2. Definir as variants para o dropdown e seus itens
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      staggerChildren: 0.05, // Efeito cascata para os itens
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <header className="w-full bg-[#001e50] py-2 px-6 flex items-center justify-between shadow-sm z-20">
      <motion.div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => router.push("/menu")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img
          src="/SMARTCOMPRAS.svg"
          className="h-7"
          style={{ filter: "invert(1) brightness(100)" }}
        />
      </motion.div>
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        {user && (
          <>
            <motion.button
              className="flex items-center gap-2 focus:outline-none rounded-full px-3 py-1 transition-colors bg-transparent hover:bg-white/20 border border-transparent"
              onClick={() => setOpen((v) => !v)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 7.5a3.75 3.75 0 01-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z"
                />
              </svg>
              <span className="text-white font-medium text-base cursor-pointer">
                {user.nome + " " + user.sobrenome}
              </span>
            </motion.button>

            {/* 3. Envolver o dropdown com AnimatePresence para animar a saída */}
            <AnimatePresence>
              {open && (
                // 4. Transformar o container do dropdown em motion.div
                <motion.div
                  className="absolute right-0 top-full min-w-[220px] w-max bg-white rounded-lg shadow-lg py-2 z-50 overflow-hidden"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <motion.div
                    variants={itemVariants}
                    className="px-4 py-2 text-xs text-gray-500"
                  >
                    Logado com o usuário
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="px-4 py-1 text-sm font-semibold text-gray-800 truncate"
                  >
                    {user.usuario}
                  </motion.div>
                  <motion.hr variants={itemVariants} className="my-1" />

                  {/* 5. Transformar cada item do menu em um motion.button/div */}
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ backgroundColor: "#f3f4f6", x: 2 }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 cursor-pointer"
                    onClick={() => {
                      setShowChangePassword(true);
                      setOpen(false);
                    }}
                  >
                    <LockResetIcon fontSize="small" className="text-gray-500" />
                    Alterar senha
                  </motion.button>
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ backgroundColor: "#f3f4f6", x: 2 }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 cursor-pointer"
                    onClick={() => {
                      setShowWhatsAppConfig(true);
                      setOpen(false);
                    }}
                  >
                    <WhatsAppIcon fontSize="small" className="text-green-600" />
                    Conectar WhatsApp
                  </motion.button>
                  <motion.hr variants={itemVariants} className="my-1" />
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ backgroundColor: "#f3f4f6", x: 2 }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 cursor-pointer"
                    onClick={async () => {
                      setOpen(false);
                      await logout();
                      router.replace("/login");
                    }}
                  >
                    <LogoutIcon fontSize="small" className="text-red-600" />
                    Logout
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <ModalWhatsAppConfig
        open={showWhatsAppConfig}
        onClose={() => setShowWhatsAppConfig(false)}
      />
    </header>
  );
}
