"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../services/loginService";
import { useAuth } from "@/contexts/AuthContext";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginPage() {
  const [form, setForm] = useState({ usuario: "", senha: "" });
  const { login, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState("");
  const [token, setToken] = useState("");
  const router = useRouter();

  // Remove o token ao abrir a tela de login e redireciona imediatamente
  useEffect(() => {
    logout();
    // Garante que a navegação para login ocorra após logout
    router.replace("/login");
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setToken("");
    try {
      const data = await loginUser(form);
      setToken(data.token || "");
      // Atualiza o contexto de autenticação com dados do login
      login(data.user, data.token);
      // Redireciona para o menu
      router.push("/menu");
    } catch (err: any) {
      setErro(err.message || "Erro ao fazer login");
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-white mt-8">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md flex flex-col items-center transition-transform duration-300 hover:shadow-2xl">
        <img
          src="/SMARTCOMPRAS.svg"
          alt="SMARTCOMPRAS Logo"
          className="h-20 mb-6"
          style={{
            color: "#001e50",
            filter:
              "invert(10%) sepia(100%) saturate(1000%) hue-rotate(200deg)",
          }}
        />
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <TextField
            type="text"
            name="usuario"
            label="Digite seu usuário"
            value={form.usuario}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined"
            size="medium"
            InputLabelProps={{ style: { fontSize: 18 } }}
            inputProps={{ style: { fontSize: 18 } }}
          />
          <TextField
            type={showPassword ? "text" : "password"}
            name="senha"
            label="Digite sua senha"
            value={form.senha}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined"
            size="medium"
            InputLabelProps={{ style: { fontSize: 18 } }}
            inputProps={{ style: { fontSize: 18 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{
              fontWeight: "bold",
              fontSize: 18,
              borderRadius: 2,
              py: 1.5,
              position: "relative",
              overflow: "hidden",
              border: "2px solid #001e50",
              backgroundColor: "#001e50",
              color: "#fff",
              transition: "color 0.6s",
              "&:hover": {
                color: "#001e50",
                backgroundColor: "#fff",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                width: "0%",
                height: "100%",
                background: "#fff",
                zIndex: 1,
                transition: "width 0.6s",
              },
              "&:hover::after": {
                width: "100%",
              },
              "& span": {
                position: "relative",
                zIndex: 2,
              },
            }}
          >
            <span>ENTRAR</span>
          </Button>
        </form>
        <div className="flex justify-center items-center gap-4 mt-6 w-full text-blue-900 text-sm">
          <a
            href="#"
            className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-0.5 after:bg-blue-900 after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            style={{ paddingBottom: "2px", display: "inline-block" }}
          >
            Esqueci minha senha
          </a>
          <span className="mx-2">|</span>
          <a
            href="/register"
            className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-0.5 after:bg-blue-900 after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            style={{ paddingBottom: "2px", display: "inline-block" }}
          >
            Cadastre-se
          </a>
        </div>
      </div>
    </div>
  );
}
