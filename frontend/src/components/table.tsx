"use client";
import { useState, useMemo } from "react";
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useRouter } from "next/navigation";

export interface TableColumn<T = any> {
  /** Identificador único da coluna */
  key: string;
  /** Label que aparece no header */
  label: string;
  /** Largura mínima da coluna (opcional) */
  minWidth?: number;
  /** Função para renderizar o conteúdo da célula */
  render?: (row: T) => React.ReactNode;
  /** Função para extrair valor usado na busca (opcional) */
  searchValue?: (row: T) => string;
  /** Alinhamento do conteúdo (padrão: 'left') */
  align?: "left" | "center" | "right";
}

export interface TableProps<T = any> {
  /** Array de dados a serem exibidos */
  data: T[];
  /** Configuração das colunas */
  columns: TableColumn<T>[];
  /** Estado de carregamento */
  loading?: boolean;
  /** Mensagem de erro */
  error?: string | null;
  /** Número de linhas por página (padrão: 10) */
  rowsPerPage?: number;
  /** Mensagem quando não há dados */
  emptyMessage?: string;
  /** Habilitar filtro por data */
  enableDateFilter?: boolean;
  /** Label do filtro de data */
  dateFilterLabel?: string;
  /** Função para extrair data do objeto para filtro de data */
  dateFilterValue?: (row: T) => string;
  /** Callback quando uma linha é clicada */
  onRowClick?: (row: T) => void;
  /** Habilitar hover nas linhas */
  enableRowHover?: boolean;
  /** Habilitar paginação (padrão: true) */
  enablePagination?: boolean;
  /** Habilitar navegação por URL ao clicar na linha */
  enableModalRoute?: boolean;
  /** Nome do parâmetro do modal na URL (padrão: "modal") */
  modalParam?: string;
  /** Valor do modal na URL (padrão: "detalhes") */
  modalValue?: string;
  /** Nome do parâmetro do ID na URL (padrão: "id") */
  idParam?: string;
  /** Função para extrair o ID da row (padrão: row.id) */
  getRowId?: (row: T) => string | number;
  /** Paginação server-side */
  serverSidePagination?: boolean;
  /** Página atual (server-side) */
  currentPage?: number;
  /** Total de registros (server-side) */
  totalRecords?: number;
  /** Total de páginas (server-side) */
  totalPages?: number;
  /** Callback quando página muda (server-side) */
  onPageChange?: (page: number) => void;
  /** Callback quando pageSize muda (server-side) */
  onPageSizeChange?: (pageSize: number) => void;
  /** Filtros customizados */
  customFilters?: React.ReactNode;
  /** Habilitar filtro por busca unificada */
  enableSearchFilter?: boolean;
  /** Valor do filtro de busca */
  searchFilter?: string;
  /** Callback quando filtro de busca muda */
  onSearchFilterChange?: (search: string) => void;
  /** Placeholder para o campo de busca */
  searchPlaceholder?: string;
  /** Habilitar filtro por status */
  enableStatusFilter?: boolean;
  /** Valor do filtro de status */
  statusFilter?: string;
  /** Callback quando filtro de status muda */
  onStatusFilterChange?: (status: string) => void;
  /** Opções para o filtro de status */
  statusOptions?: string[];
}

