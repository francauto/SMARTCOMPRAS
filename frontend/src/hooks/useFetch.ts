import { useState, useEffect } from "react";
import { api } from "@/services/api";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<T>(url);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

  }, [url]);

  return { data, loading, error, refetch: fetchData };
}
