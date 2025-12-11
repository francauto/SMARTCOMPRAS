"use client";
import { useState, useEffect, useCallback } from "react";
import Table, { TableColumn } from "@/components/table";
import { FrotaRequisicao } from "@/types/frota";
import { frotaService, FrotaFiltros } from "@/services/frotaService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import StatusBadge from "@/components/StatusBadge";
import ModalDetalhesFrota from "../modal/ModalDetalhesFrota";
import ModalNovaSolicitacaoFrota from "../modal/ModalNovaSolicitacaoFrota";
import ModalAnexarCupom from "../modal/ModalAnexarCupom";

export default function SolicitacoesFrotaPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<FrotaRequisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalNovaOpen, setModalNovaOpen] = useState(false);
  const [modalCupomOpen, setModalCupomOpen] = useState(false);
  const [idRequisicaoSelecionada, setIdRequisicaoSelecionada] = useState<
    number | null
  >(null);

  // Estados de paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estados de filtros
  const [filtros, setFiltros] = useState<FrotaFiltros>({});
  const [filtrosDebounced, setFiltrosDebounced] = useState<FrotaFiltros>({});

  // Debounce dos filtros - aguarda 500ms após parar de digitar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFiltrosDebounced(filtros);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filtros]);

  // Função para recarregar dados
  const reloadData = useCallback(() => {
    if (!user || authLoading) return;
    setLoading(true);
    frotaService
      .listarPorSolicitante(user.id, page, pageSize, filtrosDebounced)
      .then((resultado) => {
        setData(resultado.data);
        setTotal(resultado.total);
        setTotalPages(resultado.totalPages);
        setError(null);
      })
      .catch(() => {
        setError("Erro ao carregar suas solicitações de frota.");
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, page, pageSize, filtrosDebounced]);

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
  }, [reloadData]);

  // Definição das colunas
  const columns: TableColumn<FrotaRequisicao>[] = [
    {
      key: "id",
      label: "Nº REQUISIÇÃO",
      minWidth: 120,
      align: "center",
    },
    {
      key: "veiculo_placa",
      label: "PLACA",
      minWidth: 100,
      render: (row) => (
        <span className="font-semibold">{row.veiculo_placa}</span>
      ),
    },
    {
      key: "veiculo_nome",
      label: "VEÍCULO",
      minWidth: 150,
    },
    {
      key: "solicitante_nome",
      label: "SOLICITANTE",
      minWidth: 150,
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
      render: (row) => {
        // Se está pendente e ainda não foi respondido pelo controlador de chaves
        if (row.status === "Pendente" && !Boolean(row.respondido_bestdrive)) {
          return <StatusBadge status="Aguardando controlador de chaves" />;
        }
        return <StatusBadge status={row.status} />;
      },
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
              Suas Solicitações de Combustível - Frota
            </h1>
            <button
              style={{ backgroundColor: "#001e50" }}
              className="hover:bg-[#003080] text-white font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
              onClick={() => setModalNovaOpen(true)}
            >
              NOVA SOLICITAÇÃO
            </button>
          </div>

          {/* Tabela Reutilizável */}
          <Table
            data={data}
            columns={columns}
            loading={loading}
            error={error}
            rowsPerPage={pageSize}
            emptyMessage="Nenhuma solicitação de frota encontrada."
            enableModalRoute={true}
            modalParam="modal"
            modalValue="detalhes"
            idParam="id"
            getRowId={(row) => row.id}
            enableRowHover={true}
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
            // Filtros customizados
            enableSearchFilter={true}
            searchFilter={filtros.search || ""}
            onSearchFilterChange={(search) => {
              setFiltros({ ...filtros, search });
              setPage(1);
            }}
            searchPlaceholder="Placa, modelo, solicitante ou ID..."
            enableStatusFilter={true}
            statusFilter={filtros.status || ""}
            onStatusFilterChange={(status) => {
              setFiltros({ ...filtros, status });
              setPage(1);
            }}
            statusOptions={[
              "Pendente",
              "Aprovado",
              "Reprovado",
              "Aguardando Cupom",
              "Finalizado",
            ]}
            customFilters={
              <Box sx={{ display: "flex", gap: 2 }}>
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

      {/* Modal de Detalhes (controlado por URL) */}
      <ModalDetalhesFrota
        onAprovar={async (id) => {
          try {
            await frotaService.aprovarOuRecusar(id, true);
            reloadData();
          } catch (error) {
            console.error("Erro ao aprovar:", error);
          }
        }}
        onRecusar={async (id) => {
          try {
            await frotaService.aprovarOuRecusar(id, false);
            reloadData();
          } catch (error) {
            console.error("Erro ao recusar:", error);
          }
        }}
        onClose={() => {
          // Atualiza a tabela ao fechar o modal
          reloadData();
        }}
      />

      {/* Modal de Nova Solicitação */}
      <ModalNovaSolicitacaoFrota
        open={modalNovaOpen}
        onClose={() => setModalNovaOpen(false)}
        onSuccess={() => {
          setModalNovaOpen(false);
          reloadData();
        }}
      />

      {/* Modal de Anexar Cupom */}
      {idRequisicaoSelecionada && (
        <ModalAnexarCupom
          open={modalCupomOpen}
          onClose={() => {
            setModalCupomOpen(false);
            setIdRequisicaoSelecionada(null);
          }}
          idRequisicao={idRequisicaoSelecionada}
          onSuccess={() => {
            reloadData();
          }}
        />
      )}
    </div>
  );
}
