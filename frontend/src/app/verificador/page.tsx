"use client";

import { useEffect, useRef, useState } from "react";
// Função para abrir a câmera do dispositivo
const openDeviceCamera = () => {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      // Apenas abre a câmera, sem capturar imagem
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.style.position = 'fixed';
      video.style.top = '50%';
      video.style.left = '50%';
      video.style.transform = 'translate(-50%, -50%)';
      video.style.zIndex = '9999';
      video.style.maxWidth = '90vw';
      video.style.maxHeight = '70vh';
      video.style.background = '#000';

      const closeBtn = document.createElement('button');
      closeBtn.innerText = 'Fechar';
      closeBtn.style.position = 'fixed';
      closeBtn.style.top = '10%';
      closeBtn.style.left = '50%';
      closeBtn.style.transform = 'translateX(-50%)';
      closeBtn.style.zIndex = '10000';
      closeBtn.style.padding = '10px 20px';
      closeBtn.style.background = '#e11d48';
      closeBtn.style.color = '#fff';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '8px';
      closeBtn.style.fontSize = '1.2rem';
      closeBtn.style.cursor = 'pointer';

      closeBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(video);
        document.body.removeChild(closeBtn);
      };

      document.body.appendChild(video);
      document.body.appendChild(closeBtn);
    })
    .catch(() => {
      alert('Não foi possível acessar a câmera.');
    });
};
import { FaCheck, FaCamera, FaSpinner, FaTimesCircle, FaShieldAlt, FaUser, FaCalendarAlt, FaTag, FaHashtag } from "react-icons/fa";
import { verificadorService } from "@/services/verificadorService";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex items-start justify-between py-3 border-b border-gray-200 last:border-b-0">
    <div className="flex items-center">
      <div className="mr-3 text-gray-500">{icon}</div>
      <span className="font-semibold text-gray-700">{label}:</span>
    </div>
    <span className="text-right text-gray-900">{value}</span>
  </div>
);

