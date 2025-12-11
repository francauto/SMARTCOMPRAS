"use client";
import { useEffect, useState, ReactNode } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter, useSearchParams } from "next/navigation";

export interface ModalBaseProps<T = any> {
  /** Parâmetro da URL que controla o modal (ex: "modal") */
  modalParam?: string;
  /** Valor esperado no parâmetro para abrir este modal (ex: "detalhes") ou array de valores aceitos */
  modalValue?: string | string[];
  /** Parâmetro da URL que contém o ID (ex: "id") */
  idParam?: string;
  /** Função para buscar dados pelo ID */
  fetchData?: (id: string | number) => Promise<T>;
  /** Título do modal (pode ser string ou função que recebe os dados) */
  title?: string | ((data: T | null) => string);
  /** Subtítulo opcional */
  subtitle?: string | ((data: T | null) => string);
  /** Tamanho máximo do modal */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Renderiza o conteúdo do body */
  renderContent?: (
    data: T | null,
    loading: boolean,
    error: string | null
  ) => ReactNode;
  /** Renderiza as ações do footer */
  renderActions?: (data: T | null, loading: boolean) => ReactNode;
  /** Callback quando o modal fecha */
  onClose?: () => void;
  /** Callback quando os dados são carregados com sucesso */
  onDataLoaded?: (data: T) => void;
  /** Desabilita o fetch automático (usar quando dados vêm de props) */
  disableAutoFetch?: boolean;
  /** Dados passados diretamente (quando não precisa fazer fetch) */
  data?: T | null;
  /** Controle manual de abertura (ignora URL) */
  open?: boolean;
  /** Fechar ao clicar fora */
  closeOnBackdrop?: boolean;
}

export default function ModalBase<T = any>({
  modalParam = "modal",
  modalValue = "detalhes",
  idParam = "id",
  fetchData,
  title = "Detalhes",
  subtitle,
  maxWidth = "md",
  renderContent,
  renderActions,
  onClose,
  onDataLoaded,
  disableAutoFetch = false,
  data: externalData,
  open: controlledOpen,
  closeOnBackdrop = true,
}: ModalBaseProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [internalData, setInternalData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determina se o modal está aberto
  const currentModalValue = searchParams.get(modalParam);
  const isOpen =
    controlledOpen !== undefined
      ? controlledOpen
      : Array.isArray(modalValue)
      ? modalValue.includes(currentModalValue || "")
      : currentModalValue === modalValue;

  // Dados a serem usados (externos ou internos)
  const modalData = externalData !== undefined ? externalData : internalData;

  // Busca dados quando modal abre
  useEffect(() => {
    if (!isOpen || disableAutoFetch || !fetchData) {
      return;
    }

    const id = searchParams.get(idParam);
    if (!id) {
      setError("ID não fornecido na URL");
      return;
    }

    setLoading(true);
    setError(null);

    fetchData(id)
      .then((data) => {
        setInternalData(data);
        setError(null);
        if (onDataLoaded) {
          onDataLoaded(data);
        }
      })
      .catch((err) => {
        setError(err?.message || "Erro ao carregar dados");
        setInternalData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    isOpen,
    searchParams,
    idParam,
    fetchData,
    disableAutoFetch,
    onDataLoaded,
  ]);

  // Função para fechar o modal
  const handleClose = () => {
    if (controlledOpen !== undefined) {
      // Modo controlado
      if (onClose) onClose();
    } else {
      // Modo URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete(modalParam);
      params.delete(idParam);
      router.push(`?${params.toString()}`, { scroll: false });
      if (onClose) onClose();
    }

    // Limpa dados internos ao fechar
    setTimeout(() => {
      setInternalData(null);
      setError(null);
    }, 300); // Delay para animação de fechamento
  };

  // Renderiza título
  const renderTitle = () => {
    if (typeof title === "function") {
      return title(modalData);
    }
    return title;
  };

  // Renderiza subtítulo
  const renderSubtitle = () => {
    if (!subtitle) return null;
    if (typeof subtitle === "function") {
      return subtitle(modalData);
    }
    return subtitle;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeOnBackdrop ? handleClose : undefined}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          maxHeight: "90vh",
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "#111827",
          padding: "24px 24px 16px 24px",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <div>
          {renderTitle()}
          {renderSubtitle() && (
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "#6b7280",
                marginTop: "4px",
              }}
            >
              {renderSubtitle()}
            </div>
          )}
        </div>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* BODY */}
      <DialogContent
        dividers
        sx={{
          padding: "24px",
          minHeight: "200px",
        }}
      >
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : renderContent ? (
          renderContent(modalData, loading, error)
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <Alert severity="info">Nenhum conteúdo para exibir</Alert>
          </Box>
        )}
      </DialogContent>

      {/* FOOTER */}
      {renderActions && (
        <DialogActions
          sx={{
            padding: "16px 24px",
            borderTop: "1px solid #e0e0e0",
            gap: 1,
          }}
        >
          {renderActions(modalData, loading)}
        </DialogActions>
      )}
    </Dialog>
  );
}
