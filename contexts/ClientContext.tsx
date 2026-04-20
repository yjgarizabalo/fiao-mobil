import { useAuth } from "@/contexts/AuthContext";
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

interface ClientContextType {
  clients: Client[];
  addClient: (
    businessId: string,
    client: Omit<Client, "id" | "status" | "balance">,
  ) => void;
  getClient: (id: string) => Client | undefined | Promise<Client | undefined>;
  loadClientsByBusiness: (businessId: string) => Promise<void>;
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
  const { user } = useAuth();

  // ✅ FIX: Usar ref para acceder a clients dentro de getClient sin que
  // sea una dependencia del useCallback. Antes, getClient dependía de [clients]
  // lo que lo recreaba en cada cambio de lista → nuevas referencias →
  // re-renders en cascada → dispatchEvent en nodo null.
  const clientsRef = useRef<Client[]>(clients);
  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  const addClient = useCallback(
    async (
      businessId: string,
      clientData: Omit<Client, "id" | "status" | "balance">,
    ) => {
      try {
        const response = await api.post(
          `/business/${businessId}/debtors`,
          clientData,
        );
        setClients((prev) => [...prev, response.data]);
      } catch (error) {
        console.error("Error creating client:", error);
      }
    },
    [],
  );

  // ✅ Sin dependencias: usa clientsRef.current en lugar de clients directamente
  const getClient = useCallback(async (id: string) => {
    const local = clientsRef.current.find((c) => c.id === id);
    if (local) return local;
    try {
      const res = await api.get(`/debtors/${id}`);
      return res.data as Client;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.warn(`Client not found for id ${id}`);
        return undefined;
      }
      throw error;
    }
  }, []); // ✅ Estable: no se recrea nunca

  const loadClientsByBusiness = useCallback(async (businessId: string) => {
    try {
      const res = await api.get(`/business/${businessId}/debtors`);
      setClients(res.data);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  }, []);

  const clearClients = useCallback(() => setClients([]), []);

  const value = useMemo(
    () => ({
      clients,
      addClient,
      getClient,
      loadClientsByBusiness,
      setClients,
      clearClients,
    }),
    [clients, addClient, getClient, loadClientsByBusiness, clearClients],
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
};