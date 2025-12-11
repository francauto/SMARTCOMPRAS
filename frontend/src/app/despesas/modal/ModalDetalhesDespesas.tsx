"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Typography,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PrintIcon from "@mui/icons-material/Print";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import GroupsIcon from "@mui/icons-material/Groups";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ModalBase from "@/components/modal-base";
import StatusBadge from "@/components/StatusBadge";
import BotaoImpressao from "@/components/botao-impressao";
import { despesasService } from "@/services/despesasService";
import { masterService } from "@/services/masterService";
import { DespesaRequisicao } from "@/types/despesas";
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
        p: 0.75,
        borderRadius: 1.5,
        backgroundColor: highlight ? "#f8f9fa" : "transparent",
        border: highlight ? "1px solid #e9ecef" : "none",
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "#6c757d", fontWeight: 500, fontSize: "0.65rem" }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: highlight ? 600 : 500,
          color: highlight ? "#001e50" : "#212529",
          fontSize: "0.8rem",
          lineHeight: 1.4,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// StatusBadge importado do componente global

// --- COMPONENTE PRINCIPAL ---

interface ModalDetalhesDespesasProps {
  onClose?: () => void;
  onStatusChange?: () => void;
  masterMode?: boolean;
  onAprovarMaster?: (id: number) => Promise<void>;
  onRecusarMaster?: (id: number, motivo: string) => Promise<void>;
}

