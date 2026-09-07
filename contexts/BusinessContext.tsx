import React, { createContext, ReactNode, useContext, useState } from 'react';
import api from '../utils/api';

export interface businesses {
  id: string;
  name: string;
  address: string;
  currency?: string;
}

export interface BusinessPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BusinessContextType {
  businesses: businesses[];
  pagination: BusinessPaginationMeta | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  fetchBusinesses: (page?: number) => Promise<void>;
  loadMoreBusinesses: () => Promise<void>;
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
  const [pagination, setPagination] = useState<BusinessPaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchBusinesses = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get('/business', { params: { page, limit: 10 } });
      const raw = res.data;
      const list: businesses[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setBusinesses(list);
      if (raw?.meta) setPagination(raw.meta);
    } catch (error) {
      console.error('Error loading businesses:', error);
      setBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreBusinesses = async () => {
    if (!pagination || pagination.page >= pagination.totalPages || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const res = await api.get('/business', { params: { page: nextPage, limit: 10 } });
      const raw = res.data;
      const list: businesses[] = Array.isArray(raw?.data) ? raw.data : [];
      setBusinesses((prev) => [...prev, ...list]);
      if (raw?.meta) setPagination(raw.meta);
    } catch (error) {
      console.error('Error loading more businesses:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
    <BusinessContext.Provider value={{ businesses, pagination, isLoading, isLoadingMore, fetchBusinesses, loadMoreBusinesses, addBusiness, getBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
};