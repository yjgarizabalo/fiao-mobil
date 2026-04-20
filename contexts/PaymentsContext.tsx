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

interface Payment {
  id: string,
  debtId: string,
  amount: number,
  method: string,
  type: string,
  note: string,
}

export interface AddPayments {
  debtId: string,
  businessId: string,
  amount: number,
  method: string,
  type: string,
  note: string,
}

interface PaymentsContextType {
  payments: Payment[]
  addPayment: (payment: AddPayments) => Promise<void>
  getPaymentsByClient: (clientId: string) => Payment[]
  loadPaymentsByClient: (clientId: string) => Promise<void>
  setPayments: Dispatch<SetStateAction<Payment[]>>
  clearPayments: () => void
}

const PaymentsContext = createContext<PaymentsContextType | undefined>(undefined);

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [payments, setPayments] = React.useState<Payment[]>([]);

  const addPayment = useCallback(async (paymentData: AddPayments): Promise<void> => {
    try {

      console.log("BODY enviado a /payments:", JSON.stringify(paymentData, null, 2));

      await api.post('/payments', paymentData,{
          headers: {
            'x-business-id': paymentData.businessId
          }
        });
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }, []);

 
  const getPaymentsByClient = useCallback(
    (clientId: string): Payment[] => {
      return payments.filter((payment) => payment.debtId === clientId);
    },
    [payments],
  );

  const loadPaymentsByClient = useCallback(async (clientId: string) => {
    try {
      const response = await api.get(`debts/${clientId}/payments`);
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  }, []);


  const clearPayments = useCallback(() => {
    setPayments([]);
  }, []);

  const value = useMemo(
  () => ({
    payments,
    addPayment,
    setPayments,
    getPaymentsByClient,
    loadPaymentsByClient,
    clearPayments
  }), [payments, addPayment, setPayments, getPaymentsByClient, loadPaymentsByClient, clearPayments]);

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
}