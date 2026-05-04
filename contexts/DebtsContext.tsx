import api from "@/utils/api";
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

export interface AddDebts {
  businessId: string;
  debtorId: string;
  amount: number;
  description: string;
  dueDate: string;
}

export interface Debt {
  id: string;
  businessId: string;
  debtorId: string;
  amount: number;
  remainingAmount: number;
  description: string;
  dueDate: string;
}

export type DebtsMap = Record<string, Debt[]>;

interface DebtsContextType {
  debts: Debt[];
  debtsMap: DebtsMap;
  addDebt: (debt: AddDebts) => Promise<void>;
  getDebtsByClient: (clientId: string) => Debt[];
  loadDebtsByClient: (clientId: string, businessId: string) => Promise<void>;
  loadDebtsByClients: (clients: { id: string; businessId: string }[]) => Promise<void>;
  setDebts: Dispatch<SetStateAction<Debt[]>>;
  clearDebts: () => void;
}

const DebtsContext = createContext<DebtsContextType | undefined>(undefined);

export const useDebts = () => {
  const context = useContext(DebtsContext);
  if (!context) {
    throw new Error("useDebts must be used within a DebtsProvider");
  }
  return context;
};

export const DebtsProvider = ({ children }: { children: ReactNode }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsMap, setDebtsMap] = useState<DebtsMap>({});

  const addDebt = useCallback(async (debtData: AddDebts): Promise<void> => {
    try {
      const { businessId, ...body } = debtData;
      await api.post("/debts", body, {
        headers: { "x-business-id": businessId },
      });
    } catch (error) {
      console.error("Error creating debt:", error);
      throw error;
    }
  }, []);

  const getDebtsByClient = useCallback(
    (clientId: string): Debt[] => {
      return debts.filter((debt) => debt.debtorId === clientId);
    },
    [debts],
  );

  const loadDebtsByClient = useCallback(async (clientId: string, businessId: string) => {
    try {
      const response = await api.get(`/debtors/${clientId}/debts`, {
        headers: { "x-business-id": businessId },
      });
      const data = response.data?.data ?? response.data;
      setDebts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading debts:", error);
      setDebts([]);
    }
  }, []);

  const loadDebtsByClients = useCallback(
    async (clients: { id: string; businessId: string }[]) => {
      if (!clients.length) {
        setDebtsMap({});
        return;
      }

      const results = await Promise.allSettled(
        clients.map(({ id, businessId }) =>
          api
            .get(`/debtors/${id}/debts`, {
              headers: { "x-business-id": businessId },
            })
            .then((res) => ({
              clientId: id,
              debts: (() => {
                const data = res.data?.data ?? res.data;
                return Array.isArray(data) ? (data as Debt[]) : [];
              })(),
            }))
        )
      );

      const newEntries: DebtsMap = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          newEntries[result.value.clientId] = result.value.debts;
        }
      });

      // MERGE en lugar de reemplazar: conserva entradas de páginas anteriores
      // para que clientes de otras páginas no pierdan su estado en el mapa.
      setDebtsMap((prev) => ({ ...prev, ...newEntries }));
    },
    []
  );

  const clearDebts = useCallback(() => {
    setDebts([]);
    setDebtsMap({});
  }, []);

  const value = useMemo(
    () => ({
      debts,
      debtsMap,
      addDebt,
      getDebtsByClient,
      loadDebtsByClient,
      loadDebtsByClients,
      setDebts,
      clearDebts,
    }),
    [debts, debtsMap, addDebt, getDebtsByClient, loadDebtsByClient, loadDebtsByClients, clearDebts],
  );

  return (
    <DebtsContext.Provider value={value}>
      {children}
    </DebtsContext.Provider>
  );
};