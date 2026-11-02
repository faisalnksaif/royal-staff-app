import { AxiosError, InternalAxiosRequestConfig } from "axios"
import { Api, HttpClient } from "./generated/Api"
import { API_BASE_URL } from "../constants/config"
import type { AppError } from "../types"

let authToken: string | null = null
let unauthorizedHandler: (() => void) | null = null
let tokenRefreshedHandler: ((token: string) => void) | null = null
let tokenRecoveryHandler: ((rejectedToken: string | null) => Promise<boolean>) | null = null
let handlingUnauthorized = false

/** The token's issued-at time in seconds, or 0 when it can't be read. */
function tokenIssuedAt(token: string): number {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return Number(JSON.parse(atob(payload)).iat) || 0
  } catch {
    return 0
  }
}

export function setAuthToken(token: string | null): void {
  authToken = token
}

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

export function setTokenRefreshedHandler(handler: (token: string) => void): void {
  tokenRefreshedHandler = handler
}

/**
 * Called on a 401 before logging out. Resolves true when it found a different,
 * newer token (another tab or window logged in or refreshed since this one
 * loaded) - the request is then retried with it instead of ending the session.
 */
export function setTokenRecoveryHandler(handler: (rejectedToken: string | null) => Promise<boolean>): void {
  tokenRecoveryHandler = handler
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
  (response) => {
    // Sliding session: the backend re-issues a day-old token on any authed
    // call. Only adopt it while still logged in, and only if it is newer than
    // the one held: a browser-cached response can replay an old, expired one.
    const refreshed = response.headers["x-refreshed-token"]
    if (
      typeof refreshed === "string" && refreshed && authToken &&
      tokenIssuedAt(refreshed) > tokenIssuedAt(authToken)
    ) {
      authToken = refreshed
      tokenRefreshedHandler?.(refreshed)
    }
    return response
  },
  async (error: AxiosError<{ message?: string; error?: string; success?: boolean }>) => {
    const status = error.response?.status
    let data = error.response?.data

    // A failed blob request (the Excel exports use format: "blob") delivers its
    // error body as a Blob, not parsed JSON - so data.error would be undefined
    // and every export failure would read as the generic fallback message.
    // Reading the blob back as text recovers the real server error.
    if (data instanceof Blob) {
      try {
        data = JSON.parse(await data.text())
      } catch {
        data = undefined
      }
    }

    // A 401 may only mean this tab is holding a stale token - recover the
    // current one from storage and retry once before treating it as a logout.
    const config = error.config as (InternalAxiosRequestConfig & { _authRetried?: boolean }) | undefined
    if (status === 401 && config && !config._authRetried && tokenRecoveryHandler) {
      const sent = String(config.headers?.["Authorization"] ?? "").replace(/^Bearer /, "") || null
      if (await tokenRecoveryHandler(sent) && authToken) {
        config._authRetried = true
        config.headers["Authorization"] = `Bearer ${authToken}`
        return httpClient.instance.request(config)
      }
    }

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
