"use client";
import { useState, useEffect } from "react";
import Table, { TableColumn } from "@/components/table";
import { CombustivelEstoqueRequisicao } from "@/types/combustivel-estoque";
import { combustivelEstoqueService } from "@/services/combustivelEstoqueService";
import { CombustivelEstoqueFiltros } from "@/types/combustivel-estoque";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import StatusBadge from "@/components/StatusBadge";
import ModalDetalhesCombustivelEstoque from "../modal/ModalDetalhesCombustivelEstoque";

export default function AnaliseCombustivelEstoquePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<CombustivelEstoqueRequisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estados de filtros
  const [filtros, setFiltros] = useState<CombustivelEstoqueFiltros>({});

  // Função para recarregar dados
  const reloadData = () => {
    if (!user || authLoading) return;
    setLoading(true);
    combustivelEstoqueService
      .listarPorAprovador(page, pageSize, filtros)
      .then((resultado) => {
        setData(resultado.data);
        setTotal(resultado.total);
        setTotalPages(resultado.totalPages);
        setError(null);
      })
      .catch(() => {
        setError("Erro ao carregar requisições para análise.");
      })
      .finally(() => setLoading(false));
  };

  // Verificação de autenticação
  useEffect(() => {
    if (authLoading) return;
    if (!user && !authLoading) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Carregar dados
  useEffect(() => {
    reloadData();
  }, [user, authLoading, page, pageSize, filtros]);

  // Definição das colunas
  const columns: TableColumn<CombustivelEstoqueRequisicao>[] = [
    {
      key: "id",
      label: "Nº REQUISIÇÃO",
      minWidth: 120,
      align: "center",
    },
    {
      key: "placa_chassi",
      label: "PLACA / CHASSI",
      minWidth: 150,
      render: (row) => (
        <span className="font-semibold">{row.placa || row.chassi || "-"}</span>
      ),
    },
    {
      key: "modelo",
      label: "MODELO",
      minWidth: 150,
      render: (row) => `${row.marca} ${row.modelo}`,
    },
    {
      key: "nome_solicitante",
      label: "SOLICITANTE",
      minWidth: 150,
      render: (row) => row.nome_solicitante || "-",
    },
    {
      key: "data_solicitacao",
      label: "DATA SOLICITAÇÃO",
      minWidth: 140,
      render: (row) =>
        row.data_solicitacao
          ? new Date(row.data_solicitacao).toLocaleDateString("pt-BR")
          : "",
    },
    {
      key: "data_aprovacao",
      label: "DATA RESPOSTA",
      minWidth: 140,
      render: (row) =>
        row.data_aprovacao
          ? new Date(row.data_aprovacao).toLocaleDateString("pt-BR")
          : "-",
    },
    {
      key: "status",
      label: "STATUS",
      minWidth: 140,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "impresso",
      label: "IMPRESSO",
      minWidth: 100,
      align: "center",
      render: (row) => (
        <StatusBadge
          status={row.impresso === 1 ? "Impresso" : "Não Impresso"}
          size="small"
        />
      ),
      searchValue: (row) => (row.impresso === 1 ? "impresso" : "não impresso"),
    },
  ];

  // Loading de autenticação
  if (authLoading) {
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

  if (!user) {
    return null;
  }

  return (
    <div
      className="flex flex-col bg-gray-50"
      style={{ height: "calc(100vh - 80px)" }}
    >
      <div className="flex-1 overflow-hidden p-4 sm:p-6 md:p-8 flex justify-center">
        <div className="w-full max-w-[95vw] xl:max-w-[1600px] flex flex-col min-h-0">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-black">
              Análise de Requisições - Combustível Estoque
            </h1>
          </div>

          {/* Tabela Reutilizável */}
          <Table
            data={data}
            columns={columns}
            loading={loading}
            error={error}
            rowsPerPage={pageSize}
            emptyMessage="Nenhuma requisição de combustível estoque para análise."
            getRowId={(row) => row.id}
            enableRowHover={true}
            onRowClick={(row) => {
              router.push(
                `/combustivel-estoque/analise?modal=detalhes&id=${row.id}`,
                { scroll: false }
              );
            }}
            // Paginação server-side
            serverSidePagination={true}
            currentPage={page}
            totalRecords={total}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            // Filtros integrados
            enableStatusFilter={true}
            statusFilter={filtros.status || ""}
            onStatusFilterChange={(status) => {
              setFiltros({ ...filtros, status });
              setPage(1);
            }}
            statusOptions={["Pendente", "Aprovado", "Reprovado"]}
            // Filtro customizado para busca e data
            customFilters={
              <>
                <TextField
                  label="Buscar"
                  variant="outlined"
                  size="small"
                  value={filtros.search || ""}
                  onChange={(e) => {
                    setFiltros({ ...filtros, search: e.target.value });
                    setPage(1);
                  }}
                  placeholder="Placa, chassi ou modelo..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 250 }}
                />
                <TextField
                  label="Data Solicitação"
                  variant="outlined"
                  size="small"
                  type="date"
                  value={filtros.dataInicio || ""}
                  onChange={(e) => {
                    setFiltros({ ...filtros, dataInicio: e.target.value });
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 180 }}
                />
              </>
            }
          />
        </div>
      </div>

      {/* Modal de Detalhes */}
      <ModalDetalhesCombustivelEstoque
        onAprovar={async (id) => {
          try {
            await combustivelEstoqueService.aprovar(id);
          } catch (error) {
            console.error("Erro ao aprovar:", error);
          }
        }}
        onReprovar={async (id) => {
          try {
            await combustivelEstoqueService.reprovar(id);
          } catch (error) {
            console.error("Erro ao reprovar:", error);
          }
        }}
        onImprimir={(id) => {
          // TODO: Implementar lógica de impressão
          console.log("Imprimir requisição:", id);
        }}
        onClose={() => {
          reloadData();
        }}
      />
    </div>
  );
}