export default function ModalDetalhesDespesas({
  onClose,
  onStatusChange,
  masterMode = false,
  onAprovarMaster,
  onRecusarMaster,
}: ModalDetalhesDespesasProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isMasterMode = searchParams.get("source") === "master" && masterMode;
  const allowedRoles = ["admger", "ger", "admdir", "dir"];
  const [loadingAction, setLoadingAction] = useState<
    "aprovar" | "recusar" | "aprovarGerente" | "aprovarDiretor" | null
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

  const handleAprovarCota = async (
    id_requisicao: number,
    id_cota: number,
    fornecedorNome: string,
    totalGerentes: number,
    gerentesAprovadores: number
  ) => {
    setLoadingAction("aprovar");
    setActionError(null);
    setSuccessMessage(null);
    try {
      if (user && (user.cargo === "ger" || user.cargo === "admger")) {
        await despesasService.aprovarCotaGerente({ id_requisicao, id_cota });
        setSuccessMessage(
          `Cota do fornecedor "${fornecedorNome}" aprovada com sucesso!`
        );
      } else if (user && (user.cargo === "dir" || user.cargo === "admdir")) {
        // Validação: todos os gerentes devem ter aprovado ESTA cota específica
        if (gerentesAprovadores < totalGerentes) {
          throw new Error(
            `Esta cota ainda não foi aprovada por todos os gerentes (${gerentesAprovadores}/${totalGerentes}).`
          );
        }
        await despesasService.aprovarCotaDiretor({ id_requisicao, id_cota });
        setSuccessMessage(
          `Cota do fornecedor "${fornecedorNome}" aprovada como diretor!`
        );
      } else {
        throw new Error("Usuário não autorizado para esta ação.");
      }
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

  const handleRecusarCota = async (
    id_requisicao: number,
    id_cota: number,
    fornecedorNome: string
  ) => {
    setLoadingAction("recusar");
    setActionError(null);
    setSuccessMessage(null);
    try {
      await despesasService.recusarCota({ id_requisicao, id_cota });
      setSuccessMessage(
        `Cota do fornecedor "${fornecedorNome}" recusada com sucesso!`
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

  const handlePrint = () => window.print();

  return (
    <ModalBase<DespesaRequisicao>
      key={refreshKey}
      onClose={onClose}
      title={(data) =>
        data ? `Requisição de Despesa #${data.id}` : "Carregando..."
      }
      subtitle={(data) => (data ? data.descricao : "")}
      maxWidth="lg"
      modalParam="modal"
      modalValue="detalhes"
      idParam="id"
      fetchData={async (id) => await despesasService.buscarPorId(Number(id))}
      renderContent={(_data) => {
        if (!_data) return null;

        const valorTotal =
          _data.fornecedores?.reduce(
            (acc, forn) => acc + (forn.valor_total || 0),
            0
          ) || 0;

        return (
          <>
            <Collapse in={!!actionError}>
              <Alert
                severity="error"
                onClose={() => setActionError(null)}
                sx={{ mb: 1.5 }}
              >
                {actionError}
              </Alert>
            </Collapse>
            <Collapse in={!!successMessage}>
              <Alert
                severity="success"
                onClose={() => setSuccessMessage(null)}
                sx={{ mb: 1.5 }}
              >
                {successMessage}
              </Alert>
            </Collapse>

            <Grid container spacing={1.5}>
              {/* LINHA 1: DADOS DA REQUISIÇÃO x DEPARTAMENTOS E APROVAÇÕES */}
              {/* CARD DADOS DA SOLICITAÇÃO (ESQUERDA) */}
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderTop: "2px solid #001e50",
                    height: "100%",
                  }}
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
                    <PersonIcon fontSize="small" />
                    Dados da Requisição
                  </Typography>
                  <Grid container spacing={0.5}>
                    <Grid item xs={12}>
                      <InfoCard
                        label="Solicitante"
                        value={
                          _data.nome_solicitante || _data.solicitante || "-"
                        }
                        highlight
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <InfoCard
                        label="Data da Solicitação"
                        value={formatDateTime(
                          _data.data_requisicao || _data.data_solicitacao
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <InfoCard
                        label="Data Resposta"
                        value={formatDateTime(
                          _data.data_aprovacao_diretor || _data.data_recusa
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* CARD DEPARTAMENTOS E APROVAÇÕES (DIREITA) */}
              <Grid item xs={12} md={8}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderTop: "2px solid #001e50",
                    height: "100%",
                  }}
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
                    <BusinessIcon fontSize="small" />
                    Departamentos e Aprovações
                  </Typography>

                  {/* TABELA DE GERENTES, DEPARTAMENTOS E STATUS */}
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                      boxShadow: "none",
                      borderRadius: 1,
                      mb: 1.5,
                      maxHeight: "400px",
                      overflow: "auto",
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow
                          sx={{
                            "& .MuiTableCell-root": {
                              fontWeight: 600,
                              fontSize: "0.7rem",
                              color: "#001e50",
                              py: 0.75,
                              bgcolor: "#f8f9fa",
                              borderBottom: "2px solid #e0e0e0",
                            },
                          }}
                        >
                          <TableCell>Gerente</TableCell>
                          <TableCell>Departamentos</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {_data.gerentes && _data.gerentes.length > 0 ? (
                          _data.gerentes.map((gerente, index) => {
                            // Determinar status do gerente
                            let gerenteStatus = "Pendente";

                            if (
                              _data.status === "Reprovada" ||
                              _data.status === "Recusada"
                            ) {
                              const foiEsteGerenteQueRecusou =
                                _data.usuario_recusador?.trim() ===
                                gerente.nome?.trim();

                              if (foiEsteGerenteQueRecusou) {
                                gerenteStatus = "Recusado";
                              } else if (gerente.aprovou === 1) {
                                gerenteStatus = "Aprovado";
                              } else {
                                gerenteStatus = "Não se aplica";
                              }
                            } else {
                              gerenteStatus =
                                gerente.aprovou === 1 ? "Aprovado" : "Pendente";
                            }

                            return (
                              <TableRow
                                key={`${gerente.id}-${index}`}
                                sx={{
                                  "&:hover": { bgcolor: "#f8f9fa" },
                                  "& .MuiTableCell-root": {
                                    fontSize: "0.75rem",
                                    py: 1,
                                    borderBottom: "1px solid #f0f0f0",
                                  },
                                }}
                              >
                                <TableCell sx={{ fontWeight: 500 }}>
                                  {gerente.nome}
                                </TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                    }}
                                  >
                                    {gerente.departamentos &&
                                    gerente.departamentos.length > 0 ? (
                                      (() => {
                                        // Filtrar apenas departamentos que estão na requisição E que o gerente é responsável
                                        const departamentosVinculados =
                                          gerente.departamentos
                                            .map((depGerente) => {
                                              const depRequisicao =
                                                _data.departamentos?.find(
                                                  (d) => d.id === depGerente.id
                                                );
                                              return depRequisicao
                                                ? {
                                                    id: depGerente.id,
                                                    nome: depGerente.nome,
                                                    percentual:
                                                      depRequisicao.percent,
                                                  }
                                                : null;
                                            })
                                            .filter((dep) => dep !== null);

                                        const isMaster =
                                          gerente.departamentos[0]?.nome ===
                                          "Master";

                                        // Se é Master, mostrar chip Master
                                        if (isMaster) {
                                          return (
                                            <Chip
                                              key="master"
                                              label="Master"
                                              size="small"
                                              sx={{
                                                height: "20px",
                                                fontSize: "0.65rem",
                                                fontWeight: 600,
                                                bgcolor: "#ffd700",
                                                color: "#001e50",
                                              }}
                                            />
                                          );
                                        }

                                        // Se tem departamentos vinculados, mostrar
                                        if (
                                          departamentosVinculados.length > 0
                                        ) {
                                          return departamentosVinculados.map(
                                            (dep: any) => (
                                              <Chip
                                                key={dep.id}
                                                label={`${dep.nome} (${dep.percentual}%)`}
                                                size="small"
                                                sx={{
                                                  height: "20px",
                                                  fontSize: "0.65rem",
                                                  fontWeight: 500,
                                                  bgcolor: "#e6eaf0",
                                                  color: "#001e50",
                                                }}
                                              />
                                            )
                                          );
                                        }

                                        // Não tem departamentos relacionados à requisição
                                        return (
                                          <Typography
                                            variant="caption"
                                            color="textSecondary"
                                            fontSize="0.65rem"
                                          >
                                            -
                                          </Typography>
                                        );
                                      })()
                                    ) : (
                                      <Typography
                                        variant="caption"
                                        color="textSecondary"
                                        fontSize="0.65rem"
                                      >
                                        -
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <StatusBadge
                                    status={gerenteStatus}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                fontSize="0.7rem"
                              >
                                Nenhum gerente atribuído
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>

                      {/* FOOTER COM DIRETOR */}
                      <TableFooter>
                        <TableRow
                          sx={{
                            bgcolor: "#f0f4f8",
                            "& .MuiTableCell-root": {
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              borderTop: "2px solid #e0e0e0",
                              py: 1.25,
                            },
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Chip
                                label="DIRETOR"
                                size="small"
                                sx={{
                                  height: "18px",
                                  fontSize: "0.6rem",
                                  fontWeight: 700,
                                  bgcolor: "#001e50",
                                  color: "#fff",
                                  mr: 0.5,
                                }}
                              />
                              <PersonIcon
                                fontSize="small"
                                sx={{ color: "#001e50" }}
                              />
                              {_data.nome_aprovador_diretor || "Diretor"}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{ color: "#666", fontStyle: "italic" }}
                          >
                            Aprovação Final
                          </TableCell>
                          <TableCell align="center">
                            <StatusBadge
                              status={
                                _data.aprovado_diretor === 1
                                  ? "Aprovado"
                                  : _data.aprovado_diretor === 0 &&
                                    (_data.status === "Reprovada" ||
                                      _data.status === "Recusada")
                                  ? _data.usuario_recusador?.trim() ===
                                    _data.nome_aprovador_diretor?.trim()
                                    ? "Recusado"
                                    : "Não se aplica"
                                  : "Pendente"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* LINHA 2: FORNECEDORES COM APROVAÇÃO POR COTA (FULL WIDTH) */}
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{ borderTop: "2px solid #001e50" }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      p: "12px 16px 8px 16px",
                      fontWeight: 600,
                      color: "#001e50",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <ShoppingCartIcon fontSize="small" />
                    Fornecedores e Cotas
                  </Typography>

                  {_data.fornecedores?.map((forn, index) => {
                    const totalGerentes = _data.gerentes?.length || 0;
                    const gerentesAprovadores =
                      forn.gerentes_aprovadores?.length || 0;
                    const todosGerentesAprovaramEstaCota =
                      totalGerentes > 0 &&
                      gerentesAprovadores === totalGerentes;
                    const isPendente =
                      _data.status === "Pendente" &&
                      user &&
                      allowedRoles.includes(user.cargo);
                    const isGerente =
                      user && (user.cargo === "ger" || user.cargo === "admger");
                    const isDiretor =
                      user && (user.cargo === "dir" || user.cargo === "admdir");

                    // NOVA LÓGICA: Verificar se o usuário está na lista de gerentes designados
                    const isGerenteDesignado =
                      user &&
                      isGerente &&
                      _data.gerentes?.some((g: any) => g.id === user.id);

                    const jaAprovou = forn.gerentes_aprovadores?.some(
                      (g) => g.id === user?.id
                    );

                    // Verificar se existe alguma cota já aprovada (escolhida pelo primeiro gerente)
                    const algumaCotaFoiEscolhida = _data.fornecedores?.some(
                      (f) =>
                        f.gerentes_aprovadores &&
                        f.gerentes_aprovadores.length > 0
                    );
                    const estaCotaFoiEscolhida = gerentesAprovadores > 0;

                    return (
                      <Box
                        key={forn.id_cota || `fornecedor-${index}`}
                        sx={{
                          p: 2,
                          borderTop: index > 0 ? "1px solid #e0e0e0" : "none",
                          bgcolor:
                            forn.status === "Aprovada"
                              ? "#f1f8f4"
                              : forn.status === "Rejeitada"
                              ? "#fef3f3"
                              : "transparent",
                          borderLeft:
                            forn.status === "Aprovada"
                              ? "4px solid #4caf50"
                              : forn.status === "Rejeitada"
                              ? "4px solid #f44336"
                              : "4px solid transparent",
                        }}
                      >
                        {/* HEADER DA COTA: Nome, Valor, Status */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1.5,
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.95rem",
                                color: "#001e50",
                              }}
                            >
                              {forn.nome}
                            </Typography>
                            <StatusBadge
                              status={forn.status || "Pendente"}
                              size="small"
                            />
                          </Box>
                          <Chip
                            label={formatCurrency(forn.valor_total)}
                            size="small"
                            sx={{
                              bgcolor: "#e6eaf0",
                              color: "#001e50",
                              fontWeight: 600,
                            }}
                          />
                        </Box>

                        {/* TABELA DE ITENS */}
                        <TableContainer
                          component={Paper}
                          variant="outlined"
                          sx={{ boxShadow: "none" }}
                        >
                          <Table
                            size="small"
                            sx={{
                              "& .MuiTableCell-root": {
                                py: 0.75,
                                fontSize: "0.8rem",
                                borderColor: "#f0f0f0",
                              },
                            }}
                          >
                            <TableHead>
                              <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                                <TableCell
                                  sx={{ fontWeight: 600, color: "#001e50" }}
                                >
                                  Item
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 600, color: "#001e50" }}
                                >
                                  Qtd.
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 600, color: "#001e50" }}
                                >
                                  Valor Unit.
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {forn.itens?.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.descricao}</TableCell>
                                  <TableCell align="right">
                                    {item.qtde}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(item.valor_unitario)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* BOTÕES DE AÇÃO POR COTA */}
                        {isPendente && forn.id_cota && (
                          <Box
                            sx={{
                              mt: 1.5,
                              display: "flex",
                              gap: 1,
                              justifyContent: "flex-end",
                            }}
                          >
                            {/* MODO MASTER: Botões especiais para aprovar/recusar cota */}
                            {isMasterMode && user?.master === 1 ? (
                              <>
                                {/* Mostrar botões apenas se a cota não estiver rejeitada E se não houver cota aprovada OU for esta cota aprovada */}
                                {forn.status !== "Rejeitada" &&
                                  (!_data.fornecedores?.some(
                                    (f) => f.status === "Aprovada"
                                  ) ||
                                    forn.status === "Aprovada") && (
                                    <>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        disabled={!!loadingAction}
                                        onClick={async () => {
                                          setLoadingAction("recusar");
                                          try {
                                            await masterService.recusarDespesas(
                                              _data.id
                                            );
                                            setSuccessMessage(
                                              "Requisição recusada com sucesso!"
                                            );
                                            setRefreshKey((k) => k + 1);
                                          } catch (error: any) {
                                            setActionError(
                                              error.response?.data?.error ||
                                                "Erro ao recusar requisição"
                                            );
                                          } finally {
                                            setLoadingAction(null);
                                          }
                                        }}
                                        startIcon={
                                          loadingAction === "recusar" ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <CloseIcon fontSize="small" />
                                          )
                                        }
                                        sx={{ fontSize: "0.75rem" }}
                                      >
                                        Recusar Requisição
                                      </Button>

                                      {/* Botão Aprovar como Gerente: só mostrar se ainda faltam gerentes para aprovar */}
                                      {!todosGerentesAprovaramEstaCota && (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          disabled={!!loadingAction}
                                          onClick={async () => {
                                            setLoadingAction("aprovarGerente");
                                            try {
                                              await masterService.aprovarDespesasGerente(
                                                _data.id,
                                                forn.id_cota!
                                              );
                                              setSuccessMessage(
                                                `Cota "${forn.nome}" aprovada como Gerente!`
                                              );
                                              setRefreshKey((k) => k + 1);
                                            } catch (error: any) {
                                              setActionError(
                                                error.response?.data?.error ||
                                                  "Erro ao aprovar cota como Gerente"
                                              );
                                            } finally {
                                              setLoadingAction(null);
                                            }
                                          }}
                                          startIcon={
                                            loadingAction ===
                                            "aprovarGerente" ? (
                                              <CircularProgress size={16} />
                                            ) : (
                                              <CheckIcon fontSize="small" />
                                            )
                                          }
                                          sx={{
                                            fontSize: "0.75rem",
                                            backgroundColor: "#001e50",
                                            "&:hover": {
                                              backgroundColor: "#003080",
                                            },
                                            mr: 1,
                                          }}
                                        >
                                          Aprovar como Gerente
                                        </Button>
                                      )}

                                      <Button
                                        size="small"
                                        variant="contained"
                                        disabled={!!loadingAction}
                                        onClick={async () => {
                                          setLoadingAction("aprovarDiretor");
                                          try {
                                            await masterService.aprovarDespesasDiretor(
                                              _data.id,
                                              forn.id_cota!
                                            );
                                            setSuccessMessage(
                                              `Cota "${forn.nome}" aprovada como Diretor!`
                                            );
                                            setRefreshKey((k) => k + 1);
                                          } catch (error: any) {
                                            setActionError(
                                              error.response?.data?.error ||
                                                "Erro ao aprovar cota como Diretor"
                                            );
                                          } finally {
                                            setLoadingAction(null);
                                          }
                                        }}
                                        startIcon={
                                          loadingAction === "aprovarDiretor" ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <CheckIcon fontSize="small" />
                                          )
                                        }
                                        sx={{
                                          fontSize: "0.75rem",
                                          backgroundColor: "#2e7d32",
                                          "&:hover": {
                                            backgroundColor: "#1b5e20",
                                          },
                                        }}
                                      >
                                        Aprovar como Diretor
                                      </Button>
                                    </>
                                  )}
                              </>
                            ) : (
                              /* MODO NORMAL: Lógica original para gerentes/diretores */
                              <>
                                {/* COTA APROVADA OU PENDENTE: Mostrar botões */}
                                {forn.status !== "Rejeitada" && (
                                  <>
                                    {/* GERENTE: pode aprovar se for designado E não aprovou ainda */}
                                    {isGerenteDesignado && !jaAprovou && (
                                      <>
                                        {/* Se já existe cota escolhida e NÃO é esta, mostrar aviso */}
                                        {algumaCotaFoiEscolhida &&
                                        !estaCotaFoiEscolhida ? (
                                          <Alert
                                            severity="warning"
                                            sx={{ flex: 1, py: 0.5 }}
                                          >
                                            <Typography
                                              variant="body2"
                                              fontSize="0.75rem"
                                            >
                                              ⚠️ Outro gerente já escolheu uma
                                              cota diferente. Você deve aprovar
                                              a cota escolhida.
                                            </Typography>
                                          </Alert>
                                        ) : (
                                          <>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="error"
                                              disabled={!!loadingAction}
                                              onClick={() =>
                                                handleRecusarCota(
                                                  _data.id,
                                                  forn.id_cota!,
                                                  forn.nome || "Fornecedor"
                                                )
                                              }
                                              startIcon={
                                                loadingAction === "recusar" ? (
                                                  <CircularProgress size={16} />
                                                ) : (
                                                  <CloseIcon fontSize="small" />
                                                )
                                              }
                                              sx={{ fontSize: "0.75rem" }}
                                            >
                                              Recusar esta Cota
                                            </Button>
                                            <Button
                                              size="small"
                                              variant="contained"
                                              disabled={!!loadingAction}
                                              onClick={() =>
                                                handleAprovarCota(
                                                  _data.id,
                                                  forn.id_cota!,
                                                  forn.nome || "Fornecedor",
                                                  totalGerentes,
                                                  gerentesAprovadores
                                                )
                                              }
                                              startIcon={
                                                loadingAction === "aprovar" ? (
                                                  <CircularProgress size={16} />
                                                ) : (
                                                  <CheckIcon fontSize="small" />
                                                )
                                              }
                                              sx={{
                                                fontSize: "0.75rem",
                                                backgroundColor: "#001e50",
                                                "&:hover": {
                                                  backgroundColor: "#003080",
                                                },
                                              }}
                                            >
                                              {algumaCotaFoiEscolhida
                                                ? "Aprovar esta Cota"
                                                : "Escolher esta Cota"}
                                            </Button>
                                          </>
                                        )}
                                      </>
                                    )}

                                    {/* GERENTE: já aprovou */}
                                    {isGerenteDesignado && jaAprovou && (
                                      <Alert
                                        severity="success"
                                        sx={{ flex: 1, py: 0.5 }}
                                      >
                                        <Typography
                                          variant="body2"
                                          fontSize="0.75rem"
                                        >
                                          ✅ Você já aprovou esta cota
                                        </Typography>
                                      </Alert>
                                    )}

                                    {/* GERENTE: tem cargo mas não está designado */}
                                    {isGerente && !isGerenteDesignado && (
                                      <Alert
                                        severity="info"
                                        sx={{ flex: 1, py: 0.5 }}
                                      >
                                        <Typography
                                          variant="body2"
                                          fontSize="0.75rem"
                                        >
                                          ℹ️ Você não está designado como
                                          aprovador desta requisição
                                        </Typography>
                                      </Alert>
                                    )}

                                    {/* DIRETOR: pode aprovar se todos gerentes aprovaram esta cota */}
                                    {isDiretor &&
                                      todosGerentesAprovaramEstaCota && (
                                        <>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            disabled={!!loadingAction}
                                            onClick={() =>
                                              handleRecusarCota(
                                                _data.id,
                                                forn.id_cota!,
                                                forn.nome || "Fornecedor"
                                              )
                                            }
                                            startIcon={
                                              loadingAction === "recusar" ? (
                                                <CircularProgress size={16} />
                                              ) : (
                                                <CloseIcon fontSize="small" />
                                              )
                                            }
                                            sx={{ fontSize: "0.75rem" }}
                                          >
                                            Recusar esta Cota
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            disabled={!!loadingAction}
                                            onClick={() =>
                                              handleAprovarCota(
                                                _data.id,
                                                forn.id_cota!,
                                                forn.nome || "Fornecedor",
                                                totalGerentes,
                                                gerentesAprovadores
                                              )
                                            }
                                            startIcon={
                                              loadingAction === "aprovar" ? (
                                                <CircularProgress size={16} />
                                              ) : (
                                                <CheckIcon fontSize="small" />
                                              )
                                            }
                                            sx={{
                                              fontSize: "0.75rem",
                                              backgroundColor: "#001e50",
                                              "&:hover": {
                                                backgroundColor: "#003080",
                                              },
                                            }}
                                          >
                                            Aprovar esta Cota (Diretor)
                                          </Button>
                                        </>
                                      )}

                                    {/* DIRETOR: aguardando gerentes */}
                                    {isDiretor &&
                                      !todosGerentesAprovaramEstaCota &&
                                      estaCotaFoiEscolhida && (
                                        <Alert
                                          severity="warning"
                                          sx={{ flex: 1, py: 0.5 }}
                                        >
                                          <Typography
                                            variant="body2"
                                            fontSize="0.75rem"
                                          >
                                            ⏳ Aguardando aprovação de todos os
                                            gerentes para esta cota (
                                            {gerentesAprovadores}/
                                            {totalGerentes})
                                          </Typography>
                                        </Alert>
                                      )}
                                  </>
                                )}
                              </>
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Paper>
              </Grid>

              {/* LINHA 3: VALOR TOTAL x REQUISIÇÃO */}
            </Grid>
          </>
        );
      }}
      renderActions={(_data) => {
        if (!_data) return null;

        // MODO MASTER: Se Aprovado e não impresso, mostrar botão de impressão
        if (
          isMasterMode &&
          user?.master === 1 &&
          (_data.status === "Aprovado" || _data.status === "Aprovada") &&
          _data.impresso === 0
        ) {
          return (
            <BotaoImpressao
              id_requisicao={_data.id}
              nametable="requisicoes"
              impresso={_data.impresso}
              variant="contained"
              size="medium"
              fullWidth
              onPrintSuccess={() => setRefreshKey((k) => k + 1)}
            />
          );
        }

        // Botão de impressão ou badge quando aprovado (apenas para o solicitante)
        if (
          (_data.status === "Aprovado" || _data.status === "Aprovada") &&
          user?.id === _data.id_solicitante
        ) {
          return (
            <BotaoImpressao
              id_requisicao={_data.id}
              nametable="requisicoes"
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
