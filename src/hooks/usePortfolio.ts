import { useState, useEffect } from 'react';
import type { PortfolioWatch } from '@/types/watch';
import { MOCK_PORTFOLIO_SEED } from '@/data/mockData';

const STORAGE_KEY = 'chrono_portfolio';

function loadFromStorage(): PortfolioWatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return MOCK_PORTFOLIO_SEED;
}

export function usePortfolio() {
  const [items, setItems] = useState<PortfolioWatch[]>(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (item: Omit<PortfolioWatch, 'id'>) => {
    const newItem: PortfolioWatch = { ...item, id: `port-${Date.now()}` };
    setItems(prev => [newItem, ...prev]);
  };

  const update = (id: string, changes: Partial<PortfolioWatch>) => {
    setItems(prev => prev.map(w => w.id === id ? { ...w, ...changes } : w));
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(w => w.id !== id));
  };

  return { items, add, update, remove };
}
