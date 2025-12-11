"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PrintIcon from "@mui/icons-material/Print";
import PersonIcon from "@mui/icons-material/Person";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ModalBase from "@/components/modal-base";
import StatusBadge from "@/components/StatusBadge";
import BotaoImpressao from "@/components/botao-impressao";
import { clientesService } from "@/services/clientesService";
import { ClienteRequisicao } from "@/types/clientes";
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
        sx={{ color: "#6c757d", fontWeight: 500, fontSize: "0.7rem" }}
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

interface ModalDetalhesClientesProps {
  onClose?: () => void;
  onStatusChange?: () => void;
  masterMode?: boolean;
  onAprovarMaster?: (id: number) => Promise<void>;
  onRecusarMaster?: (id: number) => Promise<void>;
}

export default function ModalDetalhesClientes({
  onClose,
  onStatusChange,
  masterMode = false,
  onAprovarMaster,
  onRecusarMaster,
}: ModalDetalhesClientesProps) {
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
      await clientesService.aprovarOuRecusarRequisicao({
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

  const handlePrint = (data?: ClienteRequisicao | null) => {
    if (!data) return;
    window.print();
  };

  return (
    <ModalBase<ClienteRequisicao>
      key={refreshKey}
      onClose={onClose}
      title={(data) =>
        data ? `Requisição de Cliente #${data.id}` : "Carregando..."
      }
      maxWidth="md"
      modalParam="modal"
      modalValue={["detalhes", "aprovar"]}
      idParam="id"
      fetchData={async (id) => {
        const res = await clientesService.buscarPorId(Number(id));
        if (!res) throw new Error("Requisição não encontrada");
        return res;
      }}
      renderContent={(_data) => {
        if (!_data) return null;
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
              {/* Card de Valor */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    background:
                      "linear-gradient(135deg, #001e50 0%, #003080 100%)",
                    color: "white",
                    height: "100%",
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
                      sx={{ opacity: 0.8, mb: 0.5 }}
                    >
                      Valor da Requisição
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formatCurrency(_data.valor)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Card de Status */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    height: "100%",
                    background:
                      _data.status === "Pendente"
                        ? "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"
                        : _data.status === "Aprovado"
                        ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
                        : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                    borderLeft: `4px solid ${
                      _data.status === "Pendente"
                        ? "#ff9800"
                        : _data.status === "Aprovado"
                        ? "#4caf50"
                        : "#f44336"
                    }`,
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
                    <Typography
                      variant="caption"
                      sx={{ color: "#666", fontSize: "0.7rem" }}
                    >
                      Solicitante
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 1 }}
                    >
                      {_data.solicitante_nome || _data.nome_solicitante || "-"}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#666", fontSize: "0.7rem" }}
                      >
                        Status:
                      </Typography>
                      <StatusBadge status={_data.status} />
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Detalhes da Solicitação */}
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, mt: 1, borderTop: "2px solid #001e50" }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      color: "#001e50",
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PersonIcon fontSize="small" />
                    Dados da Solicitação
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <InfoCard
                        label="Solicitante"
                        value={
                          (_data.solicitante_nome || _data.nome_solicitante) ??
                          "-"
                        }
                        highlight
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoCard
                        label="Aprovador"
                        value={
                          (_data.aprovador_nome || _data.nome_aprovador) ?? "-"
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoCard
                        label="Data da Solicitação"
                        value={formatDateTime(_data.data_solicitacao)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoCard
                        label="Data de Aprovação"
                        value={formatDateTime(_data.data_aprovacao)}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Descrição */}
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderTop: "2px solid #001e50" }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      color: "#001e50",
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <InfoOutlinedIcon fontSize="small" />
                    Descrição
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#333",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {_data.descricao || "Sem descrição informada"}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        );
      }}
      renderActions={(_data) => {
        if (!_data) return null;

        // MODO MASTER: Mostrar botões apenas se status = Pendente
        if (isMasterMode && user?.master === 1 && _data.status === "Pendente") {
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
                    await onRecusarMaster(_data.id);
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
                    await onAprovarMaster(_data.id);
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
          _data.status === "Aprovado" &&
          _data.impresso === 0
        ) {
          return (
            <BotaoImpressao
              id_requisicao={_data.id}
              nametable="cliente_request"
              impresso={_data.impresso}
              variant="contained"
              size="medium"
              fullWidth
              onPrintSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
          );
        }

        // Só permite aprovar/recusar se for o aprovador
        if (
          _data.status === "Pendente" &&
          user &&
          user.id === _data.id_aprovador
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
                onClick={() => handleAprovarOuRecusar(_data.id, false)}
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
                onClick={() => handleAprovarOuRecusar(_data.id, true)}
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
        if (_data.status === "Aprovado" && user?.id === _data.id_solicitante) {
          return (
            <BotaoImpressao
              id_requisicao={_data.id}
              nametable="cliente_request"
              impresso={_data.impresso}
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
