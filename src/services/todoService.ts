import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { TodoListResponse, TodoResponse, TodoStatus } from "../types"

interface CreateTodoPayload {
  title: string
  notes?: string
  plannedFor?: string
}

interface UpdateTodoPayload {
  title?: string
  notes?: string | null
  plannedFor?: string | null
}

async function getTodos(
  filters?: { status?: TodoStatus; plannedFor?: string; staffId?: number }
): Promise<TodoListResponse> {
  const params = new URLSearchParams()
  if (filters?.staffId != null) params.set("staffId", String(filters.staffId))
  if (filters?.status) params.set("status", filters.status)
  if (filters?.plannedFor) params.set("plannedFor", filters.plannedFor)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const { data } = await api.http.request<TodoListResponse>({
    path: `/todos${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function createTodo(payload: CreateTodoPayload): Promise<TodoResponse> {
  const { data } = await api.http.request<{ success: boolean; data: TodoResponse }>({
    path: "/todos",
    method: "POST",
    body: payload,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data.data
}

async function updateTodo(id: string, updates: UpdateTodoPayload): Promise<TodoResponse> {
  const { data } = await api.http.request<{ success: boolean; data: TodoResponse }>({
    path: `/todos/${id}`,
    method: "PUT",
    body: updates,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data.data
}

async function completeTodo(id: string, status: "done" | "cancelled", actionNote?: string): Promise<TodoResponse> {
  const { data } = await api.http.request<{ success: boolean; data: TodoResponse }>({
    path: `/todos/${id}/complete`,
    method: "POST",
    body: { status, actionNote },
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data.data
}

async function deleteTodo(id: string): Promise<{ success: boolean }> {
  const { data } = await api.http.request<{ success: boolean }>({
    path: `/todos/${id}`,
    method: "DELETE",
    secure: true,
    format: "json",
  })
  return data
}

export const todoService = { getTodos, createTodo, updateTodo, completeTodo, deleteTodo }
