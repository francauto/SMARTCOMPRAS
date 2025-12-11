import Dialog from "@mui/material/Dialog";
import { clientesService } from "@/services/clientesService";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from "react";
import { NumericFormat, NumberFormatValues } from "react-number-format";
import { aprovadoresService } from "@/services/aprovadorService";
import { AprovadorDiretoria } from "@/types/aprovador";

interface ModalNovaSolicitacaoClienteProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    descricao: string;
    valor: number;
    aprovadorId: number;
  }) => void;
}


export default function ModalNovaSolicitacaoCliente({ open, onClose, onSubmit }: ModalNovaSolicitacaoClienteProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<number | undefined>(undefined);
  const [aprovadorId, setAprovadorId] = useState<number | "">("");
  const [diretores, setDiretores] = useState<AprovadorDiretoria[]>([]);
  const [loadingDiretores, setLoadingDiretores] = useState(false);
  const [errorDiretores, setErrorDiretores] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoadingDiretores(true);
      aprovadoresService.getDiretoria()
        .then((data) => {
          setDiretores(data);
          setErrorDiretores(null);
        })
        .catch(() => setErrorDiretores("Erro ao carregar diretores."))
        .finally(() => setLoadingDiretores(false));
    } else {
      setDiretores([]);
      setErrorDiretores(null);
    }
  }, [open]);

  const handleClose = () => {
    // Limpa o estado ao fechar para que o modal esteja sempre novo
    setDescricao("");
    setValor(undefined);
    setAprovadorId("");
    onClose();
  };


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (descricao.trim() && valor !== undefined && valor > 0 && aprovadorId !== "") {
      setLoading(true);
      setError(null);
      try {
        await clientesService.criarSolicitacao({
          descricao,
          valor,
          id_aprovador: Number(aprovadorId)
        });
        onSubmit({ descricao, valor, aprovadorId: Number(aprovadorId) });
        handleClose();
      } catch (err: any) {
        setError(err?.response?.data?.message || "Erro ao enviar solicitação.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Habilita o botão apenas se todos os campos estiverem preenchidos corretamente
  const isFormValid = descricao.trim() !== "" && valor !== undefined && valor > 0 && aprovadorId !== "";

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xs" 
      fullWidth 
      PaperProps={{ sx: { borderRadius: '12px', width: '400px' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', padding: '24px 24px 16px 24px' }}>
        Nova Solicitação
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ border: 'none', padding: '0 24px' }}>
        <div className="flex flex-col gap-4 py-2">
          {/* Campo Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm text-gray-800">Descrição</label>
            <TextField
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              fullWidth
              autoFocus
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </div>
          
          {/* Campo Valor */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm text-gray-800">Valor</label>
            <NumericFormat
              customInput={TextField}
              value={valor ?? ""}
              onValueChange={(values: NumberFormatValues) => setValor(values.floatValue)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              fullWidth
              allowNegative={false}
              decimalScale={2}
              fixedDecimalScale
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </div>
          
          {/* Campo Aprovador (Diretor) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm text-gray-800">Enviar para o Diretor</label>
            <Select
              value={aprovadorId}
              onChange={(e: SelectChangeEvent<number | "">) => setAprovadorId(e.target.value as number)}
              displayEmpty
              fullWidth
              variant="outlined"
              sx={{ borderRadius: '8px', '.MuiSelect-select': { fontStyle: !aprovadorId ? 'italic' : 'normal' } }}
              disabled={loadingDiretores}
            >
              <MenuItem value="" disabled>
                {loadingDiretores ? "Carregando..." : "Selecione o diretor"}
              </MenuItem>
              {diretores.map((diretor) => (
                <MenuItem key={diretor.id} value={diretor.id}>
                  {diretor.nome}
                </MenuItem>
              ))}
            </Select>
            {errorDiretores && <span style={{ color: 'red', fontSize: 12 }}>{errorDiretores}</span>}
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ padding: '24px' }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth
          disabled={!isFormValid || loading}
          sx={{
            backgroundColor: '#001e50',
            color: '#fff',
            fontWeight: 'bold',
            padding: '12px',
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#003080',
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              backgroundColor: '#a9b4c4',
              color: '#e9edf2',
            }
          }}
        >
          {loading ? "Enviando..." : "Enviar Solicitação"}
        </Button>
        {error && <span style={{ color: 'red', fontSize: 12, marginTop: 8 }}>{error}</span>}
      </DialogActions>
    </Dialog>
  );
}