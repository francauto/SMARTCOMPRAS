"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress, Alert,
    Typography, IconButton, Autocomplete, InputAdornment, Chip, Stack, Card, CardHeader, CardContent, CardActions, Grid, Paper
} from "@mui/material";
import {
    AddCircleOutline as AddIcon,
    Delete as DeleteIcon,
    AccountBalance as BankIcon,
    Person as PersonIcon
} from "@mui/icons-material";
import { despesasService } from "@/services/despesasService";
import { departamentosService } from "@/services/departamentosService";
import { aprovadoresService } from "@/services/aprovadorService";
import {
    CriarRequisicaoDespesasPayload,
    DepartamentoRateio,
    FornecedorItem,
    FornecedorRequisicao
} from "@/types/despesas";

interface ModalNovaSolicitacaoDespesasProps { open: boolean; onClose: () => void; onSuccess: () => void; }
interface Diretor { id: number; nome: string; }
interface Departamento { id: number; nome: string; }

const ModalNovaSolicitacaoDespesas: React.FC<ModalNovaSolicitacaoDespesasProps> = ({ open, onClose, onSuccess }) => {
    const [descricao, setDescricao] = useState("");
    const [idDiretor, setIdDiretor] = useState<number | null>(null);
    const [fornecedores, setFornecedores] = useState<FornecedorRequisicao[]>([{ nome: '', itens: [{ descricao_item: '', qtde: 1, valor_unitario: 0 }] }]);
    const [departamentos, setDepartamentos] = useState<DepartamentoRateio[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [diretoresList, setDiretoresList] = useState<Diretor[]>([]);
    const [departamentosList, setDepartamentosList] = useState<Departamento[]>([]);
    const [rateioModalOpen, setRateioModalOpen] = useState(false);

    useEffect(() => {
        if (open) {
            aprovadoresService.getDiretoria().then(setDiretoresList).catch(() => setError("Falha ao carregar diretores."));
            departamentosService.buscarTodos().then(setDepartamentosList).catch(() => setError("Falha ao carregar departamentos."));
        }
    }, [open]);

    const handleAddFornecedor = () => setFornecedores([...fornecedores, { nome: '', itens: [{ descricao_item: '', qtde: 1, valor_unitario: 0 }] }]);
    const handleRemoveFornecedor = (index: number) => setFornecedores(fornecedores.filter((_, i) => i !== index));
    const handleFornecedorChange = (index: number, value: string) => {
        const newF = [...fornecedores]; newF[index].nome = value; setFornecedores(newF);
    };
    const handleAddItem = (fIndex: number) => {
        const newF = [...fornecedores]; newF[fIndex].itens.push({ descricao_item: '', qtde: 1, valor_unitario: 0 }); setFornecedores(newF);
    };
    const handleRemoveItem = (fIndex: number, iIndex: number) => {
        const newF = [...fornecedores]; newF[fIndex].itens = newF[fIndex].itens.filter((_, i) => i !== iIndex); setFornecedores(newF);
    };
    const handleItemChange = (fIndex: number, iIndex: number, field: keyof FornecedorItem, value: string | number) => {
        const newF = [...fornecedores];
        if (field === 'qtde' || field === 'valor_unitario') {
            (newF[fIndex].itens[iIndex] as any)[field] = value === undefined || value === null ? 0 : value;
        } else {
            (newF[fIndex].itens[iIndex] as any)[field] = value;
        }
        setFornecedores(newF);
    };
    const handleAddDepartamento = () => setDepartamentos([...departamentos, { id_departamento: 0, percentual_rateio: 0 }]);
    const handleRemoveDepartamento = (index: number) => setDepartamentos(departamentos.filter((_, i) => i !== index));
    const handleDepartamentoChange = (index: number, field: keyof DepartamentoRateio, value: number) => {
        const newD = [...departamentos]; (newD[index] as any)[field] = value; setDepartamentos(newD);
    };

    const totalPercentualRateio = useMemo(() => departamentos.reduce((acc, dep) => acc + Number(dep.percentual_rateio || 0), 0), [departamentos]);
    const valorRange = useMemo(() => {
        const totais = fornecedores.map(f => f.itens.reduce((sub, item) => sub + (Number(item.qtde || 0) * Number(item.valor_unitario || 0)), 0));
        if (totais.length === 0) return { min: 0, max: 0 };
        return { min: Math.min(...totais), max: Math.max(...totais) };
    }, [fornecedores]);

    const resetState = () => {
        setDescricao(""); setIdDiretor(null); setFornecedores([{ nome: '', itens: [{ descricao_item: '', qtde: 1, valor_unitario: 0 }] }]);
        setDepartamentos([]); setError(null); setSuccess(false);
    };
    const handleClose = () => { resetState(); onClose(); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null);
        if (!idDiretor || totalPercentualRateio !== 100 || fornecedores.some(f => !f.nome.trim())) { return; }
        setLoading(true);
        const payload: CriarRequisicaoDespesasPayload = {
            descricao, id_diretor: idDiretor,
            fornecedores: fornecedores.map(f => ({ ...f, itens: f.itens.map(i => ({ ...i, qtde: +i.qtde, valor_unitario: +i.valor_unitario })) })),
            departamentos: departamentos.map(d => ({ ...d, percentual_rateio: +d.percentual_rateio })),
        };
        try {
            await despesasService.criarRequisicao(payload); setSuccess(true); onSuccess(); setTimeout(handleClose, 1500);
        } catch (err: any) { setError(err?.response?.data?.message || "Erro ao criar a solicitação."); } finally { setLoading(false); }
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ py: 2, px: 3, bgcolor: '#001e50', color: 'white' }}>
                    Nova Solicitação de Despesa
                </DialogTitle>

                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            {/* DESCRIÇÃO */}
                            <TextField
                                fullWidth
                                size="small"
                                label="Descrição"
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                required
                            />

                            {/* FORNECEDORES */}
                            <Box>
                                <Typography variant="subtitle2" fontWeight="600" mb={1}>Fornecedores</Typography>
                                <Stack spacing={1.5}>
                                    {fornecedores.map((fornecedor, fIndex) => {
                                        const totalFornecedor = fornecedor.itens.reduce((acc, item) =>
                                            acc + (Number(item.qtde ?? 0) * Number(item.valor_unitario ?? 0)), 0
                                        );
                                        return (
                                            <Card key={fIndex} variant="outlined">
                                                {/* HEADER - Nome do Fornecedor */}
                                                <CardHeader
                                                    sx={{ py: 1, px: 2, bgcolor: '#f5f5f5' }}
                                                    title={
                                                        <TextField
                                                            size="small"
                                                            label="Nome do Fornecedor"
                                                            value={fornecedor.nome}
                                                            onChange={e => handleFornecedorChange(fIndex, e.target.value)}
                                                            required
                                                            fullWidth
                                                        />
                                                    }
                                                    action={
                                                        <IconButton
                                                            onClick={() => handleRemoveFornecedor(fIndex)}
                                                            disabled={fornecedores.length === 1}
                                                            color="error"
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    }
                                                />

                                                {/* BODY - Itens */}
                                                <CardContent sx={{ py: 1.5, px: 2 }}>
                                                    <Stack spacing={1}>
                                                        {fornecedor.itens.map((item, iIndex) => (
                                                            <Grid container spacing={1} alignItems="center" key={iIndex}>
                                                                <Grid item xs={12} sm={5}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        label="Item"
                                                                        value={item.descricao_item}
                                                                        onChange={e => handleItemChange(fIndex, iIndex, 'descricao_item', e.target.value)}
                                                                        required
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={4} sm={2}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        type="number"
                                                                        label="Qtd"
                                                                        value={item.qtde ?? 0}
                                                                        onChange={e => handleItemChange(fIndex, iIndex, 'qtde', parseFloat(e.target.value) || 0)}
                                                                        required
                                                                        inputProps={{ min: 1 }}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={4} sm={2}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        type="number"
                                                                        label="Valor"
                                                                        value={item.valor_unitario ?? 0}
                                                                        onChange={e => handleItemChange(fIndex, iIndex, 'valor_unitario', parseFloat(e.target.value) || 0)}
                                                                        required
                                                                        inputProps={{ min: 0, step: 0.01 }}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={3} sm={2}>
                                                                    <Typography variant="body2" fontWeight="600" color="#001e50">
                                                                        {(Number(item.qtde ?? 0) * Number(item.valor_unitario ?? 0))
                                                                            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={1} sm={1}>
                                                                    <IconButton
                                                                        onClick={() => handleRemoveItem(fIndex, iIndex)}
                                                                        disabled={fornecedor.itens.length === 1}
                                                                        color="error"
                                                                        size="small"
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Grid>
                                                            </Grid>
                                                        ))}
                                                        <Button
                                                            startIcon={<AddIcon />}
                                                            onClick={() => handleAddItem(fIndex)}
                                                            size="small"
                                                            sx={{ alignSelf: 'flex-start' }}
                                                        >
                                                            Adicionar Item
                                                        </Button>
                                                    </Stack>
                                                </CardContent>

                                                {/* FOOTER - Total */}
                                                <CardActions sx={{ py: 1, px: 2, bgcolor: '#e3f2fd', justifyContent: 'flex-end' }}>
                                                    <Typography variant="subtitle2" fontWeight="700" color="#001e50">
                                                        Total: {totalFornecedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </Typography>
                                                </CardActions>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddFornecedor}
                                    sx={{ mt: 1 }}
                                    variant="outlined"
                                    size="small"
                                >
                                    Adicionar Fornecedor
                                </Button>
                            </Box>

                            {/* RATEIO - Botão */}
                            <Box display="flex" gap={2} alignItems="center">
                                <Button
                                    startIcon={<BankIcon />}
                                    onClick={() => setRateioModalOpen(true)}
                                    variant="outlined"
                                    fullWidth
                                    endIcon={
                                        <Chip
                                            label={`${totalPercentualRateio}%`}
                                            color={totalPercentualRateio === 100 ? 'success' : 'error'}
                                            size="small"
                                        />
                                    }
                                >
                                    Configurar Rateio ({departamentos.length} dept.)
                                </Button>
                            </Box>

                            {/* DIRETOR */}
                            <Autocomplete
                                size="small"
                                options={diretoresList}
                                getOptionLabel={(o) => o.nome}
                                value={diretoresList.find(d => d.id === idDiretor) || null}
                                onChange={(_, v) => setIdDiretor(v?.id || null)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Diretor Responsável" required InputProps={{ ...params.InputProps, startAdornment: <><PersonIcon sx={{ color: 'action.active', mr: 1 }} />{params.InputProps.startAdornment}</> }} />
                                )}
                            />

                            {/* RESUMO */}
                            <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid', borderColor: '#001e50' }}>
                                <Typography variant="body2" color="#001e50">
                                    <strong>Faixa:</strong> {valorRange.min === valorRange.max
                                        ? valorRange.min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                        : `${valorRange.min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - ${valorRange.max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                                    }
                                </Typography>
                            </Box>

                            {error && <Alert severity="error">{error}</Alert>}
                            {success && <Alert severity="success">Solicitação criada!</Alert>}
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 1.5 }}>
                        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || totalPercentualRateio !== 100}
                        >
                            {loading ? <CircularProgress size={20} color="inherit" /> : "Criar"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* MODAL DE RATEIO */}
            <Dialog open={rateioModalOpen} onClose={() => setRateioModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ py: 2.5, px: 3, bgcolor: '#001e50', color: 'white' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <BankIcon sx={{ fontSize: 28 }} />
                            <Typography variant="h6" fontWeight={600}>Rateio por Departamento</Typography>
                        </Box>
                        <Chip
                            label={`Total: ${totalPercentualRateio}%`}
                            color={totalPercentualRateio === 100 ? 'success' : 'error'}
                            sx={{ 
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                height: 32
                            }}
                        />
                    </Box>
                </DialogTitle>
                
                <DialogContent sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                    {totalPercentualRateio !== 100 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            O total do rateio deve ser exatamente 100%. Atualmente: {totalPercentualRateio}%
                        </Alert>
                    )}
                    
                    <Stack spacing={2}>
                        {departamentos.map((dep, dIndex) => (
                            <Paper key={dIndex} elevation={1} sx={{ p: 2, bgcolor: 'white' }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={7}>
                                        <Autocomplete
                                            size="small"
                                            options={departamentosList.filter(d => !departamentos.some(s => s.id_departamento === d.id && s.id_departamento !== dep.id_departamento))}
                                            getOptionLabel={(o) => o.nome}
                                            value={departamentosList.find(d => d.id === dep.id_departamento) || null}
                                            onChange={(_, v) => handleDepartamentoChange(dIndex, 'id_departamento', v?.id || 0)}
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    label="Departamento" 
                                                    required 
                                                    fullWidth
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={9} sm={4}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            type="number"
                                            label="Percentual"
                                            value={dep.percentual_rateio || ''}
                                            onChange={e => handleDepartamentoChange(dIndex, 'percentual_rateio', parseFloat(e.target.value))}
                                            required
                                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                                            InputProps={{ 
                                                endAdornment: <InputAdornment position="end">%</InputAdornment> 
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={3} sm={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <IconButton 
                                            onClick={() => handleRemoveDepartamento(dIndex)} 
                                            color="error" 
                                            size="small"
                                            disabled={departamentos.length === 1}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                        
                        <Button 
                            startIcon={<AddIcon />} 
                            onClick={handleAddDepartamento} 
                            variant="outlined" 
                            size="medium"
                            sx={{ 
                                borderStyle: 'dashed',
                                borderWidth: 2,
                                py: 1.5,
                                '&:hover': {
                                    borderStyle: 'dashed',
                                    borderWidth: 2
                                }
                            }}
                        >
                            Adicionar Departamento
                        </Button>
                    </Stack>
                </DialogContent>
                
                <DialogActions sx={{ px: 3, py: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
                    <Button 
                        onClick={() => setRateioModalOpen(false)} 
                        variant="outlined"
                        color="inherit"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={() => setRateioModalOpen(false)} 
                        variant="contained"
                        disabled={totalPercentualRateio !== 100}
                        sx={{ bgcolor: '#001e50', '&:hover': { bgcolor: '#003080' } }}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ModalNovaSolicitacaoDespesas;
