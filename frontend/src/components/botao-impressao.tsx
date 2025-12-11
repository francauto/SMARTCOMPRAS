import React, { useState, useEffect } from "react";
import {
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import PrinterIcon from "@mui/icons-material/LocalPrintshop";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { api } from "@/services/api";

interface Printer {
  name_printer: string;
  ip_printer: string;
}

type TablesName =
  | "combustivel_request"
  | "combustivel_request_estoque"
  | "cliente_request"
  | "requisicoes"
  | "requisicoes_estoque";

interface BotaoImpressaoProps {
  id_requisicao: number;
  nametable: TablesName;
  impresso?: number;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
  onPrintSuccess?: () => void;
}

export const BotaoImpressao: React.FC<BotaoImpressaoProps> = ({
  id_requisicao,
  nametable,
  impresso = 0,
  disabled = false,
  fullWidth = false,
  variant = "outlined",
  size = "small",
  onPrintSuccess,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Buscar impressoras quando o modal abrir
  useEffect(() => {
    if (modalOpen) {
      fetchPrinters();
    }
  }, [modalOpen]);

  const fetchPrinters = async () => {
    try {
      setLoadingPrinters(true);
      const response = await api.get("/printer/getPrinter");
      setPrinters(response.data);
    } catch (error: any) {
      console.error("Erro ao buscar impressoras:", error);
      setSnackbar({
        open: true,
        message: "Erro ao carregar lista de impressoras",
        severity: "error",
      });
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPrinter(null);
  };

  const handleSelectPrinter = (printer_ip: string) => {
    setSelectedPrinter(printer_ip);
  };

  const handleConfirmPrint = async () => {
    if (!selectedPrinter) {
      setSnackbar({
        open: true,
        message: "Selecione uma impressora",
        severity: "warning",
      });
      return;
    }

    try {
      setPrinting(true);

      // Chamada para a API de impressão
      const response = await api.post("/printer/sendAgent", {
        id_requisicao,
        nametable,
        printer_ip: selectedPrinter,
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: "Documento enviado para impressão com sucesso!",
          severity: "success",
        });
        handleCloseModal();

        // Chamar callback de sucesso para atualizar o modal
        if (onPrintSuccess) {
          onPrintSuccess();
        }
      } else {
        throw new Error(response.data.error || "Erro ao enviar para impressão");
      }
    } catch (error: any) {
      console.error("Erro ao imprimir:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error ||
          error.message ||
          "Erro ao enviar documento para impressão",
        severity: "error",
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Se já foi impresso, mostrar badge ao invés do botão
  if (impresso === 1) {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Já Impresso"
        color="success"
        variant="filled"
        size={size === "large" ? "medium" : size}
        sx={{
          fontWeight: 600,
          width: fullWidth ? "100%" : "auto",
        }}
      />
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        color="primary"
        startIcon={<PrintIcon />}
        onClick={handleOpenModal}
        disabled={disabled}
        fullWidth={fullWidth}
      >
        Imprimir
      </Button>

      {/* Modal de Seleção de Impressora */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#001e50",
            color: "white",
            py: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <PrinterIcon sx={{ fontSize: 28 }} />
          <Box flex={1}>
            <Typography variant="h6" fontWeight={600}>
              Selecionar Impressora
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Escolha onde deseja imprimir o documento
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={handleCloseModal}
            sx={{
              minWidth: "auto",
              p: 0.5,
              color: "white",
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: 0, mt: 2 }}>
          {loadingPrinters ? (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              py={6}
              gap={2}
            >
              <CircularProgress size={40} />
              <Typography color="text.secondary" variant="body2">
                Carregando impressoras...
              </Typography>
            </Box>
          ) : printers.length === 0 ? (
            <Box textAlign="center" py={6}>
              <PrinterIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
              />
              <Typography color="text.secondary" gutterBottom>
                Nenhuma impressora disponível
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Configure uma impressora para continuar
              </Typography>
            </Box>
          ) : (
            <List sx={{ px: 2 }}>
              {printers.map((printer, index) => {
                const isSelected = selectedPrinter === printer.ip_printer;
                return (
                  <ListItem
                    key={`printer-${index}`}
                    disablePadding
                    sx={{ mb: 1 }}
                  >
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => handleSelectPrinter(printer.ip_printer)}
                      sx={{
                        borderRadius: 1.5,
                        border: "2px solid",
                        borderColor: isSelected ? "#001e50" : "#e0e0e0",
                        bgcolor: isSelected ? "#f0f4ff" : "transparent",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#001e50",
                          bgcolor: isSelected ? "#f0f4ff" : "#f8f9fa",
                          transform: "translateX(4px)",
                        },
                        "&.Mui-selected": {
                          bgcolor: "#f0f4ff",
                          "&:hover": {
                            bgcolor: "#e8f0ff",
                          },
                        },
                      }}
                    >
                      <ListItemIcon>
                        <PrinterIcon
                          sx={{
                            color: isSelected ? "#001e50" : "primary.main",
                            fontSize: 28,
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            fontWeight={isSelected ? 600 : 500}
                            color={isSelected ? "#001e50" : "text.primary"}
                          >
                            {printer.name_printer}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                bgcolor: "success.main",
                                display: "inline-block",
                              }}
                            />
                            {printer.ip_printer}
                          </Typography>
                        }
                      />
                      {isSelected && (
                        <CheckCircleIcon
                          sx={{ color: "#001e50", fontSize: 24 }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}

          {/* Mensagem de Confirmação */}
          {selectedPrinter && (
            <Box
              sx={{
                mx: 2,
                mb: 2,
                mt: 2,
                p: 2,
                bgcolor: "#fff3e0",
                border: "1px solid #ffb74d",
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "#ff9800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography fontSize={20}>⚠️</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Tem certeza que deseja imprimir?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  O documento será enviado para:{" "}
                  <strong>
                    {printers.find((p) => p.ip_printer === selectedPrinter)
                      ?.name_printer || "Impressora selecionada"}
                  </strong>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1, bgcolor: "#f8f9fa" }}>
          <Button
            onClick={handleCloseModal}
            disabled={printing}
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 500,
              px: 3,
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmPrint}
            disabled={!selectedPrinter || printing}
            startIcon={
              printing ? <CircularProgress size={16} /> : <PrintIcon />
            }
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              bgcolor: "#001e50",
              "&:hover": {
                bgcolor: "#003080",
              },
              "&:disabled": {
                bgcolor: "#e0e0e0",
              },
            }}
          >
            {printing ? "Imprimindo..." : "Confirmar e Imprimir"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BotaoImpressao;
