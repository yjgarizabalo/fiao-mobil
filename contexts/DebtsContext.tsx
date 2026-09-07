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

export interface DebtPayment {
  id: string;
  amount: string;
  paymentDate: string;
  method: string;
  type: string;
  note: string;
  createdAt: string;
}

export interface DebtWithPayments extends Debt {
  balance: string;
  status: "OPEN" | "PARTIAL" | "PAID";
  payments: DebtPayment[];
}

export type DebtsMap = Record<string, Debt[]>;

interface DebtsContextType {
  debts: DebtWithPayments[];
  debtsMap: DebtsMap;
  addDebt: (debt: AddDebts) => Promise<void>;
  getDebtsByClient: (clientId: string) => DebtWithPayments[];
  loadDebtsByClient: (clientId: string, businessId: string) => Promise<void>;
  loadDebtsWithPayments: (debtorId: string, businessId: string) => Promise<DebtWithPayments[]>;
  loadDebtsByClients: (clients: { id: string; businessId: string }[]) => Promise<void>;
  setDebts: Dispatch<SetStateAction<DebtWithPayments[]>>;
  clearDebts: () => void;
}

const DebtsContext = createContext<DebtsContextType | undefined>(undefined);

export const useDebts = () => {
  const context = useContext(DebtsContext);
  if (!context) throw new Error("useDebts must be used within a DebtsProvider");
  return context;
};

export const DebtsProvider = ({ children }: { children: ReactNode }) => {
  const [debts, setDebts] = useState<DebtWithPayments[]>([]);
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
    (clientId: string) => debts.filter((d) => d.debtorId === clientId),
    [debts]
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

  const loadDebtsWithPayments = useCallback(async (clientId: string, businessId: string): Promise<DebtWithPayments[]> => {
    try {
      const res = await api.get(`/debtors/${clientId}/debts`, {
        headers: { "x-business-id": businessId },
      });
      const data: DebtWithPayments[] = res.data?.data ?? res.data ?? [];
      setDebts(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error loading debts with payments:", error);
      setDebts([]);
      return [];
    }
  }, []);

  const loadDebtsByClients = useCallback(
    async (clients: { id: string; businessId: string }[]) => {
      if (!clients.length) { setDebtsMap({}); return; }
      const results = await Promise.allSettled(
        clients.map(({ id, businessId }) =>
          api.get(`/debtors/${id}/debts`, { headers: { "x-business-id": businessId } })
            .then((res) => ({
              clientId: id,
              debts: (() => { const d = res.data?.data ?? res.data; return Array.isArray(d) ? d : []; })(),
            }))
        )
      );
      const newEntries: DebtsMap = {};
      results.forEach((r) => { if (r.status === "fulfilled") newEntries[r.value.clientId] = r.value.debts; });
      setDebtsMap((prev) => ({ ...prev, ...newEntries }));
    },
    []
  );

  const clearDebts = useCallback(() => { setDebts([]); setDebtsMap({}); }, []);

  const value = useMemo(
    () => ({ debts, debtsMap, addDebt, getDebtsByClient, loadDebtsByClient, loadDebtsWithPayments, loadDebtsByClients, setDebts, clearDebts }),
    [debts, debtsMap, addDebt, getDebtsByClient, loadDebtsByClient, loadDebtsWithPayments, loadDebtsByClients, clearDebts]
  );

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>;
};
