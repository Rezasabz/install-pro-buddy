import React, { createContext, useContext, useState, useCallback } from 'react';

interface DataContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  refreshPartners: () => void;
  refreshSales: () => void;
  refreshCustomers: () => void;
  refreshPhones: () => void;
  refreshInstallments: () => void;
  refreshDashboard: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const refreshPartners = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshPartners'));
  }, []);

  const refreshSales = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshSales'));
  }, []);

  const refreshCustomers = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshCustomers'));
  }, []);

  const refreshPhones = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshPhones'));
  }, []);

  const refreshInstallments = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshInstallments'));
  }, []);

  const refreshDashboard = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshDashboard'));
  }, []);

  return (
    <DataContext.Provider value={{
      refreshTrigger,
      triggerRefresh,
      refreshPartners,
      refreshSales,
      refreshCustomers,
      refreshPhones,
      refreshInstallments,
      refreshDashboard,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}
