import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export interface Client {
  id: string;
  name: string;
  //lastName: string;
  documentType: string;
  documentNumber: string;
  //email: string;
  phone: string;
  //password: string;
  status: 'al_dia' | 'debe';
  balance: number;
}

interface ClientContextType {
  clients: Client[];
  addClient: (businessId: string, client: Omit<Client, 'id' | 'status' | 'balance'>) => void;
  getClient: (id: string) => Client | undefined | Promise<Client>;
  loadClientsByBusiness: (businessId: string) => Promise<void>;
  clearClients: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};

export const ClientProvider = ({ children }: { children: ReactNode }) => {
   const [clients, setClients] = useState<Client[]>([]);
  const { user } = useAuth();


const addClient = async (
  businessId: string,
  clientData: Omit<Client, 'id' | 'status' | 'balance'>
) => {
  try {
    const response = await api.post(
      `/business/${businessId}/debtors`,
      clientData
    );

    setClients(prev => [...prev, response.data]);
  } catch (error) {
    console.error('Error creating client:', error);
  }
};


  const getClient =  async (id: string) => {
   const local = clients.find(c => c.id === id);
  if (local) return local;

  const res = await api.get(`/debtors/${id}`);
  return res.data;
  };

  const loadClientsByBusiness = async (businessId: string) => {
  try {
    const res = await api.get(`/business/${businessId}/debtors`);
    setClients(res.data);
  } catch (error) {
    console.error('Error loading clients:', error);
  }
};
const clearClients = () => setClients([]);

  return (
    <ClientContext.Provider value={{ clients, addClient, getClient, loadClientsByBusiness, clearClients }}>
      {children}
    </ClientContext.Provider>
  );
};