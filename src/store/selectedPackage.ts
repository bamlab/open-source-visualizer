import { create } from 'zustand';

interface SelectedPackageStore {
  selectedPackage: string | null;
  toggle: (name: string) => void;
}

export const useSelectedPackage = create<SelectedPackageStore>((set) => ({
  selectedPackage: null,
  toggle: (name) =>
    set((state) => ({
      selectedPackage: state.selectedPackage === name ? null : name,
    })),
}));
