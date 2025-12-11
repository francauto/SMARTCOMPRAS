"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Autocomplete,
  InputAdornment,
  Alert,
  Grid,
  CircularProgress,
  Stack,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Paper,
  Switch,
  FormControlLabel,
  Chip,
} from "@mui/material";
import {
  AddCircleOutline as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocalShipping as ShippingIcon,
} from "@mui/icons-material";
import { aprovadoresService } from "@/services/aprovadorService";
import { estoqueService } from "@/services/estoqueService";

// Interfaces
interface ModalNovaSolicitacaoEstoqueProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}
interface Item {
  descricao: string;
  qtde: number;
  valor_unitario: number;
}
interface Aprovador {
  id: number;
  nome: string;
}

// Componente
export default function ModalNovaSolicitacaoEstoque({
  open,
  onClose,
  onSubmit,
}: ModalNovaSolicitacaoEstoqueProps) {
  // --- ESTADOS ---
  const [fornecedor, setFornecedor] = useState("");
  const [itens, setItens] = useState<Item[]>([
    { descricao: "", qtde: 1, valor_unitario: 0 },
  ]);
  const [clienteVenda, setClienteVenda] = useState("");
  const [codCliente, setCodCliente] = useState("");
  const [valorVenda, setValorVenda] = useState<number>(0);
  const [idAprovador, setIdAprovador] = useState<number | null>(null);
  const [entregaDireta, setEntregaDireta] = useState(false);
  const [valorFrete, setValorFrete] = useState<number>(0);
  const [error, setError] = useState("");
  const [aprovadores, setAprovadores] = useState<Aprovador[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      aprovadoresService
        .getAprovadores()
        .then((data) => {
          setAprovadores(
            data.map((aprov: any) => ({ id: aprov.id, nome: aprov.nome }))
          );
        })
        .catch(() => setError("Falha ao carregar aprovadores."));
    }
  }, [open]);

  // --- MANIPULADORES (Handlers) ---
  const handleAddItem = () =>
    setItens([...itens, { descricao: "", qtde: 1, valor_unitario: 0 }]);
  const handleRemoveItem = (i: number) =>
    setItens(itens.filter((_, idx) => idx !== i));

  const handleItemChange = (
    i: number,
    field: keyof Item,
    value: string | number
  ) => {
    const newItens = [...itens];
    if (field === "qtde" || field === "valor_unitario") {
      (newItens[i] as any)[field] =
        value === undefined || value === null ? 0 : value;
    } else {
      (newItens[i] as any)[field] = value;
    }
    setItens(newItens);
  };

  // --- CÁLCULOS ---
  const totalPedido = useMemo(
    () =>
      itens.reduce(
        (acc, item) =>
          acc + Number(item.qtde ?? 0) * Number(item.valor_unitario ?? 0),
        0
      ),
    [itens]
  );

  const totalAPagar = useMemo(
    () => totalPedido + Number(valorFrete ?? 0),
    [totalPedido, valorFrete]
  );

  // --- SUBMISSÃO E FECHAMENTO ---
  const resetState = () => {
    setFornecedor("");
    setItens([{ descricao: "", qtde: 1, valor_unitario: 0 }]);
    setClienteVenda("");
    setCodCliente("");
    setValorVenda(0);
    setIdAprovador(null);
    setEntregaDireta(false);
    setValorFrete(0);
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fornecedor.trim() || !idAprovador) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!clienteVenda.trim() || !codCliente.trim() || valorVenda <= 0) {
      setError("Preencha todas as informações de venda.");
      return;
    }

    if (
      itens.some(
        (item) =>
          !item.descricao.trim() || item.qtde <= 0 || item.valor_unitario <= 0
      )
    ) {
      setError(
        "Todos os itens devem ter descrição, quantidade e valor válidos."
      );
      return;
    }

    setLoading(true);
    const payload = {
      fornecedor,
      Itens: itens.map((i) => ({
        ...i,
        qtde: +i.qtde,
        valor_unitario: +i.valor_unitario,
      })),
      cliente_venda: clienteVenda || "",
      cod_cliente: codCliente || "",
      valor_venda: valorVenda > 0 ? valorVenda : 0,
      id_aprovador: idAprovador!,
      entrega_direta: entregaDireta,
      valor_frete: Number(valorFrete ?? 0),
      valor_total: totalAPagar,
      descricao: fornecedor,
      valor: totalAPagar,
    };

    try {
      const response = await estoqueService.criarSolicitacao(payload);
      setSuccess(true);
      onSubmit(response);
      setTimeout(handleClose, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erro ao criar a solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ py: 2, px: 3, bgcolor: "#001e50", color: "white" }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <BusinessIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Nova Solicitação de Estoque
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* FORNECEDOR */}
            <TextField
              fullWidth
              size="small"
              label="Nome do Fornecedor"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <BusinessIcon sx={{ color: "action.active", mr: 1 }} />
                ),
              }}
            />

            {/* ITENS */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" mb={1}>
                Itens do Pedido
              </Typography>
              <Card variant="outlined">
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Stack spacing={1}>
                    {itens.map((item, i) => (
                      <Grid container spacing={1} alignItems="center" key={i}>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Item"
                            value={item.descricao}
                            onChange={(e) =>
                              handleItemChange(i, "descricao", e.target.value)
                            }
                            required
                          />
                        </Grid>
                        <Grid item xs={4} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Qtd"
                            value={item.qtde ?? 0}
                            onChange={(e) =>
                              handleItemChange(
                                i,
                                "qtde",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            required
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={4} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Valor"
                            value={item.valor_unitario ?? 0}
                            onChange={(e) =>
                              handleItemChange(
                                i,
                                "valor_unitario",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            required
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                        <Grid item xs={3} sm={2}>
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            color="#001e50"
                          >
                            {(
                              Number(item.qtde ?? 0) *
                              Number(item.valor_unitario ?? 0)
                            ).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </Typography>
                        </Grid>
                        <Grid item xs={1} sm={1}>
                          <IconButton
                            onClick={() => handleRemoveItem(i)}
                            disabled={itens.length === 1}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Adicionar Item
                    </Button>
                  </Stack>
                </CardContent>
                <CardActions
                  sx={{
                    py: 1,
                    px: 2,
                    bgcolor: "#e3f2fd",
                    justifyContent: "flex-end",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="700"
                    color="#001e50"
                  >
                    Subtotal:{" "}
                    {totalPedido.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Typography>
                </CardActions>
              </Card>
            </Box>

            {/* CLIENTE E VENDA */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight="600" mb={1.5}>
                Informações de Venda
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cliente"
                    value={clienteVenda}
                    onChange={(e) => setClienteVenda(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Código Cliente"
                    value={codCliente}
                    onChange={(e) => setCodCliente(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Valor Venda"
                    value={valorVenda || ""}
                    onChange={(e) =>
                      setValorVenda(parseFloat(e.target.value) || 0)
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ENTREGA E FRETE */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight="600" mb={1.5}>
                <ShippingIcon
                  sx={{ fontSize: 18, verticalAlign: "middle", mr: 0.5 }}
                />
                Entrega e Frete
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Valor do Frete"
                    value={valorFrete || ""}
                    onChange={(e) =>
                      setValorFrete(parseFloat(e.target.value) || 0)
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={entregaDireta}
                        onChange={(e) => setEntregaDireta(e.target.checked)}
                      />
                    }
                    label="Entrega Direta para Cliente"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* APROVADOR */}
            <Autocomplete
              size="small"
              options={aprovadores}
              getOptionLabel={(o) => o.nome}
              value={aprovadores.find((a) => a.id === idAprovador) || null}
              onChange={(_, v) => setIdAprovador(v?.id || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Aprovador Responsável"
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <PersonIcon sx={{ color: "action.active", mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {/* RESUMO */}
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#e3f2fd",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "#001e50",
              }}
            >
              <Stack spacing={0.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="#001e50">
                    Subtotal:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {totalPedido.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="#001e50">
                    Frete:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {Number(valorFrete ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  pt={0.5}
                  borderTop="1px solid"
                  borderColor="#001e50"
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="700"
                    color="#001e50"
                  >
                    Total:
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight="700"
                    color="#001e50"
                  >
                    {totalAPagar.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert severity="success">Solicitação criada com sucesso!</Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Criar Solicitação"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
