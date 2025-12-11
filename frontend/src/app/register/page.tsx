"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/registerService";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function RegisterPage() {
  const { logout } = useAuth();
  const router = useRouter();
  useEffect(() => {
    logout();
  }, []);
  const [form, setForm] = useState({
    nome: "",
    sobrenome: "",
    usuario: "",
    senha: "",
    mail: "",
    confirmarSenha: "",
  });
  const [erroSenha, setErroSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Removido: implementação duplicada de handleChange
  function formatTelefone(value: string) {
    // Remove tudo que não for dígito
    value = value.replace(/\D/g, "");
    // Formata para (99) 99999-9999 ou (99) 9999-9999
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) {
      return value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (value.length > 6) {
      return value.replace(/(\d{2})(\d{4,5})(\d{0,4})/, "($1) $2-$3");
    } else if (value.length > 2) {
      return value.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      return value;
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm({ ...form, [e.target.name]: value });
    if (e.target.name === "confirmarSenha" || e.target.name === "senha") {
      if (
        (e.target.name === "confirmarSenha" && value !== form.senha) ||
        (e.target.name === "senha" &&
          form.confirmarSenha &&
          value !== form.confirmarSenha)
      ) {
        setErroSenha("As senhas não coincidem");
      } else {
        setErroSenha("");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    if (form.senha !== form.confirmarSenha) {
      setErroSenha("As senhas não coincidem");
      return;
    }
    setErroSenha("");
    const payload = {
      nome: form.nome,
      sobrenome: form.sobrenome,
      usuario: form.usuario,
      senha: form.senha,
      mail: form.mail,
    };
    try {
      await registerUser(payload);
      setSucesso("Cadastro realizado com sucesso!");
      setForm({
        nome: "",
        sobrenome: "",
        usuario: "",
        senha: "",
        mail: "",
        confirmarSenha: "",
      });
    } catch (err: any) {
      setErro(err.message || "Erro ao cadastrar usuário");
    }
  }

  return (
  <div className="flex min-h-[80vh] items-center justify-center bg-white mt-8">
  <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl flex flex-col items-center transition-transform duration-300 hover:scale-100 hover:shadow-2xl">
        <div className="flex flex-col items-center mb-4">
          <img src="/SMARTCOMPRAS.svg" alt="SMARTCOMPRAS Logo" className="h-20 mb-6" style={{ color: '#001e50', filter: 'invert(10%) sepia(100%) saturate(1000%) hue-rotate(200deg)' }} />
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              type="text"
              name="nome"
              label="Nome"
              value={form.nome}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
              InputLabelProps={{ style: { fontSize: 18 } }}
              inputProps={{ style: { fontSize: 18, paddingTop: 10 } }}
            />
            <TextField
              type="text"
              name="sobrenome"
              label="Sobrenome"
              value={form.sobrenome}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
              InputLabelProps={{ style: { fontSize: 18 } }}
              inputProps={{ style: { fontSize: 18, paddingTop: 10 } }}
            />
            <TextField
              type="text"
              name="usuario"
              label="Usuário (nome.sobrenome)"
              value={form.usuario}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
              InputLabelProps={{ style: { fontSize: 18 } }}
              inputProps={{ style: { fontSize: 18, paddingTop: 10 } }}
            />
            <TextField
              type="email"
              name="mail"
              label="Email"
              value={form.mail}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
              InputLabelProps={{ style: { fontSize: 18 } }}
              inputProps={{ style: { fontSize: 18, paddingTop: 10 } }}
            />
            <TextField
              type="password"
              name="senha"
              label="Senha"
              value={form.senha}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
              InputLabelProps={{ style: { fontSize: 18 } }}
              inputProps={{ style: { fontSize: 18, paddingTop: 10 } }}
            />
            <TextField
              type="password"
              name="confirmarSenha"
              label="Confirmar Senha"
              value={form.confirmarSenha}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
              InputLabelProps={{ style: { fontSize: 18 } }}
              inputProps={{ style: { fontSize: 18, paddingTop: 10 } }}
            />
          </div>
          {erroSenha && (
            <p className="text-red-500 text-sm text-center">{erroSenha}</p>
          )}
          {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}
          {sucesso && (
            <p className="text-green-500 text-sm text-center">{sucesso}</p>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{
              fontWeight: 'bold',
              fontSize: 18,
              borderRadius: 2,
              py: 1.5,
              position: 'relative',
              overflow: 'hidden',
              border: '2px solid #001e50',
              backgroundColor: '#001e50',
              color: '#fff',
              transition: 'color 0.6s',
              '&:hover': {
                color: '#001e50',
                backgroundColor: '#fff',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                width: '0%',
                height: '100%',
                background: '#fff',
                zIndex: 1,
                transition: 'width 0.6s',
              },
              '&:hover::after': {
                width: '100%',
              },
              '& span': {
                position: 'relative',
                zIndex: 2,
              },
            }}
          >
            <span>CADASTRAR</span>
          </Button>
          <div className="text-center mt-2 text-gray-500 text-sm">
            Problemas para se cadastrar? Contate o T.I
          </div>
          <div className="flex justify-center w-full mt-2">
            <a
              href="/login"
              className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-0.5 after:bg-blue-900 after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 text-blue-900 font-semibold text-base"
              style={{ paddingBottom: '2px', display: 'inline-block' }}
            >
              Fazer Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}