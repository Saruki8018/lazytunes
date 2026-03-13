import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
}

interface UiStore {
  queueOpen: boolean;
  searchQuery: string;
  toasts: Toast[];
  toggleQueue: () => void;
  setSearchQuery: (q: string) => void;
  showToast: (message: string, durationMs?: number) => void;
  dismissToast: (id: number) => void;
}

let toastCounter = 0;

export const useUiStore = create<UiStore>((set, get) => ({
  queueOpen: false,
  searchQuery: "",
  toasts: [],

  toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  showToast: (message, durationMs = 3000) => {
    const id = ++toastCounter;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => get().dismissToast(id), durationMs);
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
