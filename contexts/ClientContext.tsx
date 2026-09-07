import api from "@/utils/api";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface Client {
  id: string;
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  balance: number;
  businessId?: string;
  totalBalance: number;
  hasPendingDebt: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse<T> {
  data: T;
  meta: PaginationMeta;
}

interface ClientContextType {
  clients: Client[];
  pagination: PaginationMeta | null;
  addClient: (
    businessId: string,
    client: Omit<Client, "id" | "balance" | "totalBalance" | "hasPendingDebt">,
  ) => void;
  getClient: (clientId: string, businessId: string) => Promise<Client | undefined>;
  refreshClient: (clientId: string, businessId: string) => Promise<Client | undefined>;
  loadClientsByBusiness: (businessId: string) => Promise<void>;
  loadAllClients: (page?: number, limit?: number) => Promise<void>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  clearClients: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClients must be used within a ClientProvider");
  }
  return context;
};

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const clientsRef = useRef<Client[]>(clients);

  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  const addClient = useCallback(
    async (
      businessId: string,
      clientData: Omit<Client, "id" | "balance" | "totalBalance" | "hasPendingDebt">,
    ) => {
      try {
        const response = await api.post(`/debtors`, clientData, {
          headers: { "x-business-id": businessId },
        });
        setClients((prev) => [...prev, response.data]);
      } catch (error) {
        console.error("Error creating client:", error);
      }
    },
    [],
  );

  const getClient = useCallback(async (clientId: string, businessId: string) => {
    // Usa caché local para evitar llamada extra si ya tenemos el cliente
    const local = clientsRef.current.find((c) => c.id === clientId);
    if (local) return local;

    try {
      const res = await api.get(`/debtors/${clientId}`, {
        headers: { "x-business-id": businessId },
      });
      return res.data as Client;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.warn(`Client not found: ${clientId}`);
        return undefined;
      }
      throw error;
    }
  }, []);

  const refreshClient = useCallback(async (clientId: string, businessId: string) => {
    try {
      const res = await api.get(`/debtors/${clientId}`, {
        headers: { "x-business-id": businessId },
      });
      const fresh = res.data as Client;
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? fresh : c)),
      );
      return fresh;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.warn(`Client not found: ${clientId}`);
        return undefined;
      }
      throw error;
    }
  }, []);

  const loadClientsByBusiness = useCallback(async (businessId: string) => {
    try {
      const res = await api.get(`/debtors`, {
        headers: { "x-business-id": businessId },
      });
      const raw: any[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (res.data?.meta) setPagination(res.data.meta);

      const withBusinessId = raw.map((c) => ({ ...c, businessId })) as Client[];
      setClients(withBusinessId);
    } catch (error) {
      console.error("Error loading clients by business:", error);
    }
  }, []);

  const loadAllClients = useCallback(async (page = 1, limit = 10) => {
    try {
      const res = await api.get<ApiResponse<Client[]>>(`/debtors/me/all`, {
        params: { page, limit },
      });
      const raw: any[] = res.data?.data ?? [];
      const data = Array.isArray(raw) ? raw : [];

      if (res.data?.meta) setPagination(res.data.meta);

      setClients(data as Client[]);
    } catch (error) {
      console.error("Error loading all clients:", error);
      setClients([]);
      setPagination(null);
    }
  }, []);

  const clearClients = useCallback(() => {
    setClients([]);
    setPagination(null);
  }, []);

  const value = useMemo(
    () => ({
      clients,
      pagination,
      addClient,
      getClient,
      refreshClient,
      loadClientsByBusiness,
      loadAllClients,
      setClients,
      clearClients,
    }),
    [clients, pagination, addClient, getClient, refreshClient, loadClientsByBusiness, loadAllClients, clearClients],
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
};