"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { api } from "@/services/api";
import { toast } from "@/utils/toastEmitter";
import { useAuth } from "@/contexts/AuthContext";

interface ModalWhatsAppConfigProps {
  open: boolean;
  onClose: () => void;
}

export default function ModalWhatsAppConfig({
  open,
  onClose,
}: ModalWhatsAppConfigProps) {
  const { user } = useAuth();
  const [autorizado, setAutorizado] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Buscar dados atuais do usuário ao abrir o modal
  useEffect(() => {
    if (open && user) {
      carregarDadosUsuario();
    }
  }, [open, user]);

  const carregarDadosUsuario = async () => {
    try {
      setLoadingData(true);
      const response = await api.get("/auth/profile");
      const userData = response.data;

      setAutorizado(Boolean(userData.aut_wpp));
      setTelefone(userData.telefone || "");
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoadingData(false);
    }
  };

  const formatarTelefone = (valor: string) => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, "");

    // Limita a 11 dígitos
    const limitado = numeros.slice(0, 11);

    // Formata conforme o tamanho
    if (limitado.length <= 2) {
      return limitado;
    } else if (limitado.length <= 6) {
      return `(${limitado.slice(0, 2)}) ${limitado.slice(2)}`;
    } else if (limitado.length <= 10) {
      return `(${limitado.slice(0, 2)}) ${limitado.slice(
        2,
        6
      )}-${limitado.slice(6)}`;
    } else {
      return `(${limitado.slice(0, 2)}) ${limitado.slice(
        2,
        7
      )}-${limitado.slice(7)}`;
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setTelefone(valorFormatado);
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = e.target.checked;
    setAutorizado(novoValor);

    // Se desativar, limpar o telefone
    if (!novoValor) {
      setTelefone("");
    }
  };

  const validarTelefone = (tel: string): boolean => {
    const numeros = tel.replace(/\D/g, "");
    return numeros.length >= 10 && numeros.length <= 11;
  };

  const handleSalvar = async () => {
    // Validação: se autorizado, telefone é obrigatório
    if (autorizado && !telefone.trim()) {
      toast.error("Informe o número do WhatsApp");
      return;
    }

    // Validação: se autorizado, telefone deve ter formato válido
    if (autorizado && !validarTelefone(telefone)) {
      toast.error("Número de telefone inválido. Deve ter 10 ou 11 dígitos");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        telefone: autorizado ? telefone : "",
        aut_wpp: autorizado,
      };

      await api.put("/auth/whatsapp-config", payload);

      toast.success("Configurações do WhatsApp atualizadas com sucesso!");
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast.error(
        error.response?.data?.error || "Erro ao salvar configurações"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: "#001e50",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WhatsAppIcon />
          <Typography variant="h6" component="span">
            Configurações do WhatsApp
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{ color: "white" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ py: 3 }}>
        {loadingData ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Configure se deseja receber notificações do sistema via WhatsApp
                em seu número pessoal.
              </Typography>
            </Alert>

            {/* Switch de Autorização */}
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: 2,
                p: 2,
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={autorizado}
                    onChange={handleSwitchChange}
                    disabled={loading}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#001e50",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "#001e50",
                        },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Autorizar envio de mensagens
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {autorizado
                        ? "Você receberá notificações por WhatsApp"
                        : "Você não receberá notificações por WhatsApp"}
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {/* Campo de Telefone */}
            <TextField
              label="Número do WhatsApp"
              placeholder="(11) 98765-4321"
              value={telefone}
              onChange={handleTelefoneChange}
              disabled={!autorizado || loading}
              fullWidth
              variant="outlined"
              helperText={
                autorizado
                  ? "Informe o número com DDD (10 ou 11 dígitos)"
                  : "Ative a autorização para habilitar este campo"
              }
              InputProps={{
                startAdornment: (
                  <WhatsAppIcon
                    sx={{
                      mr: 1,
                      color: autorizado ? "#001e50" : "text.disabled",
                    }}
                  />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#001e50",
                  },
                },
              }}
            />

            {/* Informação adicional */}
            {autorizado && telefone && validarTelefone(telefone) && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ✓ Número válido! Você receberá notificações importantes do
                  sistema.
                </Typography>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSalvar}
          disabled={loading || loadingData}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{
            backgroundColor: "#001e50",
            "&:hover": { backgroundColor: "#003080" },
          }}
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
