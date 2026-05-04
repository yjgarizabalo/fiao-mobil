import api from "@/utils/api";
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo
} from "react";

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  method: string;
  type: string;
  note: string;
  createdAt?: string;
  // Presente solo en pagos globales sintéticos — monto total del grupo
  totalAmount?: number;
  isGlobalSummary?: boolean;
}

export interface AddPayments {
  debtId: string;
  businessId: string;
  amount: number;
  method: string;
  type: string;
  note: string;
}

export interface AddGlobalPayment {
  debtorId: string;
  businessId: string;
  amount: number;
  method: string;
  note: string;
}

export interface GlobalPaymentResult {
  totalAmount: number;
}

interface PaymentsContextType {
  payments: Payment[];
  addPayment: (payment: AddPayments) => Promise<void>;
  addGlobalPayment: (payment: AddGlobalPayment) => Promise<GlobalPaymentResult>;
  addGlobalPaymentSummary: (totalAmount: number, method: string, note: string) => void;
  loadAllPaymentsForClient: (debtIds: string[], businessId: string) => Promise<void>;
  setPayments: Dispatch<SetStateAction<Payment[]>>;
  clearPayments: () => void;
}

const PaymentsContext = createContext<PaymentsContextType | undefined>(undefined);

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error("usePayments must be used within a PaymentProvider");
  }
  return context;
};

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [payments, setPayments] = React.useState<Payment[]>([]);

  const addPayment = useCallback(async (paymentData: AddPayments): Promise<void> => {
    try {
      await api.post("/payments", {
        debtId: paymentData.debtId,
        amount: paymentData.amount,
        method: paymentData.method,
        type: paymentData.type,
        note: paymentData.note,
      }, {
        headers: { "x-business-id": paymentData.businessId },
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }, []);

  /**
   * Registers a single global payment against the client's total balance.
   * POST /payments/global
   */
  const addGlobalPayment = useCallback(async (paymentData: AddGlobalPayment): Promise<GlobalPaymentResult> => {
    try {
      const response = await api.post("/payments/global", {
        debtorId: paymentData.debtorId,
        amount: paymentData.amount,
        method: paymentData.method,
        note: paymentData.note,
      }, {
        headers: { "x-business-id": paymentData.businessId },
      });
      // Retorna group.totalAmount según la respuesta del servicio
      const totalAmount = response.data?.group?.totalAmount ?? paymentData.amount;
      return { totalAmount };
    } catch (error) {
      console.error("Error creating global payment:", error);
      throw error;
    }
  }, []);

  /**
   * Inserta un pago sintético de resumen global en la lista local.
   * Se llama desde clientDetail justo después de addGlobalPayment para
   * mostrar el totalAmount del grupo en el extracto de movimientos,
   * antes de que loadAllPaymentsForClient sobrescriba la lista con
   * los pagos individuales (appliedAmount por deuda).
   */
  const addGlobalPaymentSummary = useCallback(
    (totalAmount: number, method: string, note: string) => {
      const summary: Payment = {
        id: `global-summary-${Date.now()}`,
        debtId: "",
        amount: totalAmount,
        totalAmount,
        isGlobalSummary: true,
        method,
        type: "PAYMENT",
        note,
        createdAt: new Date().toISOString(),
      };
      setPayments((prev) => [summary, ...prev]);
    },
    []
  );

  const loadAllPaymentsForClient = useCallback(
    async (debtIds: string[], businessId: string) => {
      if (debtIds.length === 0) return;
      try {
        const results = await Promise.allSettled(
          debtIds.map((debtId) =>
            api.get(`/debts/${debtId}/payments`, {
              params: { page: 1, limit: 100, type: "PAYMENT" },
              headers: { "x-business-id": businessId },
            })
          )
        );

        const allPayments: Payment[] = results.flatMap((result, idx) => {
          if (result.status === "fulfilled") {
            const data = result.value.data?.data ?? result.value.data;
            return Array.isArray(data) ? data : [];
          }
          console.error(`Failed to load payments for debt ${debtIds[idx]}`);
          return [];
        });

        setPayments(allPayments);
      } catch (error) {
        console.error("Error loading payments:", error);
      }
    },
    []
  );

  const clearPayments = useCallback(() => {
    setPayments([]);
  }, []);

  const value = useMemo(
    () => ({
      payments,
      addPayment,
      addGlobalPayment,
      addGlobalPaymentSummary,
      setPayments,
      loadAllPaymentsForClient,
      clearPayments,
    }),
    [payments, addPayment, addGlobalPayment, addGlobalPaymentSummary, loadAllPaymentsForClient, clearPayments],
  );

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};