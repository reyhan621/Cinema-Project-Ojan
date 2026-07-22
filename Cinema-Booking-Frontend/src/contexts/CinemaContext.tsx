import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cinemaService } from '@/services/cinemaService';
import type { ICinema } from '@/types';

const STORAGE_KEY = 'cinelux_selected_cinema_id';

interface CinemaContextType {
  cinemas: ICinema[];
  selectedCinemaId: string;
  selectedCinema: ICinema | null;
  setSelectedCinemaId: (id: string) => void;
  loading: boolean;
}

const CinemaContext = createContext<CinemaContextType | undefined>(undefined);

export function CinemaProvider({ children }: { children: React.ReactNode }) {
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [selectedCinemaId, setSelectedCinemaIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const data = await cinemaService.getCinemas();
        setCinemas(data || []);

        if (selectedCinemaId) {
          const exists = data?.some((c) => c._id === selectedCinemaId);
          if (!exists) {
            setSelectedCinemaIdState('');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        setCinemas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCinemas();
  }, []);

  const setSelectedCinemaId = useCallback((id: string) => {
    setSelectedCinemaIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const selectedCinema = cinemas.find((c) => c._id === selectedCinemaId) || null;

  return (
    <CinemaContext.Provider
      value={{
        cinemas,
        selectedCinemaId,
        selectedCinema,
        setSelectedCinemaId,
        loading,
      }}
    >
      {children}
    </CinemaContext.Provider>
  );
}

export function useCinema() {
  const context = useContext(CinemaContext);
  if (context === undefined) {
    throw new Error('useCinema must be used within a CinemaProvider');
  }
  return context;
}