export default function VerificadorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [hashResult, setHashResult] = useState<any>(null);
  const [hashError, setHashError] = useState<string | null>(null);

  const handleBuscarHash = async (hash: string) => {
    if (!hash || loading) return;
    setLoading(true);
    setHashResult(null);
    setHashError(null);
    try {
      const result = await verificadorService.buscarHash({ hash });
      if (!result || result.length === 0) {
        throw new Error("Nenhum resultado encontrado para este hash.");
      }
      setHashResult(result[0]); // Armazena apenas o primeiro objeto do resultado
    } catch (err: any) {
      setHashError(err.message || "Hash não encontrado ou inválido.");
    } finally {
      setLoading(false);
    }
  };

  const [validating, setValidating] = useState(false);
  const handleValidar = async () => {
    if (!hashResult || !user) return;
    setValidating(true);
    setHashError(null);
    try {
      await verificadorService.atualizarUsoHash({ hash: hashResult.hash_code, funcionario_id: String(user.id) });
      // Atualiza o resultado para refletir o novo status
      await handleBuscarHash(hashResult.hash_code);
    } catch (err: any) {
      setHashError("Erro ao validar pagamento. Tente novamente.");
    } finally {
      setValidating(false);
    }
  };
  
  const resetState = () => {
    setInputValue("");
    setHashResult(null);
    setHashError(null);
    // Foca no input no próximo ciclo de renderização para garantir que ele esteja visível
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    // Redireciona o usuário se ele não tiver permissão de verificador
    if (user && user.verificador !== 1) {
      router.replace("/menu");
    }
  }, [user, router]);
  
  // Foca o input quando a página carrega
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Retorna null durante a verificação de permissão para evitar piscar de tela
  if (!user || user.verificador !== 1) {
    return null;
  }
  
  const getRequisitionType = (result: any) => {
    if (result.requisicoes_id) return "Despesa";
    if (result.cliente_request_id) return "Cliente";
    if (result.combustivel_request_id) return "Combustível Frota";
    if (result.combustivel_request_estoque_id) return "Combustível Estoque";
    if (result.requisicoes_estoque_id) return "Estoque";
    return "-";
  };

  const getRequisitionId = (result: any) => {
    return result.requisicoes_id ||
           result.cliente_request_id ||
           result.combustivel_request_id ||
           result.combustivel_request_estoque_id ||
           result.requisicoes_estoque_id ||
           "-";
  };
  
  const renderContent = () => {
    if (hashResult) {
      const isValidado = hashResult.usado === 1;
      return (
        <div className={`w-full animate-fade-in text-center ${isValidado ? "bg-green-50 border-green-500" : "bg-yellow-50 border-yellow-500"} border-2 rounded-lg p-6 flex flex-col items-center`}>
          {isValidado ? (
            <FaCheck className="text-6xl text-green-500 mb-4" />
          ) : (
            <FaShieldAlt className="text-6xl text-yellow-500 mb-4" />
          )}
          <h2 className={`text-2xl font-bold ${isValidado ? "text-green-800" : "text-yellow-800"}`}>{isValidado ? "Pagamento Validado!" : "Pagamento não validado"}</h2>
          <div className="w-full text-left mt-6">
            <DetailRow icon={<FaUser />} label="Validado por" value={hashResult.funcionario_nome || "-"} />
            <DetailRow icon={<FaCalendarAlt />} label="Data" value={hashResult.date_used ? new Date(hashResult.date_used).toLocaleString("pt-BR") : "-"} />
            <DetailRow icon={<FaTag />} label="Tipo" value={getRequisitionType(hashResult)} />
            <DetailRow icon={<FaHashtag />} label="Nº Requisição" value={getRequisitionId(hashResult)} />
          </div>
          {!isValidado && (
            <button
              className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
              onClick={handleValidar}
              disabled={validating}
              style={{ cursor: "pointer" }}
            >
              {validating ? "Validando..." : "Validar"}
            </button>
          )}
          <button
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
            onClick={resetState}
          >
            Validar Outro
          </button>
        </div>
      );
    }
    
    if (hashError) {
      return (
        // Card de Erro
        <div className="w-full animate-fade-in text-center bg-red-50 border-2 border-red-500 rounded-lg p-6 flex flex-col items-center">
          <FaTimesCircle className="text-6xl text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-800">Falha na Validação</h2>
          <p className="text-red-700 mt-2">{hashError}</p>
          <button
            className="w-full mt-8 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={resetState}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    
    // Formulário de Entrada
    return (
      <div className="w-full flex flex-col items-center animate-fade-in">
        <p className="text-gray-600 mb-6 text-center">Use o leitor para validar o QR Code ou digite o código de 36 dígitos.</p>
        <div className="w-full flex items-center relative">
          <input
            ref={inputRef}
            type="password"
            placeholder="Aguardando leitura do QR Code..."
            className="w-full rounded-lg border border-gray-300 py-3 px-4 pr-14 text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-300"
            value={inputValue}
            onChange={e => {
              const value = e.target.value;
              setInputValue(value);
              if (value.length === 36) {
                handleBuscarHash(value.trim());
              }
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                handleBuscarHash(inputValue.trim());
              }
            }}
            disabled={loading}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 h-full px-4 flex items-center justify-center text-gray-500">
            {loading ? (
              <FaSpinner size={20} className="animate-spin text-blue-600" />
            ) : (
              <FaCamera
                size={20}
                className="cursor-pointer hover:text-gray-700"
                onClick={openDeviceCamera}
                title="Abrir câmera"
              />
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-10 w-full max-w-2xl flex flex-col items-center transition-all duration-300">
        <div className="flex items-center text-gray-800 mb-2">
          <FaShieldAlt className="text-3xl mr-3 text-blue-600"/>
          <h1 className="text-4xl font-bold">Validador</h1>
        </div>
        <div className="w-full mt-6 flex justify-center">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}