"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getUserProfile } from "@/services/userService";

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: any, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica autenticação via cookie httpOnly do backend
  useEffect(() => {
    getUserProfile()
      .then((res) => {
        console.log('Resposta do getUserProfile:', res);
        // Garante que user será setado mesmo se vier como res.user ou res
        if (res && res.user) {
          setUser(res.user);
          setToken('authenticated'); // Token gerenciado pelo backend via httpOnly
        } else if (res) {
          setUser(res);
          setToken('authenticated');
        } else {
          setUser(null);
          setToken(null);
        }
      })
      .catch((err) => {
        console.log('Erro ao buscar perfil - usuário não autenticado', err);
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function login(userData: any, jwtToken: string) {
    setUser(userData);
    setToken('authenticated'); // Token gerenciado pelo backend via httpOnly cookie
    // O token JWT está no cookie httpOnly 'authToken' gerenciado pelo backend
  }

  function logout() {
    setUser(null);
    setToken(null);
    // O cookie httpOnly será limpo pelo backend na rota de logout
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}