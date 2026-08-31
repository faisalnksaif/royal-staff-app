import api from "./apiClient"
import type { FeedbackQuestion, FeedbackRequest } from "../types"

async function getQuestions(): Promise<{ success: boolean; data: FeedbackQuestion[] }> {
  const { data } = await api.http.request({
    path: "/feedback/questions",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: FeedbackQuestion[] }
}

async function createQuestion(payload: { text: string; order?: number }): Promise<{
  success: boolean
  data: FeedbackQuestion
}> {
  const { data } = await api.http.request({
    path: "/feedback/questions",
    method: "POST",
    body: payload,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: FeedbackQuestion }
}

async function updateQuestion(
  id: string,
  payload: { text?: string; isActive?: boolean; order?: number }
): Promise<{ success: boolean; data: FeedbackQuestion }> {
  const { data } = await api.http.request({
    path: `/feedback/questions/${id}`,
    method: "PATCH",
    body: payload,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: FeedbackQuestion }
}

async function createFeedbackRequest(ledgerId: number): Promise<{
  success: boolean
  data: { token: string; expiresAt: string }
}> {
  const { data } = await api.http.request({
    path: "/feedback/requests",
    method: "POST",
    body: { ledgerId },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { token: string; expiresAt: string } }
}

async function getStaffFeedbackRequests(userId: number): Promise<{
  success: boolean
  data: FeedbackRequest[]
}> {
  const { data } = await api.http.request({
    path: `/feedback/staff/${userId}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: FeedbackRequest[] }
}

async function getAllFeedbackRequests(params: {
  page?: number
  limit?: number
  status?: "pending" | "completed" | "expired"
  staffId?: number
  ledgerId?: number
} = {}): Promise<{
  success: boolean
  pagination: { page: number; limit: number; total: number; pages: number }
  data: FeedbackRequest[]
}> {
  const qs = new URLSearchParams()
  if (params.page != null) qs.set("page", String(params.page))
  if (params.limit != null) qs.set("limit", String(params.limit))
  if (params.status) qs.set("status", params.status)
  if (params.staffId != null) qs.set("staffId", String(params.staffId))
  if (params.ledgerId != null) qs.set("ledgerId", String(params.ledgerId))
  const query = qs.toString()
  const { data } = await api.http.request({
    path: `/feedback/requests${query ? `?${query}` : ""}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as {
    success: boolean
    pagination: { page: number; limit: number; total: number; pages: number }
    data: FeedbackRequest[]
  }
}

async function getFlaggedFeedback(): Promise<{ success: boolean; data: FeedbackRequest[] }> {
  const { data } = await api.http.request({
    path: "/feedback/flagged",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: FeedbackRequest[] }
}

async function getFeedbackByToken(token: string): Promise<{
  success: boolean
  data: {
    status: "pending" | "completed" | "expired"
    customerName: string
    questions: { questionId: string; text: string }[]
  }
}> {
  const { data } = await api.http.request({
    path: `/feedback/${token}`,
    method: "GET",
    secure: false,
    format: "json",
  })
  return data as {
    success: boolean
    data: {
      status: "pending" | "completed" | "expired"
      customerName: string
      questions: { questionId: string; text: string }[]
    }
  }
}

async function submitFeedback(
  token: string,
  payload: { answers: { questionId: string; answer: boolean }[]; deviceFingerprint?: string }
): Promise<{ success: boolean; data: { status: string } }> {
  const { data } = await api.http.request({
    path: `/feedback/${token}`,
    method: "POST",
    body: payload,
    secure: false,
    format: "json",
  })
  return data as { success: boolean; data: { status: string } }
}

export const feedbackService = {
  getQuestions,
  createQuestion,
  updateQuestion,
  createFeedbackRequest,
  getStaffFeedbackRequests,
  getAllFeedbackRequests,
  getFlaggedFeedback,
  getFeedbackByToken,
  submitFeedback,
}
