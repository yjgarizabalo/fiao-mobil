import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
  status: 'al_dia' | 'debe';
  balance: number;
}

interface ClientContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'status' | 'balance'>) => void;
  getClient: (id: string) => Client | undefined;
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
  const [clients, setClients] = useState<Client[]>([
    { id: '1', firstName: 'Juan', lastName: 'Pérez', documentType: 'CC', documentNumber: '12345678', email: 'juan@example.com', phone: '3001234567', password: '123456', status: 'al_dia', balance: 0 },
    { id: '2', firstName: 'María', lastName: 'García', documentType: 'CC', documentNumber: '87654321', email: 'maria@example.com', phone: '3007654321', password: '123456', status: 'debe', balance: 45000 },
  ]);

  const addClient = (clientData: Omit<Client, 'id' | 'status' | 'balance'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      status: 'al_dia',
      balance: 0,
    };
    setClients(prev => [...prev, newClient]);
  };

  const getClient = (id: string) => {
    return clients.find(client => client.id === id);
  };

  return (
    <ClientContext.Provider value={{ clients, addClient, getClient }}>
      {children}
    </ClientContext.Provider>
  );
};