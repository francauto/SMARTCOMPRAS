"use client";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/theme";

export default function ThemeClientProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
