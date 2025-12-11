"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Paper,
} from "@mui/material";
import Table from "@/components/table";
import StatusBadge from "@/components/StatusBadge";
import {
  masterService,
  MasterFiltros,
  Modulo,
  MasterRequisicao,
} from "@/services/masterService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ModalDetalhesDespesas from "@/app/despesas/modal/ModalDetalhesDespesas";
import ModalDetalhesFrota from "@/app/combustivel-frota/modal/ModalDetalhesFrota";
import ModalDetalhesCombustivelEstoque from "@/app/combustivel-estoque/modal/ModalDetalhesCombustivelEstoque";
import ModalDetalhesEstoque from "@/app/estoque/modal/ModalDetalhesEstoque";
import ModalDetalhesClientes from "@/app/clientes/modal/ModalDetalhesClientes";

interface ModuloConfig {
  id: Modulo;
  nome: string;
  icon: any; // Componente de ícone (não instância)
  color: string;
}

const modulos: ModuloConfig[] = [
  {
    id: "despesas",
    nome: "Despesas",
    icon: ReceiptIcon,
    color: "#2196F3",
  },
  {
    id: "combustivel-frota",
    nome: "Combustível Frota",
    icon: DirectionsCarIcon,
    color: "#FF9800",
  },
  {
    id: "combustivel-estoque",
    nome: "Combustível Estoque",
    icon: LocalGasStationIcon,
    color: "#4CAF50",
  },
  {
    id: "estoque",
    nome: "Estoque",
    icon: InventoryIcon,
    color: "#9C27B0",
  },
  {
    id: "cliente",
    nome: "Clientes",
    icon: PeopleIcon,
    color: "#F44336",
  },
];

