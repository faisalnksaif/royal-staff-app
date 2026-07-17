import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { authService } from "../services/authService"
import { setAuthToken } from "../services/apiClient"
import type { UserResponse } from "../services/generated/Api"

interface AuthState {
  user: UserResponse | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  clearAuth: () => void
  clearError: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await authService.login(email, password)
          setAuthToken(token)
          set({ user, token, isLoading: false })
        } catch (e) {
          set({ error: (e as Error).message, isLoading: false })
        }
      },
      register: async (email, password, name) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await authService.register(email, password, name)
          setAuthToken(token)
          set({ user, token, isLoading: false })
        } catch (e) {
          set({ error: (e as Error).message, isLoading: false })
        }
      },
      logout: async () => {
        set({ isLoading: true })
        try {
          await authService.logout()
        } finally {
          setAuthToken(null)
          set({ user: null, token: null, isLoading: false, error: null })
        }
      },
      clearAuth: () => {
        setAuthToken(null)
        set({ user: null, token: null, isLoading: false, error: null })
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token)
      },
    }
  )
)

export default useAuthStore
