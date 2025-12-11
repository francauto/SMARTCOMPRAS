"use client";
import { useState, useEffect } from "react";
import ModalDescricaoClientes from "../modal/ModalDetalhesClientes";
import { CircularProgress, Box } from "@mui/material";
import Table from "@/components/table";
import StatusBadge from "@/components/StatusBadge";
import { clientesService, ClientesFiltros } from "@/services/clientesService";
import { ClienteRequisicao } from "@/types/clientes";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AprovacoesClientesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<ClienteRequisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ClienteRequisicao | null>(
    null
  );
  const [authChecked, setAuthChecked] = useState(false);
  const [modalAprovacaoOpen, setModalAprovacaoOpen] = useState(false);

  // Paginação e filtros
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filtros, setFiltros] = useState<ClientesFiltros>({});

  const allowedRoles = ["admger", "ger", "admdir", "dir"];

  useEffect(() => {
    if (authLoading) return;
    if (user !== undefined) {
      if (user && !allowedRoles.includes(user.cargo)) {
        router.replace("/menu");
      } else if (user) {
        setAuthChecked(true);
      } else if (user === null) {
        router.replace("/login");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authChecked) return;

    setLoading(true);
    clientesService
      .listarAprovador(page, pageSize, filtros)
      .then((resultado) => {
        setRows(resultado.data);
        setTotal(resultado.total);
        setTotalPages(resultado.totalPages);
        setError(null);
      })
      .catch(() => {
        setError("Erro ao carregar as aprovações.");
      })
      .finally(() => setLoading(false));
  }, [authChecked, page, pageSize, filtros]);

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
              Suas aprovações de Clientes
            </h1>
          </div>
          {/* Tabela reutilizável */}
          <Table
            data={rows}
            columns={[
              {
                key: "id",
                label: "Nº REQUISIÇÃO",
                minWidth: 90,
                searchValue: (row) => row.id?.toString() ?? "",
              },
              {
                key: "descricao",
                label: "DESCRIÇÃO",
                minWidth: 140,
                searchValue: (row) => row.descricao ?? "",
              },
              {
                key: "nome_solicitante",
                label: "SOLICITANTE",
                minWidth: 120,
                searchValue: (row) => row.nome_solicitante ?? "",
              },
              {
                key: "data_solicitacao",
                label: "DATA SOLICITAÇÃO",
                minWidth: 120,
                render: (row) =>
                  row.data_solicitacao
                    ? new Date(row.data_solicitacao).toLocaleDateString()
                    : "",
                searchValue: (row) => row.data_solicitacao ?? "",
              },
              {
                key: "data_aprovacao",
                label: "DATA DE RESPOSTA",
                minWidth: 120,
                render: (row) =>
                  row.data_aprovacao
                    ? new Date(row.data_aprovacao).toLocaleDateString()
                    : "",
                searchValue: (row) => row.data_aprovacao ?? "",
              },
              {
                key: "status",
                label: "STATUS",
                minWidth: 100,
                searchValue: (row) => row.status ?? "",
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: "impresso",
                label: "IMPRESSO",
                minWidth: 90,
                render: (row) => (
                  <StatusBadge
                    status={row.impresso === 1 ? "Impresso" : "Não Impresso"}
                    size="small"
                  />
                ),
                searchValue: (row) =>
                  row.impresso === 1 ? "impresso" : "não impresso",
              },
            ]}
            loading={loading}
            error={error}
            rowsPerPage={pageSize}
            emptyMessage="Nenhuma aprovação encontrada."
            serverSidePagination={true}
            currentPage={page}
            totalRecords={total}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            enableStatusFilter={true}
            statusFilter={filtros.status || ""}
            onStatusFilterChange={(status) => {
              setFiltros({ ...filtros, status });
              setPage(1);
            }}
            customFilters={
              <Box sx={{ display: "flex", gap: 2 }}>
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={filtros.search || ""}
                  onChange={(e) => {
                    setFiltros({ ...filtros, search: e.target.value });
                    setPage(1);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    minWidth: "200px",
                  }}
                />
                <input
                  type="date"
                  value={filtros.dataInicio || ""}
                  onChange={(e) => {
                    setFiltros({ ...filtros, dataInicio: e.target.value });
                    setPage(1);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    color: "#000",
                    fontWeight: "500",
                  }}
                />
              </Box>
            }
            onRowClick={(row) => {
              const params = new URLSearchParams(window.location.search);
              params.set(
                "modal",
                row.status === "Pendente" ? "aprovar" : "detalhes"
              );
              params.set("id", String(row.id));
              window.history.pushState({}, "", `?${params.toString()}`);
            }}
          />
        </div>
      </div>
      <ModalDescricaoClientes
        onClose={() => {
          // Remove os params da URL ao fechar
          const params = new URLSearchParams(window.location.search);
          params.delete("modal");
          params.delete("id");
          window.history.pushState({}, "", `?${params.toString()}`);
          // Refresh table ao fechar
          setLoading(true);
          clientesService
            .listarAprovador(page, pageSize, filtros)
            .then((response) => {
              setRows(response.data || []);
              setTotal(response.total || 0);
              setTotalPages(response.totalPages || 0);
              setError(null);
            })
            .catch(() => {
              setError("Erro ao carregar as aprovações.");
            })
            .finally(() => setLoading(false));
        }}
        onStatusChange={() => {
          setLoading(true);
          clientesService
            .listarAprovador(page, pageSize, filtros)
            .then((response) => {
              setRows(response.data || []);
              setTotal(response.total || 0);
              setTotalPages(response.totalPages || 0);
              setError(null);
            })
            .catch(() => {
              setError("Erro ao carregar as aprovações.");
            })
            .finally(() => setLoading(false));
        }}
      />
    </div>
  );
}
