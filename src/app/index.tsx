import { Redirect } from "expo-router"
import useAuthStore from "../stores/useAuthStore"

export default function Index() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Redirect href="/(auth)/login" />
  if (user.role === "superAdmin") return <Redirect href="/(super-admin)" />
  if (user.role === "manager") return <Redirect href="/(manager)" />
  return <Redirect href="/(tabs)" />
}
