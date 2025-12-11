"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Table from "@/components/table";
import StatusBadge from "@/components/StatusBadge";
import { estoqueService, EstoqueFiltros } from "@/services/estoqueService";
import { EstoqueRequisicao } from "@/types/estoque";
import ModalNovaSolicitacaoEstoque from "../modal/ModalNovaSolicitacaoEstoque";
import ModalDetalhesEstoque from "../modal/ModalDetalhesEstoque";
import { Aprovador } from "@/types/estoque";

export default function SolicitacoesEstoquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [modalNovaOpen, setModalNovaOpen] = useState(false);
  const [rows, setRows] = useState<EstoqueRequisicao[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<EstoqueRequisicao | null>(
    null
  );
  const [aprovadores, setAprovadores] = useState<Aprovador[]>([]);

  // Paginação e filtros
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filtros, setFiltros] = useState<EstoqueFiltros>({});

  const fetchSolicitacoes = () => {
    if (!user || loading) return;
    setLoadingData(true);
    estoqueService
      .listar(page, pageSize, filtros)
      .then((resultado) => {
        setRows(resultado.data);
        setTotal(resultado.total);
        setTotalPages(resultado.totalPages);
        setError(null);
      })
      .catch(() => {
        setError("Erro ao carregar dados da página.");
      })
      .finally(() => {
        setLoadingData(false);
      });
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    fetchSolicitacoes();
  }, [user, loading, page, pageSize, filtros]);

  if (loading || !user) {
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-black">
              Suas Solicitações de Estoque
            </h1>
            <button
              style={{ backgroundColor: "#001e50" }}
              className="hover:bg-[#003080] text-white font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
              onClick={() => setModalNovaOpen(true)}
            >
              NOVA SOLICITAÇÃO
            </button>
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
                key: "data_requisicao",
                label: "DATA SOLICITAÇÃO",
                minWidth: 120,
                render: (row) =>
                  row.data_requisicao
                    ? new Date(row.data_requisicao).toLocaleDateString()
                    : "-",
                searchValue: (row) => row.data_requisicao ?? "",
              },
              {
                key: "data_aprovacao",
                label: "DATA DE RESPOSTA",
                minWidth: 120,
                render: (row) =>
                  row.data_aprovacao
                    ? new Date(row.data_aprovacao).toLocaleDateString()
                    : "-",
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
            loading={loadingData}
            error={error}
            rowsPerPage={pageSize}
            emptyMessage="Nenhuma solicitação encontrada."
            enableRowHover={true}
            enableModalRoute={true}
            modalParam="modal"
            modalValue="detalhes"
            idParam="id"
            getRowId={(row) => row.id}
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
          />
        </div>
      </div>
      <ModalNovaSolicitacaoEstoque
        open={modalNovaOpen}
        onClose={() => setModalNovaOpen(false)}
        onSubmit={() => {
          setModalNovaOpen(false);
          fetchSolicitacoes();
        }}
      />
      <ModalDetalhesEstoque
        onStatusChange={fetchSolicitacoes}
        onClose={() => {
          // Fecha o modal removendo os params da URL
          const params = new URLSearchParams(window.location.search);
          params.delete("modal");
          params.delete("id");
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}?${params.toString()}`
          );
          // Atualiza a tabela ao fechar o modal
          fetchSolicitacoes();
        }}
        showPrintButton={true}
      />
    </div>
  );
}
