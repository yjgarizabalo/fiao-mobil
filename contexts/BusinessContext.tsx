import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from "../contexts/AuthContext";
import api from '../utils/api';


export interface businesses {
  id: string;
  name: string;
}

interface BusinessContextType {
  businesses: businesses[];
  addBusiness: (businessData: Omit<businesses, 'id'>) => void;
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
          setBusinesses(res.data);
        } catch (error) {
          console.error('Error loading businesses:', error);
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
