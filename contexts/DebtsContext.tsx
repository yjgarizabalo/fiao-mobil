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
  description: string;
  dueDate: string;
}

interface DebtsContextType {
  debts: Debt[];
  addDebt: (debt: AddDebts) => Promise<void>;
  getDebtsByClient: (clientId: string, businessId: string) => Debt[];
  loadDebtsByClient: (clientId: string, businessId: string) => Promise<void>;
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

  const addDebt = useCallback(async (debtData: AddDebts): Promise<void> => {
    try {
      const { businessId, ...body } = debtData;

      await api.post("/debts", body, {
        headers: {
          "x-business-id": businessId,
        },
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

  const clearDebts = useCallback(() => {
    setDebts([]);
  }, []);

  const value = useMemo(
    () => ({
      debts,
      addDebt,
      getDebtsByClient,
      loadDebtsByClient,
      setDebts,
      clearDebts,
    }),
    [debts, addDebt, getDebtsByClient, loadDebtsByClient, clearDebts],
  );

  return (
    <DebtsContext.Provider value={value}>
      {children}
    </DebtsContext.Provider>
  );
};