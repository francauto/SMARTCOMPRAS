"use client";
import React from "react";
import { Button, Grid, Paper, Typography, Box, Alert } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import ModalBase from "@/components/modal-base";
import StatusBadge from "@/components/StatusBadge";
import BotaoImpressao from "@/components/botao-impressao";
import { combustivelEstoqueService } from "@/services/combustivelEstoqueService";
import { CombustivelEstoqueRequisicaoDetalhada } from "@/types/combustivel-estoque";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";

interface ModalDetalhesCombustivelEstoqueProps {
  /** Callback quando dados são carregados */
  onDataLoaded?: (data: CombustivelEstoqueRequisicaoDetalhada) => void;
  /** Callback ao aprovar */
  onAprovar?: (id: number) => Promise<void>;
  /** Callback ao reprovar */
  onReprovar?: (id: number) => Promise<void>;
  /** Callback ao imprimir */
  onImprimir?: (id: number) => void;
  /** Callback para fechar o modal */
  onClose?: () => void;
  masterMode?: boolean;
  onAprovarMaster?: (id: number) => Promise<void>;
  onRecusarMaster?: (id: number) => Promise<void>;
}

export default function ModalDetalhesCombustivelEstoque({
  onDataLoaded,
  onAprovar,
  onReprovar,
  onImprimir,
  onClose,
  masterMode = false,
  onAprovarMaster,
  onRecusarMaster,
}: ModalDetalhesCombustivelEstoqueProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isMasterMode = searchParams.get("source") === "master" && masterMode;
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleAprovar = async (id: number) => {
    if (onAprovar) {
      await onAprovar(id);
      setRefreshKey((prev) => prev + 1); // Força o reload dos dados
    }
  };

  const handleReprovar = async (id: number) => {
    if (onReprovar) {
      await onReprovar(id);
      setRefreshKey((prev) => prev + 1); // Força o reload dos dados
    }
  };

  return (
    <ModalBase<CombustivelEstoqueRequisicaoDetalhada>
      key={refreshKey}
      modalParam="modal"
      modalValue="detalhes"
      idParam="id"
      fetchData={async (id) => {
        const response = await combustivelEstoqueService.buscarPorId(
          typeof id === "string" ? Number(id) : id
        );
        if (!response.data) {
          throw new Error("Dados não encontrados");
        }
        return response.data;
      }}
      title={(data) =>
        data ? `Requisição de Combustível Estoque #${data.id}` : "Carregando..."
      }
      subtitle={(data) =>
        data
          ? `${data.marca} ${data.modelo}${
              data.placa
                ? ` - ${data.placa}`
                : data.chassi
                ? ` - Chassi: ${data.chassi}`
                : ""
            }`
          : ""
      }
      maxWidth="lg"
      onDataLoaded={onDataLoaded}
      onClose={onClose}
      renderContent={(data, loading, error) => {
        if (!data) return null;

        return (
          <Grid container spacing={1.5}>
            {/* Grid 2x2 - Linha 1 */}
            {/* Card Combustível - Unificado */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 1.5,
                  background:
                    "linear-gradient(135deg, #001e50 0%, #003080 100%)",
                  color: "white",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1.5,
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
                  >
                    <LocalGasStationIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.9, mb: 0.25, fontSize: "0.65rem" }}
                      >
                        Tipo de Combustível
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, fontSize: "1rem" }}
                      >
                        {data.tipo_combustivel || "Não especificado"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.9, mb: 0.25, fontSize: "0.65rem" }}
                    >
                      Quantidade Solicitada
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, fontSize: "1.75rem" }}
                    >
                      {data.quantidade_litros}L
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Card de Status */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 1.5,
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
                  height: "100%",
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
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, fontSize: "1rem" }}
                    >
                      {data.marca} {data.modelo}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <StatusBadge status={data.status} />
                      {data.impresso === 1 && (
                        <StatusBadge status="Impresso" size="small" />
                      )}
                    </Box>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#666", fontSize: "0.75rem" }}
                  >
                    {data.placa
                      ? `Placa: ${data.placa}`
                      : data.chassi
                      ? `Chassi: ${data.chassi}`
                      : "Sem identificação"}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Grid 2x2 - Linha 2 */}
            {/* Coluna Esquerda - Informações do Veículo */}
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  height: "100%",
                  borderTop: "2px solid #001e50",
                }}
              >
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: "#001e50",
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    fontSize: "0.9rem",
                  }}
                >
                  <LocalGasStationIcon fontSize="small" />
                  Dados do Veículo
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {data.placa && (
                    <InfoCard label="Placa" value={data.placa} highlight />
                  )}
                  {data.chassi && (
                    <InfoCard
                      label="Chassi (últimos 6 dígitos)"
                      value={data.chassi}
                      highlight
                    />
                  )}
                  <InfoCard label="Marca" value={data.marca} />
                  <InfoCard label="Modelo" value={data.modelo} />
                </Box>
              </Paper>
            </Grid>

            {/* Coluna Direita - Informações da Solicitação */}
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  height: "100%",
                  borderTop: "2px solid #001e50",
                }}
              >
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: "#001e50",
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    fontSize: "0.9rem",
                  }}
                >
                  <InfoIcon fontSize="small" />
                  Dados da Solicitação
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <InfoCard
                    label="Solicitante"
                    value={data.solicitante_nome}
                    highlight
                  />
                  <InfoCard
                    label="Aprovador"
                    value={data.aprovador_nome}
                    highlight
                  />
                  {data.departamento_nome && (
                    <InfoCard
                      label="Departamento"
                      value={data.departamento_nome}
                    />
                  )}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <InfoCard
                        label="Data Solicitação"
                        value={
                          data.data_solicitacao
                            ? new Date(data.data_solicitacao).toLocaleString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "-"
                        }
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <InfoCard
                        label="Data Resposta"
                        value={
                          data.data_aprovacao
                            ? new Date(data.data_aprovacao).toLocaleString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "-"
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );
      }}
      renderActions={(data, loading) => {
        if (!data || loading) return null;

        // MODO MASTER: Mostrar botões apenas se status = Pendente
        if (isMasterMode && user?.master === 1 && data.status === "Pendente") {
          return (
            <>
              <Alert
                severity="warning"
                icon={<InfoIcon />}
                sx={{ flex: 1, bgcolor: "#fff3cd" }}
              >
                <strong>MASTER:</strong> Você pode aprovar/recusar esta
                requisição
              </Alert>
              <Button
                onClick={async () => {
                  if (onRecusarMaster) {
                    await onRecusarMaster(data.id);
                    setRefreshKey((prev) => prev + 1); // Força reload
                  }
                }}
                color="error"
                variant="outlined"
                disabled={loading}
              >
                Recusar (Master)
              </Button>
              <Button
                onClick={async () => {
                  if (onAprovarMaster) {
                    await onAprovarMaster(data.id);
                    setRefreshKey((prev) => prev + 1); // Força reload
                  }
                }}
                color="primary"
                variant="contained"
                disabled={loading}
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
              nametable="combustivel_request_estoque"
              impresso={data.impresso}
              variant="contained"
              size="medium"
              fullWidth
              onPrintSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
          );
        }

        // Verifica se o usuário logado é o aprovador da requisição
        const isUserAprovador = user && user.id === data.id_aprovador;

        // Se status for Pendente, mostra alerta no footer
        if (data.status === "Pendente") {
          // Alerta quando não é o aprovador
          if (user && user.id !== data.id_aprovador) {
            return (
              <>
                <Alert severity="info" icon={<InfoIcon />} sx={{ flex: 1 }}>
                  Esta solicitação está aguardando aprovação de{" "}
                  <strong>{data.aprovador_nome}</strong>.
                </Alert>
              </>
            );
          }

          // Alerta quando é o aprovador (com botões)
          if (isUserAprovador) {
            return (
              <>
                <Alert severity="warning" icon={<InfoIcon />} sx={{ flex: 1 }}>
                  Esta solicitação está aguardando{" "}
                  <strong>sua aprovação</strong>.
                </Alert>
                <Button
                  onClick={async () => {
                    await handleReprovar(data.id);
                    onClose?.();
                  }}
                  color="error"
                  variant="outlined"
                  disabled={loading}
                >
                  Reprovar
                </Button>
                <Button
                  onClick={async () => {
                    await handleAprovar(data.id);
                    onClose?.();
                  }}
                  color="primary"
                  variant="contained"
                  disabled={loading}
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
        }

        // Se status for Aprovado, mostra botão de imprimir ou badge (apenas para o solicitante)
        if (data.status === "Aprovado" && data.id_solicitante === user?.id) {
          return (
            <BotaoImpressao
              id_requisicao={data.id}
              nametable="combustivel_request_estoque"
              impresso={data.impresso}
              variant="contained"
              size="medium"
              fullWidth
              onPrintSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
          );
        }

        // Outros status: apenas fechar
        return null;
      }}
    />
  );
}

// Componente auxiliar para card de informação
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
        border: highlight ? "1px solid #e0e0e0" : "none",
        transition: "all 0.2s",
        "&:hover": {
          backgroundColor: "#f8f9fa",
          transform: "translateX(3px)",
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "#666",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          fontSize: "0.6rem",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: highlight ? 700 : 500,
          color: highlight ? "#001e50" : "#333",
          mt: 0.2,
          fontSize: highlight ? "0.9rem" : "0.8rem",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// StatusBadge importado do componente global