export default function MasterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [moduloSelecionado, setModuloSelecionado] =
    useState<Modulo>("despesas");
  const [rows, setRows] = useState<MasterRequisicao[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filtros, setFiltros] = useState<MasterFiltros>({});

  // Função para recarregar dados
  const reloadData = useCallback(() => {
    if (!authChecked) return;
    setLoading(true);
    masterService
      .listarRequisicoes(moduloSelecionado, page, pageSize, filtros)
      .then((response) => {
        if (response && response.message === "Nenhuma requisição encontrada.") {
          setRows([]);
          setTotal(0);
          setTotalPages(0);
          setError(null);
        } else {
          const mappedRows = (response.data || []).map((row: any) => ({
            ...row,
            id: row.id_requisicao ?? row.id,
          }));
          setRows(mappedRows);
          setTotal(response.pagination?.total || 0);
          setTotalPages(response.pagination?.totalPages || 0);
          setError(null);
        }
      })
      .catch((err) => {
        if (
          err &&
          err.response &&
          err.response.data &&
          err.response.data.message === "Nenhuma requisição encontrada."
        ) {
          setRows([]);
          setTotal(0);
          setTotalPages(0);
          setError(null);
        } else if (
          err &&
          err.response &&
          err.response.data &&
          err.response.data.message
        ) {
          setError(err.response.data.message);
        } else {
          setError("Erro ao carregar as requisições.");
        }
      })
      .finally(() => setLoading(false));
  }, [authChecked, moduloSelecionado, page, pageSize, filtros]);

  // Verificar autenticação e permissão master
  useEffect(() => {
    if (authLoading) return;
    if (user !== undefined) {
      if (user && user.master !== 1) {
        router.replace("/menu");
      } else if (user) {
        setAuthChecked(true);
      } else if (user === null) {
        router.replace("/login");
      }
    }
  }, [user, authLoading, router]);

  // Buscar requisições quando módulo ou filtros mudarem
  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const handleModuloChange = useCallback((modulo: Modulo) => {
    setModuloSelecionado(modulo);
    setPage(1);
    setFiltros({});
  }, []);

  const handleCarrosselNext = useCallback(() => {
    const currentIndex = modulos.findIndex((m) => m.id === moduloSelecionado);
    if (currentIndex < modulos.length - 1) {
      setModuloSelecionado(modulos[currentIndex + 1].id);
      setPage(1);
      setFiltros({});
    }
  }, [moduloSelecionado]);

  const handleCarrosselPrev = useCallback(() => {
    const currentIndex = modulos.findIndex((m) => m.id === moduloSelecionado);
    if (currentIndex > 0) {
      setModuloSelecionado(modulos[currentIndex - 1].id);
      setPage(1);
      setFiltros({});
    }
  }, [moduloSelecionado]);

  if (authLoading || !authChecked) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const moduloAtual = modulos.find((m) => m.id === moduloSelecionado);
  const currentIndex = modulos.findIndex((m) => m.id === moduloSelecionado);

  return (
    <div
      className="flex flex-col bg-gray-50"
      style={{ height: "calc(100vh - 80px)", overflow: "hidden" }}
    >
      <div className="flex-1 overflow-hidden p-2 sm:p-4 md:p-6 lg:p-8 flex justify-center">
        <div
          className="w-full max-w-[100vw] sm:max-w-[95vw] xl:max-w-[1600px] flex flex-col"
          style={{ height: "100%" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black">
              Master Dashboard
            </h1>
            <Chip
              label="MASTER"
              sx={{
                bgcolor: "#ffd700",
                color: "#001e50",
                fontWeight: 700,
                fontSize: { xs: "0.75rem", sm: "0.9rem" },
              }}
            />
          </div>

          {/* Carrossel Horizontal (Mobile) */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1,
              mb: 2,
              width: "100%",
              overflow: "hidden",
            }}
          >
            <IconButton
              onClick={handleCarrosselPrev}
              disabled={currentIndex === 0}
              size="small"
              sx={{
                width: "36px",
                height: "36px",
                bgcolor: "white",
                border: `2px solid ${
                  currentIndex === 0 ? "#e0e0e0" : moduloAtual?.color
                }`,
                color: currentIndex === 0 ? "#e0e0e0" : moduloAtual?.color,
                flexShrink: 0,
                "&.Mui-disabled": {
                  bgcolor: "white",
                  border: "2px solid #e0e0e0",
                },
              }}
            >
              <KeyboardArrowUpIcon
                fontSize="small"
                sx={{ transform: "rotate(-90deg)" }}
              />
            </IconButton>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                flex: 1,
                overflowX: "auto",
                overflowY: "hidden",
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              {modulos.map((modulo) => {
                const isSelected = modulo.id === moduloSelecionado;
                const IconComponent = modulo.icon;

                return (
                  <Paper
                    key={modulo.id}
                    onClick={() => handleModuloChange(modulo.id)}
                    elevation={isSelected ? 3 : 1}
                    sx={{
                      p: 1,
                      cursor: "pointer",
                      textAlign: "center",
                      minWidth: "80px",
                      transition: "all 0.25s ease",
                      border: isSelected
                        ? `2px solid ${modulo.color}`
                        : "2px solid transparent",
                      bgcolor: isSelected ? "#f8f9fa" : "white",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 0.5,
                      }}
                    >
                      {IconComponent && (
                        <IconComponent
                          sx={{
                            fontSize: "24px",
                            color: modulo.color,
                          }}
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: "0.65rem",
                        color: "#001e50",
                        lineHeight: 1.1,
                      }}
                    >
                      {modulo.nome}
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            <IconButton
              onClick={handleCarrosselNext}
              disabled={currentIndex === modulos.length - 1}
              size="small"
              sx={{
                width: "36px",
                height: "36px",
                bgcolor: "white",
                border: `2px solid ${
                  currentIndex === modulos.length - 1
                    ? "#e0e0e0"
                    : moduloAtual?.color
                }`,
                color:
                  currentIndex === modulos.length - 1
                    ? "#e0e0e0"
                    : moduloAtual?.color,
                flexShrink: 0,
                "&.Mui-disabled": {
                  bgcolor: "white",
                  border: "2px solid #e0e0e0",
                },
              }}
            >
              <KeyboardArrowDownIcon
                fontSize="small"
                sx={{ transform: "rotate(-90deg)" }}
              />
            </IconButton>
          </Box>

          {/* Layout: Carrossel Vertical (Desktop) + Filtros/Tabela */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: 2, md: 3 },
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Carrossel de Módulos Vertical (Desktop Only) */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1,
                minWidth: "160px",
                maxWidth: "160px",
                height: "fit-content",
                maxHeight: "100%",
                overflow: "auto",
              }}
            >
              {/* Seta Superior */}
              <IconButton
                onClick={handleCarrosselPrev}
                disabled={currentIndex === 0}
                size="small"
                sx={{
                  width: "40px",
                  height: "40px",
                  bgcolor: "white",
                  border: `2px solid ${
                    currentIndex === 0 ? "#e0e0e0" : moduloAtual?.color
                  }`,
                  color: currentIndex === 0 ? "#e0e0e0" : moduloAtual?.color,
                  "&:hover": {
                    bgcolor:
                      currentIndex === 0 ? "white" : `${moduloAtual?.color}10`,
                  },
                  "&.Mui-disabled": {
                    bgcolor: "white",
                    border: "2px solid #e0e0e0",
                  },
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <KeyboardArrowUpIcon fontSize="small" />
              </IconButton>

              {/* Container dos Módulos - Layout Compacto */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  width: "100%",
                }}
              >
                {modulos.map((modulo) => {
                  const isSelected = modulo.id === moduloSelecionado;
                  const IconComponent = modulo.icon;

                  return (
                    <Paper
                      key={modulo.id}
                      onClick={() => handleModuloChange(modulo.id)}
                      elevation={isSelected ? 3 : 1}
                      sx={{
                        p: 1.5,
                        cursor: "pointer",
                        textAlign: "center",
                        width: "100%",
                        transition: "all 0.25s ease",
                        border: isSelected
                          ? `2px solid ${modulo.color}`
                          : "2px solid transparent",
                        bgcolor: isSelected ? "#f8f9fa" : "white",
                        "&:hover": {
                          transform: "scale(1.03)",
                          boxShadow: 3,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          mb: 0.5,
                        }}
                      >
                        {IconComponent && (
                          <IconComponent
                            sx={{
                              fontSize: isSelected ? "32px" : "28px",
                              color: modulo.color,
                              transition: "font-size 0.25s",
                            }}
                          />
                        )}
                      </Box>
                      <Box
                        sx={{
                          fontWeight: isSelected ? 700 : 600,
                          fontSize: isSelected ? "0.8rem" : "0.7rem",
                          color: "#001e50",
                          lineHeight: 1.2,
                          transition: "all 0.25s",
                        }}
                      >
                        {modulo.nome}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              {/* Seta Inferior */}
              <IconButton
                onClick={handleCarrosselNext}
                disabled={currentIndex === modulos.length - 1}
                size="small"
                sx={{
                  width: "40px",
                  height: "40px",
                  bgcolor: "white",
                  border: `2px solid ${
                    currentIndex === modulos.length - 1
                      ? "#e0e0e0"
                      : moduloAtual?.color
                  }`,
                  color:
                    currentIndex === modulos.length - 1
                      ? "#e0e0e0"
                      : moduloAtual?.color,
                  "&:hover": {
                    bgcolor:
                      currentIndex === modulos.length - 1
                        ? "white"
                        : `${moduloAtual?.color}10`,
                  },
                  "&.Mui-disabled": {
                    bgcolor: "white",
                    border: "2px solid #e0e0e0",
                  },
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <KeyboardArrowDownIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Área de Filtros e Tabela */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                width: { xs: "100%", md: "auto" },
                overflow: "hidden",
              }}
            >
              {/* Filtros */}
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  mb: { xs: 0.25, md: 0.5 },
                  flexWrap: "wrap",
                }}
              >
                <TextField
                  label="Buscar"
                  variant="outlined"
                  size="small"
                  value={filtros.search || ""}
                  onChange={(e) =>
                    setFiltros({ ...filtros, search: e.target.value })
                  }
                  sx={{
                    minWidth: { xs: "100%", sm: "200px", md: "250px" },
                    flex: { xs: "1 1 100%", sm: "1 1 auto" },
                  }}
                />
                <TextField
                  select
                  label="Status"
                  variant="outlined"
                  size="small"
                  value={filtros.status || ""}
                  onChange={(e) =>
                    setFiltros({ ...filtros, status: e.target.value })
                  }
                  sx={{
                    minWidth: {
                      xs: "calc(50% - 4px)",
                      sm: "130px",
                      md: "150px",
                    },
                    flex: { xs: "1 1 auto", sm: "0 0 auto" },
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Pendente">Pendente</MenuItem>
                  <MenuItem value="Aprovada">Aprovada</MenuItem>
                  <MenuItem value="Reprovada">Reprovada</MenuItem>
                  {moduloSelecionado === "combustivel-frota" && (
                    <MenuItem value="Aguardando Cupom">
                      Aguardando Cupom
                    </MenuItem>
                  )}
                  {moduloSelecionado === "combustivel-frota" && (
                    <MenuItem value="Finalizado">Finalizado</MenuItem>
                  )}
                </TextField>
                <TextField
                  label="Data"
                  type="date"
                  variant="outlined"
                  size="small"
                  value={filtros.dataInicio || ""}
                  onChange={(e) =>
                    setFiltros({ ...filtros, dataInicio: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    minWidth: {
                      xs: "calc(50% - 4px)",
                      sm: "150px",
                      md: "180px",
                    },
                    flex: { xs: "1 1 auto", sm: "0 0 auto" },
                  }}
                />
              </Box>

              {/* Tabela */}
              <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <Table
                  data={rows}
                  columns={[
                    {
                      key: "id",
                      label: "Nº REQ",
                      minWidth: 80,
                      render: (row) => row.id ?? "-",
                      searchValue: (row) => (row.id ?? "").toString(),
                    },
                    {
                      key: "descricao",
                      label: "DESCRIÇÃO",
                      minWidth: 140,
                      searchValue: (row) => row.descricao ?? "",
                    },
                    {
                      key: "solicitante",
                      label: "SOLICITANTE",
                      minWidth: 120,
                      render: (row) =>
                        row.solicitante || row.nome_solicitante || "-",
                      searchValue: (row) =>
                        row.solicitante ?? row.nome_solicitante ?? "",
                    },
                    {
                      key: "data_solicitacao",
                      label: "DATA",
                      minWidth: 100,
                      render: (row) =>
                        row.data_requisicao
                          ? new Date(row.data_requisicao).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )
                          : row.data_solicitacao
                          ? new Date(row.data_solicitacao).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )
                          : "-",
                      searchValue: (row) =>
                        row.data_requisicao ?? row.data_solicitacao ?? "",
                    },
                    {
                      key: "status",
                      label: "STATUS",
                      minWidth: 100,
                      render: (row) => (
                        <StatusBadge
                          status={row.status_display ?? row.status ?? "-"}
                        />
                      ),
                      searchValue: (row) =>
                        row.status_display ?? row.status ?? "",
                    },
                    {
                      key: "impresso",
                      label: "IMPRESSO",
                      minWidth: 80,
                      render: (row) => (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          {row.impresso === 1 ? (
                            <CheckIcon fontSize="small" color="success" />
                          ) : (
                            <CloseIcon fontSize="small" color="error" />
                          )}
                        </Box>
                      ),
                      searchValue: (row) =>
                        row.impresso === 1 ? "Sim" : "Não",
                    },
                  ]}
                  loading={loading}
                  error={error}
                  serverSidePagination
                  currentPage={page}
                  rowsPerPage={pageSize}
                  totalPages={totalPages}
                  totalRecords={total}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  onRowClick={(row) => {
                    const params = new URLSearchParams(window.location.search);
                    params.set("modal", "detalhes");
                    params.set("id", row.id.toString());
                    params.set("source", "master");
                    router.push(`?${params.toString()}`, { scroll: false });
                  }}
                />
              </Box>
            </Box>
          </Box>
        </div>
      </div>

      {/* Modais de Detalhes por Módulo */}
      {moduloSelecionado === "despesas" && (
        <ModalDetalhesDespesas
          masterMode={true}
          onAprovarMaster={async (id) => {
            await masterService.aprovarRequisicao("despesas", id);
            reloadData();
          }}
          onRecusarMaster={async (id) => {
            await masterService.recusarRequisicao("despesas", id);
            reloadData();
          }}
          onClose={reloadData}
        />
      )}

      {moduloSelecionado === "combustivel-frota" && (
        <ModalDetalhesFrota
          masterMode={true}
          onAprovarMaster={async (id) => {
            await masterService.aprovarRequisicao("combustivel-frota", id);
            reloadData();
          }}
          onRecusarMaster={async (id) => {
            await masterService.recusarRequisicao("combustivel-frota", id);
            reloadData();
          }}
          onClose={reloadData}
        />
      )}

      {moduloSelecionado === "combustivel-estoque" && (
        <ModalDetalhesCombustivelEstoque
          masterMode={true}
          onAprovarMaster={async (id) => {
            await masterService.aprovarRequisicao("combustivel-estoque", id);
            reloadData();
          }}
          onRecusarMaster={async (id) => {
            await masterService.recusarRequisicao("combustivel-estoque", id);
            reloadData();
          }}
          onClose={reloadData}
        />
      )}

      {moduloSelecionado === "estoque" && (
        <ModalDetalhesEstoque
          masterMode={true}
          onAprovarMaster={async (id) => {
            await masterService.aprovarRequisicao("estoque", id);
            reloadData();
          }}
          onRecusarMaster={async (id) => {
            await masterService.recusarRequisicao("estoque", id);
            reloadData();
          }}
          onClose={reloadData}
        />
      )}

      {moduloSelecionado === "cliente" && (
        <ModalDetalhesClientes
          masterMode={true}
          onAprovarMaster={async (id) => {
            await masterService.aprovarRequisicao("cliente", id);
            reloadData();
          }}
          onRecusarMaster={async (id) => {
            await masterService.recusarRequisicao("cliente", id);
            reloadData();
          }}
          onClose={reloadData}
        />
      )}
    </div>
  );
}