export default function Table<T = any>({
  data,
  columns,
  loading = false,
  error = null,
  rowsPerPage = 10,
  emptyMessage = "Nenhum registro encontrado.",
  enableDateFilter = false,
  dateFilterLabel = "Filtrar por data",
  dateFilterValue,
  onRowClick,
  enableRowHover = true,
  enablePagination = true,
  enableModalRoute = false,
  modalParam = "modal",
  modalValue = "detalhes",
  idParam = "id",
  getRowId = (row: T) => (row as any).id,
  serverSidePagination = false,
  currentPage = 1,
  totalRecords = 0,
  totalPages = 0,
  onPageChange,
  onPageSizeChange,
  customFilters,
  enableSearchFilter = false,
  searchFilter = "",
  onSearchFilterChange,
  searchPlaceholder = "Pesquisar...",
  enableStatusFilter = false,
  statusFilter = "",
  onStatusFilterChange,
  statusOptions = ["Pendente", "Aprovado", "Reprovado"],
}: TableProps<T>) {
  const router = useRouter();
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(0);
  const [localPageSize, setLocalPageSize] = useState(rowsPerPage);
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");

  // Função para alternar ordenação
  const handleSort = (columnKey: string) => {
    if (orderBy === columnKey) {
      setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(columnKey);
      setOrderDirection("desc");
    }
  };

  // Filtragem e paginação
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Filtro de busca global
      const search = filterSearch.toLowerCase();
      if (search) {
        const searchableValues = columns
          .map((col) => {
            if (col.searchValue) {
              return col.searchValue(row);
            }
            if (col.render) {
              const rendered = col.render(row);
              return typeof rendered === "string" ||
                typeof rendered === "number"
                ? String(rendered)
                : "";
            }
            return String((row as any)[col.key] ?? "");
          })
          .join(" ")
          .toLowerCase();

        if (!searchableValues.includes(search)) {
          return false;
        }
      }

      // Filtro de data
      if (enableDateFilter && filterDate && dateFilterValue) {
        const rowDate = dateFilterValue(row);
        if (rowDate && rowDate.slice(0, 10) !== filterDate) {
          return false;
        }
      }

      return true;
    });
  }, [
    data,
    filterSearch,
    filterDate,
    columns,
    enableDateFilter,
    dateFilterValue,
  ]);

  // Ordenação dos dados
  const sortedData = useMemo(() => {
    let sorted = [...filteredData];

    // Ordenação por status: Pendente sempre primeiro quando status filter é vazio
    if (!statusFilter || statusFilter === "") {
      sorted.sort((a, b) => {
        const statusA = (a as any).status;
        const statusB = (b as any).status;
        if (statusA === "Pendente" && statusB !== "Pendente") return -1;
        if (statusA !== "Pendente" && statusB === "Pendente") return 1;
        return 0;
      });
    }

    // Ordenação adicional por coluna clicada
    if (orderBy) {
      sorted.sort((a, b) => {
        const aValue = (a as any)[orderBy];
        const bValue = (b as any)[orderBy];

        // Comparação numérica
        if (typeof aValue === "number" && typeof bValue === "number") {
          return orderDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Comparação de strings
        const aStr = String(aValue ?? "").toLowerCase();
        const bStr = String(bValue ?? "").toLowerCase();

        if (orderDirection === "asc") {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return sorted;
  }, [filteredData, orderBy, orderDirection, statusFilter]);

  const paginatedData = useMemo(() => {
    if (!enablePagination || serverSidePagination) return sortedData;
    return sortedData.slice(
      page * localPageSize,
      page * localPageSize + localPageSize
    );
  }, [sortedData, page, localPageSize, enablePagination, serverSidePagination]);

  const pageCount = serverSidePagination
    ? totalPages
    : Math.ceil(sortedData.length / localPageSize);

  const displayData = serverSidePagination ? sortedData : paginatedData;

  // Calcular informações de paginação
  const startRecord = serverSidePagination
    ? (currentPage - 1) * rowsPerPage + 1
    : page * localPageSize + 1;
  const endRecord = serverSidePagination
    ? Math.min(currentPage * rowsPerPage, totalRecords)
    : Math.min((page + 1) * localPageSize, filteredData.length);
  const total = serverSidePagination ? totalRecords : sortedData.length;

  const handleRowClick = (row: T) => {
    // Se habilitado roteamento por URL, navega para o modal
    if (enableModalRoute) {
      const id = getRowId(row);
      router.push(`?${modalParam}=${modalValue}&${idParam}=${id}`, {
        scroll: false,
      });
    }

    // Chama callback adicional se fornecido
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4">
        {!serverSidePagination && (
          <TextField
            label="Filtrar em todas as colunas"
            variant="outlined"
            size="small"
            value={filterSearch}
            onChange={(e) => {
              setFilterSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        )}

        {enableSearchFilter && (
          <TextField
            label="Pesquisar"
            variant="outlined"
            size="small"
            value={searchFilter}
            onChange={(e) => onSearchFilterChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
        )}

        {enableStatusFilter && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => onStatusFilterChange?.(e.target.value)}
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {enableDateFilter && (
          <TextField
            label={dateFilterLabel}
            variant="outlined"
            size="small"
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
          />
        )}

        {customFilters}
      </div>

      {/* Informações de paginação */}
      {enablePagination && total > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Exibindo <strong>{startRecord}</strong> -{" "}
            <strong>{endRecord}</strong> de <strong>{total}</strong>{" "}
            {total === 1 ? "registro" : "registros"}
          </Typography>
        </Box>
      )}

      {/* Tabela */}
      <div className="flex-1 overflow-auto min-h-0">
        <TableContainer
          component={Paper}
          sx={{ height: "100%" }}
        >
          <MuiTable stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || "left"}
                    sx={{
                      backgroundColor: "#001e50",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "0.75rem",
                      letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                      minWidth: column.minWidth || 90,
                      cursor: column.key === "id" ? "pointer" : "default",
                      userSelect: "none",
                      "&:hover":
                        column.key === "id"
                          ? {
                              backgroundColor: "#003080",
                            }
                          : {},
                    }}
                    onClick={() => column.key === "id" && handleSort("id")}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {column.label}
                      {column.key === "id" &&
                        orderBy === "id" &&
                        (orderDirection === "asc" ? (
                          <ArrowUpwardIcon fontSize="small" />
                        ) : (
                          <ArrowDownwardIcon fontSize="small" />
                        ))}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    {error}
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <span className="flex items-center justify-center gap-2 text-gray-500">
                      <InfoOutlinedIcon fontSize="small" /> {emptyMessage}
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row, index) => (
                  <TableRow
                    key={index}
                    hover={enableRowHover}
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(row)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align || "left"}
                      >
                        {column.render
                          ? column.render(row)
                          : String((row as any)[column.key] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>
      </div>

      {/* Paginação */}
      {enablePagination && pageCount > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
            pt: 2,
            borderTop: "1px solid #e0e0e0",
            flexWrap: "wrap",
            gap: 2,
            flexShrink: 0,
            backgroundColor: "white",
          }}
        >
          {/* Controle de registros por página */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Registros por página:
            </Typography>
            <Select
              size="small"
              value={localPageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setLocalPageSize(newSize);
                if (serverSidePagination) {
                  onPageSizeChange?.(newSize);
                }
                setPage(0);
                if (serverSidePagination) {
                  onPageChange?.(1);
                }
              }}
              sx={{ minWidth: 80 }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </Box>

          {/* Botões de navegação */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => {
                if (serverSidePagination) {
                  onPageChange?.(1);
                } else {
                  setPage(0);
                }
              }}
              disabled={serverSidePagination ? currentPage === 1 : page === 0}
              className="border rounded w-9 h-9 flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Primeira página"
            >
              <FirstPageIcon fontSize="small" />
            </button>
            <button
              onClick={() => {
                if (serverSidePagination) {
                  onPageChange?.(currentPage - 1);
                } else {
                  setPage((p) => Math.max(0, p - 1));
                }
              }}
              disabled={serverSidePagination ? currentPage === 1 : page === 0}
              className="border rounded w-9 h-9 flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <NavigateBeforeIcon fontSize="small" />
            </button>
            <span className="mx-2 text-base select-none text-black">
              Página <b>{serverSidePagination ? currentPage : page + 1}</b> de{" "}
              <b>{pageCount}</b>
            </span>
            <button
              onClick={() => {
                if (serverSidePagination) {
                  onPageChange?.(currentPage + 1);
                } else {
                  setPage((p) => Math.min(pageCount - 1, p + 1));
                }
              }}
              disabled={
                serverSidePagination
                  ? currentPage === totalPages
                  : page === pageCount - 1
              }
              className="border rounded w-9 h-9 flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Próxima página"
            >
              <NavigateNextIcon fontSize="small" />
            </button>
            <button
              onClick={() => {
                if (serverSidePagination) {
                  onPageChange?.(totalPages);
                } else {
                  setPage(pageCount - 1);
                }
              }}
              disabled={
                serverSidePagination
                  ? currentPage === totalPages
                  : page === pageCount - 1
              }
              className="border rounded w-9 h-9 flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Última página"
            >
              <LastPageIcon fontSize="small" />
            </button>
          </div>
        </Box>
      )}
    </div>
  );
}
