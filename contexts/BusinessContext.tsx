import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from "../contexts/AuthContext";
import api from '../utils/api';


export interface businesses {
  id: string;
  name: string;
  address: string;
}

interface BusinessContextType {
  businesses: businesses[];
  addBusiness: (businessData: Omit<businesses, 'id'>) => Promise<void>;
  getBusiness: (id: string) => businesses | undefined;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const [businesses, setBusinesses] = useState<businesses[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchBusinesses = async () => {
      try {
        const res = await api.get(`/business`);

        // La API devuelve paginado: { data: [...], total: N, page: N, limit: N }
        // Normalizamos para soportar tanto array directo como objeto paginado
        const raw = res.data;
        const list: businesses[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];

        setBusinesses(list);
      } catch (error) {
        console.error('Error loading businesses:', error);
        setBusinesses([]);
      }
    };

    fetchBusinesses();
  }, [user]);

  const addBusiness = async (businessData: Omit<businesses, 'id'>) => {
    try {
      const response = await api.post('/business', businessData);
      setBusinesses((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    }
  };

  const getBusiness = (id: string) => {
    return businesses.find(business => business.id === id);
  };

  return (
    <BusinessContext.Provider value={{ businesses, addBusiness, getBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
};