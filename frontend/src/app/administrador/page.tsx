"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Table from "@/components/table";
import { Usuario, AtualizarUsuarioPayload } from "@/types/admin";
import { adminService } from "@/services/adminService";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import DialogContentText from "@mui/material/DialogContentText";

export default function AdministradorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowedRoles = ["admfun", "admger", "admdir"];

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AtualizarUsuarioPayload>>({});

  const [resetLoadingId, setResetLoadingId] = useState<number | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [confirmResetUser, setConfirmResetUser] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!loading && user) {
      if (!allowedRoles.includes(user.cargo)) {
        router.replace("/menu");
      }
    }
    if (!loading && !user) {
      router.replace("/menu");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setLoadingUsuarios(true);
    adminService
      .listarUsuarios()
      .then((res: any) => {
        // Suporta resposta { message, data: Usuario[] }
        const data = Array.isArray(res) ? res : Array.isArray(res && res.data) ? res.data : [];
        setUsuarios(data);
      })
      .catch(() => setError("Erro ao buscar usuários."))
      .finally(() => setLoadingUsuarios(false));
  }, []);

  const handleEditClick = (user: Usuario) => {
    setEditUser(user);
    setEditForm({
      nome: user.nome,
      sobrenome: user.sobrenome,
      usuario: user.usuario,
      mail: user.mail,
      cargo: user.cargo,
      telefone: user.telefone || "",
      id_departamento: user.id_departamento || 0,
    });
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await adminService.atualizarUsuario(editUser.id, editForm as AtualizarUsuarioPayload);
      // Atualiza a lista após editar
      adminService.listarUsuarios()
        .then((res: any) => {
          const data = Array.isArray(res) ? res : Array.isArray(res && res.data) ? res.data : [];
          setUsuarios(data);
        });
      setEditUser(null);
    } catch (e: any) {
      setEditError(e?.message || "Erro ao atualizar usuário");
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetSenha = async (user: Usuario) => {
    setConfirmResetUser(null);
    setResetLoadingId(user.id);
    setResetError(null);
    try {
      await adminService.resetarSenha(user.id);
      setResetLoadingId(null);
      // Opcional: mostrar feedback de sucesso
    } catch (e: any) {
      setResetError(e?.message || "Erro ao resetar senha");
      setResetLoadingId(null);
    }
  };

  if (loading || !user || !allowedRoles.includes(user.cargo)) {
    return null;
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex-1 overflow-hidden p-4 sm:p-6 md:p-8 flex justify-center">
        <div className="w-full max-w-[95vw] xl:max-w-[1600px] flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-black">Funcionários Cadastrados</h1>
          </div>
          <Table
            data={usuarios.filter(u =>
              `${u.nome} ${u.sobrenome} ${u.usuario} ${u.mail} ${u.cargo} ${u.departamento}`.toLowerCase().includes(search.toLowerCase())
            )}
            columns={[
              { key: "nome", label: "Nome", minWidth: 120, searchValue: row => row.nome || "" },
              { key: "sobrenome", label: "Sobrenome", minWidth: 120, searchValue: row => row.sobrenome || "" },
              { key: "usuario", label: "Usuário", minWidth: 120, searchValue: row => row.usuario || "" },
              { key: "mail", label: "Email", minWidth: 180, searchValue: row => row.mail || "" },
              { key: "cargo", label: "Cargo", minWidth: 100, searchValue: row => row.cargo || "" },
              { key: "departamento", label: "Departamento", minWidth: 120, searchValue: row => row.departamento || "" },
              { key: "master", label: "Master", minWidth: 80, render: row => row.master ? "Sim" : "Não", searchValue: row => row.master ? "sim" : "não" },
              { key: "verificador", label: "Verificador", minWidth: 100, render: row => row.verificador ? "Sim" : "Não", searchValue: row => row.verificador ? "sim" : "não" },
              { key: "ativo", label: "Ativo", minWidth: 80, render: row => row.ativo ? "Sim" : "Não", searchValue: row => row.ativo ? "sim" : "não" },
              {
                key: "acoes",
                label: "Ações",
                minWidth: 100,
                render: row => (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="text-blue-700 hover:text-blue-900" onClick={() => handleEditClick(row)} title="Editar">
                      <EditOutlinedIcon />
                    </button>
                    <button
                      className="text-blue-700 hover:text-blue-900 cursor-pointer"
                      style={{ cursor: "pointer" }}
                      onClick={() => setConfirmResetUser(row)}
                      title="Resetar senha"
                      disabled={resetLoadingId === row.id}
                    >
                      <RestartAltIcon />
                    </button>
                  </div>
                ),
                searchValue: () => "",
              },
            ]}
            loading={loadingUsuarios}
            error={error}
            rowsPerPage={10}
            emptyMessage="Nenhum funcionário encontrado."
            enableRowHover={true}
            getRowId={row => row.id}
            serverSidePagination={false}
          />
          {/* Modal de edição */}
          <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }}>
              <TextField label="Nome" name="nome" value={editForm.nome || ""} onChange={handleEditChange} fullWidth />
              <TextField label="Sobrenome" name="sobrenome" value={editForm.sobrenome || ""} onChange={handleEditChange} fullWidth />
              <TextField label="Usuário" name="usuario" value={editForm.usuario || ""} onChange={handleEditChange} fullWidth />
              <TextField label="Email" name="mail" value={editForm.mail || ""} onChange={handleEditChange} fullWidth />
              <TextField label="Cargo" name="cargo" value={editForm.cargo || ""} onChange={handleEditChange} fullWidth />
              <TextField label="Telefone" name="telefone" value={editForm.telefone || ""} onChange={handleEditChange} fullWidth />
              <TextField label="ID Departamento" name="id_departamento" value={editForm.id_departamento || ""} onChange={handleEditChange} fullWidth type="number" />
              {editError && <div className="text-red-600 text-sm mt-2">{editError}</div>}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditUser(null)} disabled={editLoading}>Cancelar</Button>
              <Button onClick={handleEditSave} disabled={editLoading} variant="contained">Salvar</Button>
            </DialogActions>
          </Dialog>
          {/* Modal de confirmação de reset de senha */}
          <Dialog open={!!confirmResetUser} onClose={() => setConfirmResetUser(null)}>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza que deseja redefinir a senha do usuário <b>{confirmResetUser?.nome}</b> para <b>Tr0c@r123</b>?
              </DialogContentText>
              {resetError && <div className="text-red-600 text-sm mt-2">{resetError}</div>}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmResetUser(null)} disabled={resetLoadingId === confirmResetUser?.id}>Cancelar</Button>
              <Button
                onClick={() => confirmResetUser && handleResetSenha(confirmResetUser)}
                disabled={resetLoadingId === confirmResetUser?.id}
                variant="contained"
                color="error"
              >
                Redefinir
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
