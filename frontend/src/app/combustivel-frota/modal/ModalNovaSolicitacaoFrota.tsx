"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Box,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  InputAdornment,
} from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SpeedIcon from "@mui/icons-material/Speed";
import LockIcon from "@mui/icons-material/Lock";
import { frotaService } from "@/services/frotaService";
import { bestdriveService } from "@/services/bestdriveService";
import { departamentoService } from "@/services/departamentoService";
import { aprovadoresService } from "@/services/aprovadorService";
import { CarBestDrive } from "@/types/bestdrive";
import { SendFrotaRequest } from "@/types/frota";
import { Departamento, Aprovador } from "@/types/departamento";
import { useAuth } from "@/contexts/AuthContext";

interface ModalNovaSolicitacaoFrotaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalNovaSolicitacaoFrota({
  open,
  onClose,
  onSuccess,
}: ModalNovaSolicitacaoFrotaProps) {
  const { user } = useAuth();

  // Estados do formulário
  const [veiculos, setVeiculos] = useState<CarBestDrive[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [aprovadores, setAprovadores] = useState<Aprovador[]>([]);
  const [veiculoSelecionado, setVeiculoSelecionado] =
    useState<CarBestDrive | null>(null);
  const [km, setKm] = useState<string>("");
  const [litros, setLitros] = useState<string>("");
  const [tipoCombustivel, setTipoCombustivel] = useState<string>("");
  const [tanqueCheio, setTanqueCheio] = useState<boolean>(false);

  // Atualizar KM quando veículo for selecionado
  useEffect(() => {
    if (veiculoSelecionado) {
      setKm(veiculoSelecionado.quilometragem_atual.toString());
    } else {
      setKm("");
    }
  }, [veiculoSelecionado]);
  const [departamentoSelecionado, setDepartamentoSelecionado] =
    useState<Departamento | null>(null);
  const [aprovadorSelecionado, setAprovadorSelecionado] =
    useState<Aprovador | null>(null);

  // Estados de controle
  const [loadingDados, setLoadingDados] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Carregar dados ao abrir modal
  useEffect(() => {
    if (open) {
      carregarDados();
      limparFormulario();
    }
  }, [open]);

  const carregarDados = async () => {
    setLoadingDados(true);
    setError(null);
    try {
      const [veiculosRes, departamentosRes, aprovadoresRes] = await Promise.all(
        [
          bestdriveService.buscarVeiculos(),
          departamentoService.listar(),
          aprovadoresService.getAprovadores(),
        ]
      );

      if (veiculosRes.status && veiculosRes.data) {
        setVeiculos(veiculosRes.data);
      } else {
        setError("Nenhum veículo encontrado no BestDrive");
      }

      setDepartamentos(departamentosRes);
      setAprovadores(aprovadoresRes);
    } catch (err) {
      setError("Erro ao carregar dados");
      console.error(err);
    } finally {
      setLoadingDados(false);
    }
  };

  const limparFormulario = () => {
    setVeiculoSelecionado(null);
    setKm("");
    setLitros("");
    setTipoCombustivel("");
    setTanqueCheio(false);
    setDepartamentoSelecionado(null);
    setAprovadorSelecionado(null);
    setError(null);
    setSuccess(false);
  };

  const validarFormulario = (): boolean => {
    if (!veiculoSelecionado) {
      setError("Selecione um veículo");
      return false;
    }
    if (!km || Number(km) <= 0) {
      setError("Informe o KM atual do veículo");
      return false;
    }
    if (!tanqueCheio && (!litros || Number(litros) <= 0)) {
      setError("Informe a quantidade de litros");
      return false;
    }
    if (!tipoCombustivel) {
      setError("Selecione o tipo de combustível");
      return false;
    }
    if (!departamentoSelecionado) {
      setError("Selecione o departamento");
      return false;
    }
    if (!aprovadorSelecionado) {
      setError("Selecione o aprovador");
      return false;
    }
    if (!user) {
      setError("Usuário não autenticado");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: SendFrotaRequest = {
        veiculo: veiculoSelecionado!.id_bestdrive,
        km: Number(km),
        litro: tanqueCheio ? 0 : Number(litros),
        id_aprovador: aprovadorSelecionado!.id,
        id_solicitante: user!.id,
        tipo_combustivel: tipoCombustivel,
        departamento: departamentoSelecionado!.id,
        tanquecheio: tanqueCheio,
        placa: veiculoSelecionado!.placa,
        modelo: veiculoSelecionado!.modelo,
        marca: veiculoSelecionado!.marca,
        ano: veiculoSelecionado!.ano,
      };

      await frotaService.enviarSolicitacao(payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erro ao enviar solicitação de frota"
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "#001e50",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1.25rem",
          py: 2,
          px: 3,
        }}
      >
        Nova Solicitação de Combustível - Frota
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5, px: 2, pb: 2 }}>
        {loadingDados ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Mensagens de erro/sucesso */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </Grid>
            )}
            {success && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Solicitação enviada com sucesso!
                </Alert>
              </Grid>
            )}

            {/* Seleção de Veículo */}
            <Grid item xs={12}>
              <Autocomplete
                size="small"
                options={veiculos}
                getOptionLabel={(option) =>
                  `${option.placa} - ${option.marca} ${option.modelo} (${option.ano})`
                }
                getOptionDisabled={(option) =>
                  option.status !== undefined && option.status !== "disponivel"
                }
                value={veiculoSelecionado}
                onChange={(_, newValue) => setVeiculoSelecionado(newValue)}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box
                      component="li"
                      key={key}
                      {...otherProps}
                      sx={{
                        display: "flex !important",
                        alignItems: "center",
                        gap: 1,
                        opacity:
                          option.status !== undefined &&
                          option.status !== "disponivel"
                            ? 0.5
                            : 1,
                      }}
                    >
                      {option.status !== undefined &&
                        option.status !== "disponivel" && (
                          <LockIcon fontSize="small" color="disabled" />
                        )}
                      <Box>
                        {`${option.placa} - ${option.marca} ${option.modelo} (${option.ano})`}
                        {option.status !== undefined &&
                          option.status !== "disponivel" && (
                            <Box
                              component="span"
                              sx={{
                                ml: 1,
                                fontSize: "0.75rem",
                                color: "text.secondary",
                              }}
                            >
                              - {option.status}
                            </Box>
                          )}
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Veículo"
                    placeholder="Selecione o veículo"
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <DirectionsCarIcon
                            sx={{ color: "action.active", mr: 1, ml: 1 }}
                          />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                disabled={submitting}
              />
            </Grid>

            {/* Informações do veículo selecionado */}
            {veiculoSelecionado && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <strong>Placa:</strong> {veiculoSelecionado.placa}
                    </Grid>
                    <Grid item xs={6}>
                      <strong>Marca:</strong> {veiculoSelecionado.marca}
                    </Grid>
                    <Grid item xs={6}>
                      <strong>Modelo:</strong> {veiculoSelecionado.modelo}
                    </Grid>
                    <Grid item xs={6}>
                      <strong>Ano:</strong> {veiculoSelecionado.ano}
                    </Grid>
                    <Grid item xs={12}>
                      <strong>KM Atual (BestDrive):</strong>{" "}
                      {veiculoSelecionado.quilometragem_atual.toLocaleString(
                        "pt-BR"
                      )}{" "}
                      km
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}

            {/* Tipo de Combustível */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth disabled={submitting}>
                <InputLabel>Tipo de Combustível *</InputLabel>
                <Select
                  value={tipoCombustivel}
                  label="Tipo de Combustível *"
                  onChange={(e) => setTipoCombustivel(e.target.value)}
                >
                  <MenuItem value="Gasolina">Gasolina</MenuItem>
                  <MenuItem value="Etanol">Etanol</MenuItem>
                  <MenuItem value="Diesel">Diesel</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Quantidade de Litros */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={
                  tanqueCheio
                    ? "Quantidade de Litros"
                    : "Quantidade de Litros *"
                }
                type="number"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                disabled={submitting || tanqueCheio}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalGasStationIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ step: "0.01", min: "0" }}
                helperText={
                  tanqueCheio
                    ? "Não é necessário informar litros para tanque cheio"
                    : "Informe a quantidade de litros"
                }
              />
            </Grid>

            {/* Tanque Cheio */}
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                  pt: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={tanqueCheio}
                      onChange={(e) => setTanqueCheio(e.target.checked)}
                      disabled={submitting}
                    />
                  }
                  label="Tanque Cheio"
                />
              </Box>
            </Grid>

            {/* Departamento */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={departamentos}
                getOptionLabel={(option) => option.nome}
                value={departamentoSelecionado}
                onChange={(_, newValue) => setDepartamentoSelecionado(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Departamento *"
                    placeholder="Selecione o departamento"
                  />
                )}
                disabled={submitting}
              />
            </Grid>

            {/* Aprovador */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={aprovadores}
                getOptionLabel={(option) => option.nome}
                value={aprovadorSelecionado}
                onChange={(_, newValue) => setAprovadorSelecionado(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Aprovador *"
                    placeholder="Selecione o aprovador"
                  />
                )}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          variant="outlined"
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || loadingDados || success}
          variant="contained"
          sx={{
            backgroundColor: "#001e50",
            "&:hover": { backgroundColor: "#003080" },
          }}
        >
          {submitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              Enviando...
            </>
          ) : (
            "Enviar Solicitação"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
