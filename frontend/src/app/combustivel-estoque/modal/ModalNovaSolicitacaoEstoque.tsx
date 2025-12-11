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
  Autocomplete,
  InputAdornment,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import { combustivelEstoqueService } from "@/services/combustivelEstoqueService";
import { departamentoService } from "@/services/departamentoService";
import { aprovadoresService } from "@/services/aprovadorService";
import { fipeService } from "@/services/fipeService";
import { CriarRequisicaoCombustivelEstoque } from "@/types/combustivel-estoque";
import { Departamento, Aprovador } from "@/types/departamento";
import { FipeBrand, FipeModel } from "@/types/fipe";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface ModalNovaSolicitacaoEstoqueProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalNovaSolicitacaoEstoque({
  open,
  onClose,
  onSuccess,
}: ModalNovaSolicitacaoEstoqueProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Estados do formulário
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [aprovadores, setAprovadores] = useState<Aprovador[]>([]);

  // Estados FIPE
  const [marcasFipe, setMarcasFipe] = useState<FipeBrand[]>([]);
  const [modelosFipe, setModelosFipe] = useState<FipeModel[]>([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [loadingModelos, setLoadingModelos] = useState(false);
  // Novo: controle de disponibilidade da FIPE
  const [fipeIndisponivel, setFipeIndisponivel] = useState(false);

  const [tipoIdentificacao, setTipoIdentificacao] = useState<
    "placa" | "chassi"
  >("placa");
  const [placa, setPlaca] = useState<string>("");
  const [chassi, setChassi] = useState<string>("");
  const [marcaSelecionada, setMarcaSelecionada] = useState<FipeBrand | null>(
    null
  );
  const [modeloSelecionado, setModeloSelecionado] = useState<FipeModel | null>(
    null
  );
  // PALIATIVO: Campos manuais para marca e modelo
  const [marcaManual, setMarcaManual] = useState<string>("");
  const [modeloManual, setModeloManual] = useState<string>("");
  const [quantidadeLitros, setQuantidadeLitros] = useState<string>("");
  const [tipoCombustivel, setTipoCombustivel] = useState<string>("");
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
      const [departamentosRes, aprovadoresRes] = await Promise.all([
        departamentoService.listar(),
        aprovadoresService.getAprovadores(),
      ]);

      setDepartamentos(departamentosRes);
      setAprovadores(aprovadoresRes);

      // Carregar marcas da FIPE
      carregarMarcasFipe();
    } catch (err) {
      setError("Erro ao carregar dados");
      console.error(err);
    } finally {
      setLoadingDados(false);
    }
  };

  const carregarMarcasFipe = async () => {
    setLoadingMarcas(true);
    try {
      const marcas = await fipeService.buscarMarcas("cars");
      setMarcasFipe(marcas);
      setFipeIndisponivel(!marcas || marcas.length === 0);
    } catch (err) {
      console.error("Erro ao carregar marcas FIPE:", err);
      // Não exibe toast de erro, apenas ativa modo manual
      setFipeIndisponivel(true);
    } finally {
      setLoadingMarcas(false);
    }
  };

  const carregarModelosFipe = async (brandId: string) => {
    setLoadingModelos(true);
    setModelosFipe([]);
    setModeloSelecionado(null);
    try {
      const modelos = await fipeService.buscarModelos(brandId, "cars");
      setModelosFipe(modelos);
    } catch (err) {
      console.error("Erro ao carregar modelos FIPE:", err);
      setError("Erro ao carregar modelos de veículos");
    } finally {
      setLoadingModelos(false);
    }
  };

  // Quando marca for selecionada, buscar modelos
  useEffect(() => {
    if (marcaSelecionada) {
      carregarModelosFipe(marcaSelecionada.code);
    } else {
      setModelosFipe([]);
      setModeloSelecionado(null);
    }
  }, [marcaSelecionada]);

  const limparFormulario = () => {
    setTipoIdentificacao("placa");
    setPlaca("");
    setChassi("");
    setMarcaSelecionada(null);
    setModeloSelecionado(null);
    setModelosFipe([]);
    setMarcaManual("");
    setModeloManual("");
    setQuantidadeLitros("");
    setTipoCombustivel("");
    setDepartamentoSelecionado(null);
    setAprovadorSelecionado(null);
    setError(null);
    setSuccess(false);
  };

  const validarFormulario = (): boolean => {
    if (tipoIdentificacao === "placa" && !placa) {
      setError("Informe a Placa do veículo");
      return false;
    }
    if (tipoIdentificacao === "chassi" && !chassi) {
      setError("Informe o Chassi do veículo");
      return false;
    }
    // PALIATIVO: Aceitar marca e modelo manuais OU da FIPE
    if (!marcaSelecionada && !marcaManual.trim()) {
      setError("Informe a marca do veículo");
      return false;
    }
    if (!modeloSelecionado && !modeloManual.trim()) {
      setError("Informe o modelo do veículo");
      return false;
    }
    if (!quantidadeLitros || Number(quantidadeLitros) <= 0) {
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
      // PALIATIVO: Usar valores manuais se a FIPE não estiver disponível
      const payload: CriarRequisicaoCombustivelEstoque = {
        placa: placa || undefined,
        chassi: chassi || undefined,
        modelo: modeloSelecionado?.name || modeloManual.trim(),
        marca: marcaSelecionada?.name || marcaManual.trim(),
        quantidade_litros: Number(quantidadeLitros),
        tipo_combustivel: tipoCombustivel,
        id_aprovador: aprovadorSelecionado!.id,
        id_departamento: departamentoSelecionado!.id,
      };

      await combustivelEstoqueService.criarRequisicao(payload);
      setSuccess(true);
      showToast("Solicitação de combustível criada com sucesso!", "success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        "Erro ao enviar solicitação de combustível estoque";
      setError(errorMsg);
      showToast(errorMsg, "error");
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
        }}
      >
        Nova Solicitação de Combustível - Estoque
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
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
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
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

            {/* Seleção de tipo de identificação */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  Identificação do Veículo *
                </FormLabel>
                <RadioGroup
                  row
                  value={tipoIdentificacao}
                  onChange={(e) => {
                    setTipoIdentificacao(e.target.value as "placa" | "chassi");
                    setPlaca("");
                    setChassi("");
                  }}
                >
                  <FormControlLabel
                    value="placa"
                    control={<Radio />}
                    label="Placa"
                    disabled={submitting}
                  />
                  <FormControlLabel
                    value="chassi"
                    control={<Radio />}
                    label="Chassi (6 últimos dígitos)"
                    disabled={submitting}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Campo Placa ou Chassi baseado na seleção */}
            <Grid item xs={12} sm={6}>
              {tipoIdentificacao === "placa" ? (
                <TextField
                  fullWidth
                  label="Placa *"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  disabled={submitting}
                  placeholder="ABC-1234"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DirectionsCarIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Chassi (6 últimos dígitos) *"
                  value={chassi}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= 6) {
                      setChassi(value);
                    }
                  }}
                  disabled={submitting}
                  placeholder="004251"
                  inputProps={{ maxLength: 6 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FingerprintIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Grid>

            {/* Marca e Modelo: FIPE ou Manual */}
            {fipeIndisponivel ? (
              <>
                {/* Marca Manual */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Marca *"
                    placeholder="Digite a marca do veículo"
                    value={marcaManual}
                    onChange={(e) => setMarcaManual(e.target.value)}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DirectionsCarIcon />
                        </InputAdornment>
                      ),
                    }}
                    helperText="API FIPE indisponível - Digite manualmente"
                  />
                </Grid>
                {/* Modelo Manual */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Modelo *"
                    placeholder="Digite o modelo do veículo"
                    value={modeloManual}
                    onChange={(e) => setModeloManual(e.target.value)}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DirectionsCarIcon />
                        </InputAdornment>
                      ),
                    }}
                    helperText="API FIPE indisponível - Digite manualmente"
                  />
                </Grid>
              </>
            ) : (
              <>
                {/* Marca - Autocomplete com FIPE */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={marcasFipe}
                    getOptionLabel={(option) => option.name}
                    value={marcaSelecionada}
                    onChange={(_, newValue) => {
                      setMarcaSelecionada(newValue);
                    }}
                    loading={loadingMarcas}
                    disabled={submitting || loadingMarcas}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Marca *"
                        placeholder="Selecione a marca"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingMarcas ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                {/* Modelo - Autocomplete com FIPE */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={modelosFipe}
                    getOptionLabel={(option) => option.name}
                    value={modeloSelecionado}
                    onChange={(_, newValue) => {
                      setModeloSelecionado(newValue);
                    }}
                    loading={loadingModelos}
                    disabled={submitting || !marcaSelecionada || loadingModelos}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Modelo *"
                        placeholder={
                          marcaSelecionada
                            ? "Selecione o modelo"
                            : "Selecione uma marca primeiro"
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingModelos ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Tipo de Combustível */}
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantidade de Litros *"
                type="number"
                value={quantidadeLitros}
                onChange={(e) => setQuantidadeLitros(e.target.value)}
                disabled={submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalGasStationIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ step: "0.01", min: "0" }}
              />
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
