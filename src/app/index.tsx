import { Redirect } from "expo-router"
import useAuthStore from "../stores/useAuthStore"

export default function Index() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Redirect href="/(auth)/login" />
  if (user.role === "superAdmin" || user.role === "manager") return <Redirect href="/(admin)" />
  if (user.role === "hr") return <Redirect href="/(admin)/attendance" />
  if (user.role === "scanner") return <Redirect href="/scanner" />
  return <Redirect href="/(tabs)" />
}
