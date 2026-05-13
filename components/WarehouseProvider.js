'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { LanguageProvider } from '@/components/LanguageProvider';

const WarehouseContext = createContext();

export function WarehouseProvider({ children }) {
  const [warehouses, setWarehouses] = useState([]);
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      const warehouseArray = Array.isArray(data) ? data : [];
      setWarehouses(warehouseArray);
      
      const savedId = localStorage.getItem('activeWarehouseId');
      if (savedId && warehouseArray.find(w => w._id === savedId)) {
        setActiveWarehouse(warehouseArray.find(w => w._id === savedId));
      } else if (warehouseArray.length > 0) {
        setActiveWarehouse(warehouseArray[0]);
        localStorage.setItem('activeWarehouseId', warehouseArray[0]._id);
      } else {
        setActiveWarehouse(null);
        localStorage.removeItem('activeWarehouseId');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const selectWarehouse = (id) => {
    const w = warehouses.find(w => w._id === id);
    if (w) {
      setActiveWarehouse(w);
      localStorage.setItem('activeWarehouseId', w._id);
    }
  };

  return (
    <LanguageProvider>
      <WarehouseContext.Provider value={{ warehouses, activeWarehouse, selectWarehouse, loading, fetchWarehouses }}>
        {children}
      </WarehouseContext.Provider>
    </LanguageProvider>
  );
}

export const useWarehouse = () => useContext(WarehouseContext);
