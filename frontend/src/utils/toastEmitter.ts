import { AlertColor } from "@mui/material";

type ToastListener = (message: string, type: AlertColor) => void;

class ToastEmitter {
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(message: string, type: AlertColor = "info") {
    this.listeners.forEach((listener) => listener(message, type));
  }

  success(message: string) {
    this.emit(message, "success");
  }

  error(message: string) {
    this.emit(message, "error");
  }

  warning(message: string) {
    this.emit(message, "warning");
  }

  info(message: string) {
    this.emit(message, "info");
  }
}

export const toast = new ToastEmitter();
