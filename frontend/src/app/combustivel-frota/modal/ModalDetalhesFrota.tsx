"use client";

import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Modal,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HistoryIcon from "@mui/icons-material/History";
import ModalBase from "@/components/modal-base";
import StatusBadge from "@/components/StatusBadge";
import BotaoImpressao from "@/components/botao-impressao";
import ModalAnexarCupom from "./ModalAnexarCupom";
import { frotaService } from "@/services/frotaService";
import { bestdriveService } from "@/services/bestdriveService";
import { FrotaRequisicaoDetalhada } from "@/types/frota";
import { HistoryDataResponse } from "@/types/bestdrive";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import ReceiptIcon from "@mui/icons-material/Receipt";

// --- FUNÇÕES AUXILIARES ---

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
        p: 0.75,
        borderRadius: 1.5,
        backgroundColor: highlight ? "#f8f9fa" : "transparent",
        border: highlight ? "1px solid #e9ecef" : "none",
      }}
    >
      <Typography
        variant="caption"
        component="div"
        sx={{ color: "#6c757d", fontWeight: 500, fontSize: "0.65rem" }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          fontWeight: highlight ? 600 : 500,
          color: highlight ? "#001e50" : "#212529",
          fontSize: "0.8rem",
          lineHeight: 1.4,
        }}
      >
        {value}
      </Box>
    </Box>
  );
}

// StatusBadge importado do componente global

// --- COMPONENTE PRINCIPAL ---

interface ModalDetalhesFrotaProps {
  onDataLoaded?: (data: FrotaRequisicaoDetalhada) => void;
  onAprovar?: (id: number) => void;
  onRecusar?: (id: number) => void;
  onClose?: () => void;
  masterMode?: boolean;
  onAprovarMaster?: (id: number) => Promise<void>;
  onRecusarMaster?: (id: number) => Promise<void>;
}

