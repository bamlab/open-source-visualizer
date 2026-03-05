import { create } from 'zustand';

export type EcosystemFilter = 'all' | 'react-native' | 'flutter';

interface EcosystemFilterStore {
  filter: EcosystemFilter;
  setFilter: (filter: EcosystemFilter) => void;
}

export const useEcosystemFilter = create<EcosystemFilterStore>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
