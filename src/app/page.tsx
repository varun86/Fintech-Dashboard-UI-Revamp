'use client';

import { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { startSimulation, stopSimulation } from '@/lib/simulation';

export default function Home() {
  // Auto-start simulation on mount
  useEffect(() => {
    startSimulation();
    return () => {
      stopSimulation();
    };
  }, []);

  return <Dashboard />;
}
