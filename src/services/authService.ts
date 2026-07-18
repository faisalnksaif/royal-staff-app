import api, { setAuthToken } from "./apiClient"
import type { UserResponse } from "./generated/Api"

async function login(
  email: string,
  password: string
): Promise<{ user: UserResponse; token: string }> {
  const { data } = await api.authentication.loginCreate({ email, password })

  if (!data.token || !data.data) {
    throw new Error(data.message ?? "Login failed")
  }

  setAuthToken(data.token)
  return { user: data.data, token: data.token }
}

async function register(
  email: string,
  password: string,
  name: string
): Promise<{ user: UserResponse; token: string }> {
  await api.authentication.registerCreate({ email, password, name })
  return login(email, password)
}

async function logout(): Promise<void> {
  setAuthToken(null)
}

async function getMe(): Promise<UserResponse | null> {
  try {
    const { data } = await api.authentication.getAuthentication()
    return data.data ?? null
  } catch {
    return null
  }
}

async function savePushToken(expoPushToken: string): Promise<void> {
  await api.http.request({
    path: "/auth/push-token",
    method: "PUT",
    secure: true,
    format: "json",
    body: { expoPushToken },
  })
}

export const authService = { login, register, logout, getMe, savePushToken }