export default function ModalDetalhesFrota({
  onDataLoaded,
  onAprovar,
  onRecusar,
  onClose,
  masterMode = false,
  onAprovarMaster,
  onRecusarMaster,
}: ModalDetalhesFrotaProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isMasterMode = searchParams.get("source") === "master" && masterMode;
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [modalCupomOpen, setModalCupomOpen] = React.useState(false);
  const [idRequisicaoAtual, setIdRequisicaoAtual] = React.useState<
    number | null
  >(null);
  const [tabValue, setTabValue] = React.useState(0);
  const [historico, setHistorico] = React.useState<HistoryDataResponse | null>(
    null
  );
  const [loadingHistorico, setLoadingHistorico] = React.useState(false);
  const [veiculoIdAtual, setVeiculoIdAtual] = React.useState<number | null>(
    null
  );

  // Função para forçar reload do modal
  const forceReload = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Wrapper para onAprovar que recarrega o modal
  const handleAprovar = React.useCallback(
    async (id: number) => {
      if (onAprovar) {
        await onAprovar(id);
        forceReload();
      }
    },
    [onAprovar, forceReload]
  );

  // Wrapper para onRecusar que recarrega o modal
  const handleRecusar = React.useCallback(
    async (id: number) => {
      if (onRecusar) {
        await onRecusar(id);
        forceReload();
      }
    },
    [onRecusar, forceReload]
  );

  // Função para carregar histórico quando mudar para a aba 1
  const handleTabChange = React.useCallback(
    async (event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);

      // Se mudou para aba de histórico e ainda não carregou
      if (newValue === 1 && !historico && veiculoIdAtual) {
        setLoadingHistorico(true);
        try {
          const response = await bestdriveService.buscarHistorico(
            veiculoIdAtual
          );
          setHistorico(response);
        } catch (error) {
          console.error("Erro ao buscar histórico:", error);
        } finally {
          setLoadingHistorico(false);
        }
      }
    },
    [historico, veiculoIdAtual]
  );

  // Reset do estado quando o modal fecha
  React.useEffect(() => {
    return () => {
      setTabValue(0);
      setHistorico(null);
      setVeiculoIdAtual(null);
    };
  }, [refreshKey]);

  return (
    <>
      <ModalBase<FrotaRequisicaoDetalhada>
        key={refreshKey}
        modalParam="modal"
        modalValue="detalhes"
        idParam="id"
        fetchData={(id) =>
          frotaService.buscarPorId(typeof id === "string" ? Number(id) : id)
        }
        title={(data) =>
          data ? `Requisição de Combustível #${data.id}` : "Carregando..."
        }
        subtitle={(data) => (data ? `${data.placa} - ${data.modelo}` : "")}
        maxWidth="lg"
        onClose={onClose}
        onDataLoaded={(data) => {
          // Armazena o ID do veículo quando os dados são carregados
          if (data?.veiculo_id) {
            setVeiculoIdAtual(data.veiculo_id);
          }
          // Chama o callback original se existir
          if (onDataLoaded) {
            onDataLoaded(data);
          }
        }}
        renderContent={(data) => {
          if (!data) return null;

          // Verifica se o usuário tem permissão para ver o histórico
          const cargosPermitidos = ["ger", "admger", "dir", "admdir"];
          const podeVerHistorico =
            user?.cargo && cargosPermitidos.includes(user.cargo);

          return (
            <Box>
              {/* Tabs com estilo sutil */}
              {podeVerHistorico && (
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  sx={{
                    minHeight: "42px",
                    mb: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "& .MuiTabs-indicator": {
                      height: "2px",
                      backgroundColor: "#001e50",
                    },
                    "& .MuiTab-root": {
                      minHeight: "42px",
                      fontSize: "0.875rem",
                      textTransform: "none",
                      fontWeight: 500,
                      color: "text.secondary",
                      opacity: 0.7,
                      px: 3,
                      "&.Mui-selected": {
                        color: "#001e50",
                        opacity: 1,
                      },
                      "&:hover": {
                        opacity: 0.9,
                      },
                    },
                  }}
                >
                  <Tab label="Detalhes" />
                  <Tab label="Histórico de Consumo" />
                </Tabs>
              )}

              {/* Conteúdo da aba de Detalhes */}
              {tabValue === 0 && (
                <Grid container spacing={1.5}>
                  {/* CARD QUANTIDADE */}
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
                          gap: 2,
                          height: "100%",
                        }}
                      >
                        <LocalGasStationIcon
                          sx={{ fontSize: 36, opacity: 0.9 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.8, fontSize: "0.7rem" }}
                          >
                            {data.tanque_cheio
                              ? "Abastecimento"
                              : "Quantidade Solicitada"}
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, lineHeight: 1.2 }}
                          >
                            {data.tanque_cheio
                              ? "Tanque Cheio"
                              : `${data.quantidade_litros} Litros`}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* CARD STATUS */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 1.5,
                        height: "100%",
                        background:
                          data.status === "Pendente"
                            ? "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"
                            : data.status === "Finalizado"
                            ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
                            : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                        borderLeft: `4px solid ${
                          data.status === "Pendente"
                            ? "#ff9800"
                            : data.status === "Finalizado"
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
                          gap: 0.25,
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
                            variant="subtitle1"
                            sx={{ fontWeight: 700 }}
                          >
                            {data.modelo}
                          </Typography>
                          {data.status === "Pendente" &&
                          !Boolean(data.respondido_bestdrive) ? (
                            <StatusBadge status="Aguardando controlador de chaves" />
                          ) : (
                            <StatusBadge status={data.status} />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ color: "#555", fontSize: "0.8rem" }}
                        >
                          Placa: {data.placa}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* CARD INFORMAÇÕES DO VEÍCULO */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderTop: "2px solid #001e50" }}
                    >
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          color: "#001e50",
                          mb: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DirectionsCarIcon fontSize="small" />
                        Informações do Veículo
                      </Typography>
                      <Grid container spacing={0.5}>
                        <Grid item xs={6}>
                          <InfoCard
                            label="Placa"
                            value={data.placa}
                            highlight
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoCard label="Veículo" value={data.modelo} />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoCard
                            label="KM Atual"
                            value={data.km_veiculo.toLocaleString("pt-BR")}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoCard
                            label="Combustível"
                            value={data.tipo_combustivel}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* CARD INFORMAÇÕES DA SOLICITAÇÃO */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderTop: "2px solid #001e50" }}
                    >
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          color: "#001e50",
                          mb: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <InfoOutlinedIcon fontSize="small" />
                        Informações da Solicitação
                      </Typography>
                      <Grid container spacing={0.5}>
                        <Grid item xs={6}>
                          <InfoCard
                            label="Solicitante"
                            value={data.nome_solicitante}
                            highlight
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoCard
                            label="Aprovador"
                            value={data.nome_aprovador}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <InfoCard
                            label="Departamento"
                            value={data.departamento_nome}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoCard
                            label="Data Solicitação"
                            value={formatDateTime(data.data_solicitacao)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoCard
                            label="Data Aprovação"
                            value={formatDateTime(data.data_aprovacao)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoCard
                            label="Impresso"
                            value={
                              data.impresso ? (
                                <CheckIcon fontSize="small" color="success" />
                              ) : (
                                <CloseIcon fontSize="small" color="error" />
                              )
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoCard
                            label="Status"
                            value={
                              data.status === "Pendente" &&
                              !Boolean(data.respondido_bestdrive) ? (
                                <StatusBadge status="Aguardando controlador de chaves" />
                              ) : (
                                <StatusBadge status={data.status} />
                              )
                            }
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Conteúdo da aba de Histórico */}
              {tabValue === 1 && (
                <Box>
                  {loadingHistorico ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : historico?.status && historico?.data ? (
                    <Grid container spacing={2}>
                      {/* Resumo Total */}
                      <Grid item xs={12}>
                        <Paper
                          sx={{
                            p: 2,
                            background:
                              "linear-gradient(135deg, #001e50 0%, #003080 100%)",
                            color: "white",
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Total de Registros: {historico.data.totalRecords}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ opacity: 0.9, mt: 0.5 }}
                          >
                            {historico.data.internal.total} interno(s) •{" "}
                            {historico.data.bestDrive.total} BestDrive
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Histórico Interno */}
                      {historico.data.internal.total > 0 && (
                        <Grid item xs={12}>
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, borderTop: "3px solid #001e50" }}
                          >
                            <Typography
                              variant="h6"
                              gutterBottom
                              sx={{
                                color: "#001e50",
                                fontWeight: 600,
                                mb: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <DirectionsCarIcon />
                              Histórico Interno ({
                                historico.data.internal.total
                              }{" "}
                              {historico.data.internal.total === 1
                                ? "registro"
                                : "registros"}
                              )
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Data Saída
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Data Chegada
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontWeight: 600 }}
                                      align="right"
                                    >
                                      KM Saída
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontWeight: 600 }}
                                      align="right"
                                    >
                                      KM Chegada
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontWeight: 600 }}
                                      align="right"
                                    >
                                      KM Rodados
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Motivo
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontWeight: 600 }}
                                      align="center"
                                    >
                                      Status
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {historico.data.internal.history.map(
                                    (record, index) => (
                                      <TableRow
                                        key={`internal-${record.SolicitacaoID}-${index}`}
                                        hover
                                        sx={{
                                          "&:hover": {
                                            backgroundColor: "#f8f9fa",
                                          },
                                        }}
                                      >
                                        <TableCell>
                                          {new Date(
                                            record.DataSaida
                                          ).toLocaleString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </TableCell>
                                        <TableCell>
                                          {record.DataChegada
                                            ? new Date(
                                                record.DataChegada
                                              ).toLocaleString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })
                                            : "-"}
                                        </TableCell>
                                        <TableCell align="right">
                                          {record.KmSaida.toLocaleString(
                                            "pt-BR"
                                          )}
                                        </TableCell>
                                        <TableCell align="right">
                                          {record.KmChegada
                                            ? record.KmChegada.toLocaleString(
                                                "pt-BR"
                                              )
                                            : "-"}
                                        </TableCell>
                                        <TableCell align="right">
                                          <Box
                                            component="span"
                                            sx={{
                                              fontWeight: 700,
                                              color: "#001e50",
                                              backgroundColor: "#e3f2fd",
                                              px: 1,
                                              py: 0.5,
                                              borderRadius: 1,
                                              display: "inline-block",
                                            }}
                                          >
                                            {record.KmRodados.toLocaleString(
                                              "pt-BR"
                                            )}{" "}
                                            km
                                          </Box>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 300 }}>
                                          <Typography
                                            variant="body2"
                                            noWrap
                                            title={record.MotivoSaida}
                                          >
                                            {record.MotivoSaida}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          <StatusBadge status={record.Status} />
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        </Grid>
                      )}

                      {/* Histórico BestDrive */}
                      {historico.data.bestDrive.total > 0 && (
                        <Grid item xs={12}>
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, borderTop: "3px solid #ff9800" }}
                          >
                            <Typography
                              variant="h6"
                              gutterBottom
                              sx={{
                                color: "#ff9800",
                                fontWeight: 600,
                                mb: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <LocalGasStationIcon />
                              Histórico BestDrive (
                              {historico.data.bestDrive.total}{" "}
                              {historico.data.bestDrive.total === 1
                                ? "registro"
                                : "registros"}
                              )
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: "#fff3e0" }}>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Data Saída
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Data Chegada
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontWeight: 600 }}
                                      align="right"
                                    >
                                      KM Saída
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontWeight: 600 }}
                                      align="right"
                                    >
                                      KM Chegada
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontWeight: 600 }}
                                      align="right"
                                    >
                                      KM Rodados
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Cliente
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontWeight: 600 }}
                                      align="center"
                                    >
                                      Status
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {historico.data.bestDrive.history.map(
                                    (record, index) => (
                                      <TableRow
                                        key={`bestdrive-${record.SolicitacaoID}-${index}`}
                                        hover
                                        sx={{
                                          "&:hover": {
                                            backgroundColor: "#fffbf0",
                                          },
                                        }}
                                      >
                                        <TableCell>
                                          {new Date(
                                            record.DataHoraSaida
                                          ).toLocaleString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </TableCell>
                                        <TableCell>
                                          {record.DataHoraChegada
                                            ? new Date(
                                                record.DataHoraChegada
                                              ).toLocaleString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })
                                            : "-"}
                                        </TableCell>
                                        <TableCell align="right">
                                          {record.KmSaida.toLocaleString(
                                            "pt-BR"
                                          )}
                                        </TableCell>
                                        <TableCell align="right">
                                          {record.KmChegada
                                            ? record.KmChegada.toLocaleString(
                                                "pt-BR"
                                              )
                                            : "-"}
                                        </TableCell>
                                        <TableCell align="right">
                                          <Box
                                            component="span"
                                            sx={{
                                              fontWeight: 700,
                                              color: "#e65100",
                                              backgroundColor: "#ffe0b2",
                                              px: 1,
                                              py: 0.5,
                                              borderRadius: 1,
                                              display: "inline-block",
                                            }}
                                          >
                                            {record.KmRodados.toLocaleString(
                                              "pt-BR"
                                            )}{" "}
                                            km
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          {record.ClienteNome || "-"}
                                        </TableCell>
                                        <TableCell align="center">
                                          <StatusBadge status={record.Status} />
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        </Grid>
                      )}

                      {/* Mensagem quando não há registros */}
                      {historico.data.internal.total === 0 &&
                        historico.data.bestDrive.total === 0 && (
                          <Grid item xs={12}>
                            <Alert severity="info" icon={<HistoryIcon />}>
                              Nenhum histórico de consumo encontrado para este
                              veículo
                            </Alert>
                          </Grid>
                        )}
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      Nenhum histórico disponível para este veículo
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          );
        }}
        renderActions={(data, loading) => {
          if (!data || loading) return null;

          // Verifica se está aguardando controlador de chaves
          const aguardandoControlador =
            data.status === "Pendente" && !Boolean(data.respondido_bestdrive);

          // MODO MASTER: Mostrar botões apenas se status = Pendente E já respondido pelo BestDrive
          if (
            isMasterMode &&
            user?.master === 1 &&
            data.status === "Pendente" &&
            !aguardandoControlador
          ) {
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
                nametable="combustivel_request"
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
            // Se está aguardando controlador, mostra apenas badge informativo
            if (aguardandoControlador) {
              return (
                <Alert severity="info" sx={{ width: "100%" }}>
                  Aguardando resposta do controlador de chaves antes de poder
                  aprovar/recusar esta solicitação.
                </Alert>
              );
            }

            return (
              <>
                <Button
                  onClick={() => handleRecusar(data.id)}
                  color="error"
                  variant="outlined"
                >
                  Recusar
                </Button>
                <Button
                  onClick={() => handleAprovar(data.id)}
                  color="primary"
                  variant="contained"
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
                nametable="combustivel_request"
                impresso={data.impresso}
                variant="contained"
                size="medium"
                fullWidth
                onPrintSuccess={() => setRefreshKey((prev) => prev + 1)}
              />
            );
          }

          // Botão de anexar cupom quando status é "Aguardando Cupom" (apenas solicitante)
          if (
            data.status === "Aguardando Cupom" &&
            user?.id === data.id_solicitante
          ) {
            return (
              <Button
                onClick={() => {
                  setIdRequisicaoAtual(data.id);
                  setModalCupomOpen(true);
                }}
                variant="contained"
                startIcon={<ReceiptIcon />}
                fullWidth
                sx={{
                  backgroundColor: "#ff9800",
                  "&:hover": { backgroundColor: "#f57c00" },
                }}
              >
                Anexar Cupom
              </Button>
            );
          }

          return null;
        }}
      />

      {/* Modal de Anexar Cupom */}
      {idRequisicaoAtual && (
        <ModalAnexarCupom
          open={modalCupomOpen}
          onClose={() => {
            setModalCupomOpen(false);
            setIdRequisicaoAtual(null);
          }}
          idRequisicao={idRequisicaoAtual}
          onSuccess={() => {
            forceReload();
            setModalCupomOpen(false);
            setIdRequisicaoAtual(null);
          }}
        />
      )}
    </>
  );
}
