"use client";
import { useState, useEffect } from "react";
import Table from "@/components/table";
import StatusBadge from "@/components/StatusBadge";
import { despesasService, DespesasFiltros } from "@/services/despesasService";
import { DespesaRequisicao } from "@/types/despesas";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import ModalNovaSolicitacaoDespesas from "../modal/ModalNovaSolicitacaoDespesas";
import ModalDetalhesDespesas from "../modal/ModalDetalhesDespesas";
import Box from "@mui/material/Box";

export default function SolicitacoesDespesasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [modalNovaOpen, setModalNovaOpen] = useState(false);
  const [rows, setRows] = useState<DespesaRequisicao[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DespesaRequisicao | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [filtros, setFiltros] = useState<DespesasFiltros>({});

  useEffect(() => {
    if (!user && !loading) {
      if (typeof window !== "undefined") {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      setLoadingData(true);
      despesasService
        .listar(page, pageSize, filtros)
        .then((response) => {
          setRows(response.data || []);
          setTotal(response.total || 0);
          setTotalPages(response.totalPages || 0);
          setError(null);
        })
        .catch(() => {
          setError("Erro ao carregar dados da página.");
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [loading, user, page, pageSize, filtros]);

  if (loading) {
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-black">
              Suas Solicitações de Despesas
            </h1>
            <button
              style={{ backgroundColor: "#001e50" }}
              className="hover:bg-[#003080] text-white font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
              onClick={() => setModalNovaOpen(true)}
            >
              NOVA SOLICITAÇÃO
            </button>
          </div>
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
                key: "solicitante",
                label: "SOLICITANTE",
                minWidth: 120,
                render: (row) => row.solicitante || row.nome_solicitante || "-",
                searchValue: (row) =>
                  row.solicitante ?? row.nome_solicitante ?? "",
              },
              {
                key: "data_solicitacao",
                label: "DATA SOLICITAÇÃO",
                minWidth: 120,
                render: (row) =>
                  row.data_requisicao
                    ? new Date(row.data_requisicao).toLocaleDateString()
                    : row.data_solicitacao
                    ? new Date(row.data_solicitacao).toLocaleDateString()
                    : "-",
                searchValue: (row) =>
                  row.data_requisicao ?? row.data_solicitacao ?? "",
              },
              {
                key: "data_aprovacao",
                label: "DATA DE RESPOSTA",
                minWidth: 120,
                render: (row) =>
                  row.data_resposta
                    ? new Date(row.data_resposta).toLocaleDateString()
                    : row.data_aprovacao
                    ? new Date(row.data_aprovacao).toLocaleDateString()
                    : "-",
                searchValue: (row) =>
                  row.data_resposta ?? row.data_aprovacao ?? "",
              },
              // =================== ALTERAÇÃO APLICADA AQUI ===================
              {
                key: "status",
                label: "STATUS",
                minWidth: 100,
                searchValue: (row) => row.status ?? "",
                render: (row) => <StatusBadge status={row.status} />,
              },
              // ===============================================================
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
            loading={loadingData}
            error={error}
            rowsPerPage={pageSize}
            emptyMessage="Nenhuma solicitação encontrada."
            enableRowHover={true}
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
              params.set("modal", "detalhes");
              params.set("id", String(row.id));
              window.history.pushState({}, "", `?${params.toString()}`);
            }}
          />
        </div>
      </div>
      <ModalNovaSolicitacaoDespesas
        open={modalNovaOpen}
        onClose={() => setModalNovaOpen(false)}
        onSuccess={() => {
          setModalNovaOpen(false);
          setLoadingData(true);
          despesasService
            .listar(page, pageSize, filtros)
            .then((response) => {
              setRows(response.data || []);
              setTotal(response.total || 0);
              setTotalPages(response.totalPages || 0);
              setError(null);
            })
            .catch(() => {
              setError("Erro ao carregar dados da página.");
            })
            .finally(() => {
              setLoadingData(false);
            });
        }}
      />
      <ModalDetalhesDespesas
        onClose={() => {
          const params = new URLSearchParams(window.location.search);
          params.delete("modal");
          params.delete("id");
          window.history.pushState({}, "", `?${params.toString()}`);
          setLoadingData(true);
          despesasService
            .listar(page, pageSize, filtros)
            .then((response) => {
              setRows(response.data || []);
              setTotal(response.total || 0);
              setTotalPages(response.totalPages || 0);
              setError(null);
            })
            .catch(() => {
              setError("Erro ao carregar dados da página.");
            })
            .finally(() => {
              setLoadingData(false);
            });
        }}
      />
    </div>
  );
}
