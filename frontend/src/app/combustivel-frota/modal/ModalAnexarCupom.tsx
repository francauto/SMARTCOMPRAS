"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  CircularProgress,
  TextField,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { frotaService } from "@/services/frotaService";

interface ModalAnexarCupomProps {
  open: boolean;
  onClose: () => void;
  idRequisicao: number;
  onSuccess?: () => void;
}

interface DadosCupom {
  litros: number;
  valor_por_litro: number;
  valor_total: number;
}

export default function ModalAnexarCupom({
  open,
  onClose,
  idRequisicao,
  onSuccess,
}: ModalAnexarCupomProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dadosCupom, setDadosCupom] = useState<DadosCupom | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 5MB.");
      return;
    }

    setError(null);
    setArquivo(file);

    // Gerar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Automaticamente analisar o cupom
    await analisarCupom(file);
  };

  const analisarCupom = async (file: File) => {
    setAnalisando(true);
    setError(null);
    setDadosCupom(null);

    try {
      const response = await frotaService.analisarCupom(idRequisicao, file);
      if (response.success && response.dados) {
        setDadosCupom(response.dados);
      } else {
        setError("Não foi possível extrair os dados do cupom.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Erro ao analisar cupom. Tente novamente."
      );
    } finally {
      setAnalisando(false);
    }
  };

  const handleRemoveFile = () => {
    setArquivo(null);
    setPreview(null);
    setDadosCupom(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleConfirmar = async () => {
    if (!dadosCupom) {
      setError("Dados do cupom não disponíveis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await frotaService.confirmarCupom(idRequisicao, dadosCupom);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Erro ao confirmar cupom. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading || analisando) return;
    handleRemoveFile();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
          <ReceiptIcon />
          <Typography variant="h6" component="span">
            Anexar Cupom Fiscal
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading || analisando}
          sx={{ color: "white" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Coluna Esquerda - Imagem */}
          <Grid item xs={12} md={6}>
            {preview ? (
              <Box sx={{ position: "relative" }}>
                <Box
                  component="img"
                  src={preview}
                  alt="Preview do cupom"
                  sx={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    borderRadius: 2,
                    border: "2px solid #e0e0e0",
                  }}
                />
                <IconButton
                  onClick={handleRemoveFile}
                  disabled={loading || analisando}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 1)",
                    },
                  }}
                >
                  <DeleteIcon color="error" />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    textAlign: "center",
                    color: "#666",
                  }}
                >
                  {arquivo?.name} ({(arquivo!.size / 1024).toFixed(0)}KB)
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
                  Tire uma foto ou selecione uma imagem do cupom fiscal:
                </Typography>

                {/* Botões de Ação */}
                <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
                  {/* Tirar Foto */}
                  <Button
                    variant="outlined"
                    startIcon={<CameraAltIcon />}
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={loading || analisando}
                    fullWidth
                    sx={{
                      py: 2,
                      borderColor: "#001e50",
                      color: "#001e50",
                      "&:hover": {
                        borderColor: "#003080",
                        backgroundColor: "rgba(0, 30, 80, 0.04)",
                      },
                    }}
                  >
                    Tirar Foto
                  </Button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />

                  {/* Upload de Arquivo */}
                  <Button
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || analisando}
                    fullWidth
                    sx={{
                      py: 2,
                      borderColor: "#001e50",
                      color: "#001e50",
                      "&:hover": {
                        borderColor: "#003080",
                        backgroundColor: "rgba(0, 30, 80, 0.04)",
                      },
                    }}
                  >
                    Selecionar da Galeria
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    • Formatos aceitos: JPG, PNG, JPEG
                    <br />• Tamanho máximo: 5MB
                  </Typography>
                </Alert>
              </Box>
            )}
          </Grid>

          {/* Coluna Direita - Dados do Cupom */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                backgroundColor: "#f5f5f5",
                borderRadius: 2,
                minHeight: 400,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {analisando ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <CircularProgress size={48} sx={{ color: "#001e50" }} />
                  <Typography variant="body1" color="textSecondary">
                    Analisando cupom...
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Aguarde enquanto extraímos as informações
                  </Typography>
                </Box>
              ) : dadosCupom ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 1, color: "#001e50", fontWeight: 600 }}
                  >
                    Dados Extraídos
                  </Typography>

                  <Alert severity="info" sx={{ mb: 1 }}>
                    Confira os dados extraídos antes de confirmar
                  </Alert>

                  <TextField
                    label="Litros"
                    value={dadosCupom.litros}
                    disabled
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      "& .MuiInputBase-input.Mui-disabled": {
                        WebkitTextFillColor: "#000",
                      },
                    }}
                  />

                  <TextField
                    label="Valor por Litro (R$)"
                    value={dadosCupom.valor_por_litro.toFixed(2)}
                    disabled
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      "& .MuiInputBase-input.Mui-disabled": {
                        WebkitTextFillColor: "#000",
                      },
                    }}
                  />

                  <TextField
                    label="Valor Total (R$)"
                    value={dadosCupom.valor_total.toFixed(2)}
                    disabled
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      "& .MuiInputBase-input.Mui-disabled": {
                        WebkitTextFillColor: "#000",
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 64, color: "#ccc" }} />
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    textAlign="center"
                  >
                    Nenhuma imagem selecionada
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    textAlign="center"
                  >
                    Tire uma foto ou selecione uma imagem para visualizar os
                    dados
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading || analisando}
          variant="outlined"
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmar}
          disabled={!dadosCupom || loading || analisando}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <ReceiptIcon />}
          sx={{
            backgroundColor: "#001e50",
            "&:hover": { backgroundColor: "#003080" },
            "&:disabled": {
              backgroundColor: "#ccc",
            },
          }}
        >
          {loading ? "Confirmando..." : "Confirmar Cupom"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
