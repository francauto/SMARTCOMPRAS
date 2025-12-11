"use client";
import { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { changePassword } from "@/services/passwordResetService";
import { useAuth } from "@/contexts/AuthContext";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { user } = useAuth();
  const [senhaAntiga, setSenhaAntiga] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await changePassword({ senhaAntiga, novaSenha });
      setSuccess("Senha alterada com sucesso!");
      setSenhaAntiga("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao trocar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-8 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-2 text-black">Alterar senha</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Senha atual"
            type="password"
            value={senhaAntiga}
            onChange={e => setSenhaAntiga(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Nova senha"
            type="password"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Confirmar nova senha"
            type="password"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            required
            fullWidth
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Box>
    </Modal>
  );
}
