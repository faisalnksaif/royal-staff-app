import api from "./apiClient"
import type { NotificationsResponse, UnreadCountResponse } from "../types"

async function getNotifications(
  userId: number | string,
  params: { page?: number; limit?: number; unread_only?: boolean } = {}
): Promise<NotificationsResponse> {
  const { page = 1, limit = 30, unread_only } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (unread_only) query.set("unread_only", "true")
  const { data } = await api.http.request<NotificationsResponse>({
    path: `/notifications/staff/${userId}?${query.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getUnreadCount(userId: number | string): Promise<number> {
  const { data } = await api.http.request<UnreadCountResponse>({
    path: `/notifications/staff/${userId}/unread-count`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data.data.unread_count
}

async function markAllRead(userId: number | string): Promise<void> {
  await api.http.request({
    path: `/notifications/staff/${userId}/read-all`,
    method: "PUT",
    secure: true,
    format: "json",
  })
}

async function markRead(notificationId: string): Promise<void> {
  await api.http.request({
    path: `/notifications/${notificationId}/read`,
    method: "PUT",
    secure: true,
    format: "json",
  })
}

export const notificationService = { getNotifications, getUnreadCount, markAllRead, markRead }
