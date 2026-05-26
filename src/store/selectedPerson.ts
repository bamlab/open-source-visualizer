import { create } from 'zustand';

interface SelectedPersonStore {
  selectedPerson: string | null;
  toggle: (login: string) => void;
  clear: () => void;
}

export const useSelectedPerson = create<SelectedPersonStore>((set) => ({
  selectedPerson: null,
  toggle: (login) =>
    set((state) => ({
      selectedPerson: state.selectedPerson === login ? null : login,
    })),
  clear: () => set({ selectedPerson: null }),
}));
