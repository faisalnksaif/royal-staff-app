import { AxiosError, InternalAxiosRequestConfig } from "axios"
import { Api, HttpClient } from "./generated/Api"
import { API_BASE_URL } from "../constants/config"
import type { AppError } from "../types"

let authToken: string | null = null
let unauthorizedHandler: (() => void) | null = null
let handlingUnauthorized = false

export function setAuthToken(token: string | null): void {
  authToken = token
}

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

// ─── HttpClient instance ──────────────────────────────────────────────────────
export const httpClient = new HttpClient({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
})

// ─── Request interceptor: sole place that attaches the token ─────────────────
httpClient.instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (authToken) {
      config.headers["Authorization"] = `Bearer ${authToken}`
    }
    return config
  }
)

// ─── Response interceptor: normalise errors ──────────────────────────────────
httpClient.instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string; success?: boolean }>) => {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 401 && !handlingUnauthorized) {
      handlingUnauthorized = true
      setAuthToken(null)
      unauthorizedHandler?.()
      setTimeout(() => { handlingUnauthorized = false }, 3000)
    }

    const message =
      data?.error ??
      data?.message ??
      (status === 401 ? "Session expired — please log in again" :
       status === 403 ? "You don't have permission to do that" :
       status === 404 ? "Resource not found" :
       status === 500 ? "Server error — try again later" :
       error.message ??
       "An unexpected error occurred")

    const appError: AppError = {
      code: String(status ?? "NETWORK_ERROR"),
      message,
    }

    return Promise.reject(appError)
  }
)

// ─── Single shared Api instance ──────────────────────────────────────────────
const api = new Api(httpClient)

export default api
