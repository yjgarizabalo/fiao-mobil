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
  status: "al_dia" | "debe";
  balance: number;
}

// ✅ Tipado del API
interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ClientContextType {
  clients: Client[];
  addClient: (
    businessId: string,
    client: Omit<Client, "id" | "status" | "balance">,
  ) => void;
  getClient: (clientId: string, businessId: string) => Promise<Client | undefined>;
  loadClientsByBusiness: (businessId: string) => Promise<void>;
  loadAllClients: (businessIds: string[]) => Promise<void>;
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
  const clientsRef = useRef<Client[]>(clients);

  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  // POST /debtors — header: x-business-id
  const addClient = useCallback(
    async (
      businessId: string,
      clientData: Omit<Client, "id" | "status" | "balance">,
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

  // GET /debtors/:debtor_id — header: x-business-id
  const getClient = useCallback(async (clientId: string, businessId: string) => {
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

  // GET /debtors — header: x-business-id (un solo negocio)
  const loadClientsByBusiness = useCallback(async (businessId: string) => {
    try {
      const res = await api.get<ApiResponse<Client[]>>(`/debtors`, {
        headers: { "x-business-id": businessId },
      });

      const data = res.data?.data ?? [];
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading clients by business:", error);
    }
  }, []);

  // GET /debtors para múltiples negocios en paralelo, deduplica por id
  const loadAllClients = useCallback(async (businessIds: string[]) => {
    if (!businessIds.length) {
      setClients([]);
      return;
    }

    try {
      const responses = await Promise.all(
        businessIds.map((id) =>
          api.get<ApiResponse<Client[]>>(`/debtors`, {
            headers: { "x-business-id": id },
          }),
        ),
      );

      const merged: Client[] = responses.flatMap((r) =>
        Array.isArray(r.data?.data) ? r.data.data : [],
      );

      const unique = Array.from(
        new Map(merged.map((c) => [c.id, c])).values(),
      );

      setClients(unique);
    } catch (error) {
      console.error("Error loading all clients:", error);
      setClients([]);
    }
  }, []);

  const clearClients = useCallback(() => setClients([]), []);

  const value = useMemo(
    () => ({
      clients,
      addClient,
      getClient,
      loadClientsByBusiness,
      loadAllClients,
      setClients,
      clearClients,
    }),
    [clients, addClient, getClient, loadClientsByBusiness, loadAllClients, clearClients],
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
};