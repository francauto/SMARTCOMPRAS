"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";
import { toast } from "@/utils/toastEmitter";

interface ToastContextType {
  showToast: (message: string, type?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AlertColor>("info");

  const showToast = (msg: string, toastType: AlertColor = "info") => {
    setMessage(msg);
    setType(toastType);
    setOpen(true);
  };

  // Inscrever no emitter global para que services possam usar
  useEffect(() => {
    const unsubscribe = toast.subscribe((msg, toastType) => {
      showToast(msg, toastType);
    });
    return unsubscribe;
  }, []);

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          marginTop: "70px", // Posição abaixo do header (ajuste conforme necessário)
          zIndex: 9999, // Acima de tudo, incluindo modais
        }}
      >
        <Alert
          onClose={handleClose}
          severity={type}
          variant="filled"
          sx={{
            width: "100%",
            minWidth: "300px",
            boxShadow: 3,
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return context;
}
