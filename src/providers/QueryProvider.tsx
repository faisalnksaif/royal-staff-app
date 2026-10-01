import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import useAuthStore from "../stores/useAuthStore"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
})

// Query keys carry no user identity (e.g. ["work", "my", {}]), so a cached
// result from one login is served to the next for up to staleTime - logging
// out as an admin and in as staff showed the admin's empty "My Work". Drop
// everything whenever the signed-in user changes (logout, 401, or a direct
// switch). Rehydration also fires this, but the cache is still empty then.
useAuthStore.subscribe((state, prev) => {
  if (state.user?.id !== prev.user?.id) queryClient.clear()
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
