"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ModalBase from "@/components/modal-base";
import StatusBadge from "@/components/StatusBadge";
import BotaoImpressao from "@/components/botao-impressao";
import PrintIcon from "@mui/icons-material/Print";
import PersonIcon from "@mui/icons-material/Person";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { estoqueService } from "@/services/estoqueService";
import { EstoqueRequisicaoDetalhada } from "@/types/estoque";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";

// --- FUNÇÕES AUXILIARES ---

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "R$ -";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// --- COMPONENTES AUXILIARES DE ESTILO ---

interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

function InfoCard({ label, value, highlight }: InfoCardProps) {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1.5,
        backgroundColor: highlight ? "#f8f9fa" : "transparent",
        border: highlight ? "1px solid #e9ecef" : "none",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "#6c757d",
          fontWeight: 500,
          fontSize: "0.7rem",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: highlight ? 600 : 500,
          color: highlight ? "#001e50" : "#212529",
          fontSize: "0.9rem",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// StatusBadge importado do componente global

// --- COMPONENTE PRINCIPAL ---

interface ModalDetalhesEstoqueProps {
  onStatusChange?: () => void;
  onClose?: () => void;
  showPrintButton?: boolean;
  masterMode?: boolean;
  onAprovarMaster?: (id: number) => Promise<void>;
  onRecusarMaster?: (id: number) => Promise<void>;
}

export default function ModalDetalhesEstoque({
  onStatusChange,
  onClose,
  showPrintButton,
  masterMode = false,
  onAprovarMaster,
  onRecusarMaster,
}: ModalDetalhesEstoqueProps = {}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isMasterMode = searchParams.get("source") === "master" && masterMode;

  const [loadingAction, setLoadingAction] = useState<
    "aprovar" | "recusar" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (actionError || successMessage) {
      const timer = setTimeout(() => {
        setActionError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionError, successMessage]);

  const handleAprovarOuRecusar = async (id: number, aprovado: boolean) => {
    setLoadingAction(aprovado ? "aprovar" : "recusar");
    setActionError(null);
    setSuccessMessage(null);
    try {
      await estoqueService.aprovarOuRecusarRequisicao({
        id_requisicao: id,
        aprovado,
      });
      setSuccessMessage(
        `Requisição ${aprovado ? "aprovada" : "recusada"} com sucesso!`
      );
      setRefreshKey((k) => k + 1);
      if (onStatusChange) onStatusChange();
    } catch (e: any) {
      setActionError(
        e?.response?.data?.message || e?.message || "Erro ao processar a ação."
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePrint = (data?: EstoqueRequisicaoDetalhada | null) => {
    if (!data) return;
    window.print();
  };

  return (
    <ModalBase<EstoqueRequisicaoDetalhada>
      key={refreshKey}
      modalParam="modal"
      modalValue="detalhes"
      idParam="id"
      fetchData={async (id) => {
        const res = await estoqueService.buscarPorId(Number(id));
        return res?.data?.[0] || res;
      }}
      title={(data) =>
        data ? `Requisição de Estoque #${data.id}` : "Carregando..."
      }
      maxWidth="lg"
      onClose={onClose}
      renderContent={(data) => {
        if (!data) return null;

        return (
          <>
            <Collapse in={!!actionError}>
              <Alert
                severity="error"
                onClose={() => setActionError(null)}
                sx={{ mb: 2 }}
              >
                {actionError}
              </Alert>
            </Collapse>
            <Collapse in={!!successMessage}>
              <Alert
                severity="success"
                onClose={() => setSuccessMessage(null)}
                sx={{ mb: 2 }}
              >
                {successMessage}
              </Alert>
            </Collapse>

            <Grid container spacing={2}>
              {/* Card de Custo Total */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 1.2,
                    background:
                      "linear-gradient(135deg, #001e50 0%, #003080 100%)",
                    color: "white",
                    height: "100%",
                    minWidth: 180,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, mb: 0.5, fontSize: "0.85rem" }}
                    >
                      Custo Total
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, fontSize: "1.1rem" }}
                    >
                      {formatCurrency(data.valor_custo_total)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Card de Status/Descrição */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 1.2,
                    height: "100%",
                    background:
                      data.status === "Pendente"
                        ? "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"
                        : data.status === "Aprovado"
                        ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
                        : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                    borderLeft: `4px solid ${
                      data.status === "Pendente"
                        ? "#ff9800"
                        : data.status === "Aprovado"
                        ? "#4caf50"
                        : "#f44336"
                    }`,
                    minWidth: 220,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: "100%",
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, fontSize: "1rem" }}
                      >
                        {data.cliente_venda || "Cliente não informado"}
                      </Typography>
                      <StatusBadge status={data.status} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#555", fontSize: "0.95rem" }}
                    >
                      Fornecedor: {data.fornecedor || "-"}
                    </Typography>
                    {data.descricao && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#001e50",
                          fontWeight: 500,
                          fontSize: "0.95rem",
                          mt: 0.5,
                        }}
                      >
                        {data.descricao}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Detalhes da Requisição */}
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, height: "100%", borderTop: "2px solid #001e50" }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <InfoCard
                      label="Solicitante"
                      value={data.nome_solicitante || "-"}
                      highlight
                    />
                    <InfoCard
                      label="Aprovador"
                      value={data.nome_aprovador || "-"}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <InfoCard
                          label="Data da Requisição"
                          value={formatDateTime(data.data_requisicao)}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <InfoCard
                          label="Data de Aprovação"
                          value={formatDateTime(data.data_aprovacao)}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Detalhes da Venda */}
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, height: "100%", borderTop: "2px solid #001e50" }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <InfoCard
                      label="Cliente"
                      value={
                        `${data.cod_cliente} - ${data.cliente_venda}` || "-"
                      }
                      highlight
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <InfoCard
                          label="Valor da Venda"
                          value={formatCurrency(data.valor_venda)}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <InfoCard
                          label="Valor do Frete"
                          value={formatCurrency(data.valor_frete)}
                        />
                      </Box>
                    </Box>
                    <InfoCard
                      label="Entrega Direta"
                      value={
                        data.entrega_direta ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CloseIcon color="error" />
                        )
                      }
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Tabela de Itens */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ mt: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      p: 2,
                      pb: 1,
                      fontWeight: 600,
                      color: "#001e50",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <ShoppingCartIcon fontSize="small" />
                    Itens da Requisição
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 600 } }}>
                          <TableCell>Descrição</TableCell>
                          <TableCell align="right">Qtd.</TableCell>
                          <TableCell align="right">Valor Unitário</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.isArray(data.itens) && data.itens.length > 0 ? (
                          data.itens.map((item: any) => (
                            <TableRow
                              key={item.id}
                              sx={{
                                "&:last-child td, &:last-child th": {
                                  border: 0,
                                },
                              }}
                            >
                              <TableCell component="th" scope="row">
                                {item.descricao}
                              </TableCell>
                              <TableCell align="right">{item.qtde}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(item.valor_unitario)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatCurrency(
                                  item.qtde * item.valor_unitario
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              Nenhum item encontrado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </>
        );
      }}
      renderActions={(data) => {
        if (!data) return null;

        // MODO MASTER: Mostrar botões apenas se status = Pendente
        if (isMasterMode && user?.master === 1 && data.status === "Pendente") {
          return (
            <>
              <Alert
                severity="warning"
                icon={<InfoOutlinedIcon />}
                sx={{ flex: 1, bgcolor: "#fff3cd" }}
              >
                <strong>MASTER:</strong> Você pode aprovar/recusar esta
                requisição
              </Alert>
              <Button
                color="error"
                variant="outlined"
                disabled={!!loadingAction}
                onClick={async () => {
                  if (onRecusarMaster) {
                    await onRecusarMaster(data.id);
                    setRefreshKey((prev) => prev + 1); // Força reload
                  }
                }}
              >
                Reprovar (Master)
              </Button>
              <Button
                variant="contained"
                disabled={!!loadingAction}
                onClick={async () => {
                  if (onAprovarMaster) {
                    await onAprovarMaster(data.id);
                    setRefreshKey((prev) => prev + 1); // Força reload
                  }
                }}
                sx={{
                  backgroundColor: "#001e50",
                  "&:hover": { backgroundColor: "#003080" },
                }}
              >
                Aprovar (Master)
              </Button>
            </>
          );
        }

        // MODO MASTER: Se Aprovado e não impresso, mostrar botão de impressão
        if (
          isMasterMode &&
          user?.master === 1 &&
          data.status === "Aprovado" &&
          data.impresso === 0
        ) {
          return (
            <BotaoImpressao
              id_requisicao={data.id}
              nametable="requisicoes_estoque"
              impresso={data.impresso}
              variant="contained"
              size="medium"
              fullWidth
              onPrintSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
          );
        }

        // Só permite aprovar/recusar se for o aprovador
        if (
          data.status === "Pendente" &&
          user &&
          user.id === data.id_aprovador
        ) {
          return (
            <>
              <Alert
                severity="warning"
                icon={<InfoOutlinedIcon />}
                sx={{ flex: 1, border: "none", background: "#fffbe6" }}
              >
                Esta solicitação está aguardando <strong>sua aprovação</strong>.
              </Alert>
              <Button
                color="error"
                variant="outlined"
                disabled={!!loadingAction}
                onClick={() => handleAprovarOuRecusar(data.id, false)}
                startIcon={
                  loadingAction === "recusar" ? (
                    <CircularProgress size={20} />
                  ) : null
                }
              >
                Reprovar
              </Button>
              <Button
                variant="contained"
                disabled={!!loadingAction}
                onClick={() => handleAprovarOuRecusar(data.id, true)}
                startIcon={
                  loadingAction === "aprovar" ? (
                    <CircularProgress size={20} />
                  ) : null
                }
                sx={{
                  backgroundColor: "#001e50",
                  "&:hover": { backgroundColor: "#003080" },
                }}
              >
                Aprovar
              </Button>
            </>
          );
        }

        // Botão de impressão ou badge quando aprovado (apenas para o solicitante)
        if (data.status === "Aprovado" && user?.id === data.id_solicitante) {
          return (
            <BotaoImpressao
              id_requisicao={data.id}
              nametable="requisicoes_estoque"
              impresso={data.impresso}
              variant="contained"
              size="medium"
              fullWidth
              onPrintSuccess={() => setRefreshKey((k) => k + 1)}
            />
          );
        }

        return null;
      }}
    />
  );
}
