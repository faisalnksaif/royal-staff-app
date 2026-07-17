import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import api from "../services/apiClient"
import type { StaffResponse } from "../services/generated/Api"

interface UserState {
  staff: StaffResponse[]
  total: number
  isLoading: boolean
  error: string | null
  fetchStaff: () => Promise<void>
  fetchStaffById: (id: number) => Promise<StaffResponse | null>
  clearError: () => void
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      staff: [],
      total: 0,
      isLoading: false,
      error: null,
      fetchStaff: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.staff.staffList()
          set({
            staff: data.data ?? [],
            total: data.count ?? 0,
            isLoading: false,
          })
        } catch (e) {
          set({ error: (e as Error).message, isLoading: false })
        }
      },
      fetchStaffById: async (id) => {
        try {
          const { data } = await api.staff.staffDetail(id)
          return data.data ?? null
        } catch (e) {
          set({ error: (e as Error).message })
          return null
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ staff: state.staff, total: state.total }),
    }
  )
)

export default useUserStore
