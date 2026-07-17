import { create } from "zustand"

type TabType = "bills" | "followups"

interface UIState {
  pendingCustomerTab: TabType | null
  setPendingCustomerTab: (tab: TabType | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  pendingCustomerTab: null,
  setPendingCustomerTab: (tab) => set({ pendingCustomerTab: tab }),
}))
