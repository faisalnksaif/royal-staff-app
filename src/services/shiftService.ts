import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { ShiftListResponse, ShiftResponse } from "../types"

async function getShifts(): Promise<ShiftListResponse> {
  const { data } = await api.http.request<ShiftListResponse>({
    path: "/shifts",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

interface ShiftInput {
  name: string
  startTime: string
  endTime1: string
  endTime2: string
}

async function createShift(input: ShiftInput): Promise<ShiftResponse> {
  const { data } = await api.http.request<{ success: boolean; data: ShiftResponse }>({
    path: "/shifts",
    method: "POST",
    body: input,
    secure: true,
    type: ContentType.Json,
    format: "json",
  })
  return data.data
}

async function updateShift(id: string, input: Partial<ShiftInput>): Promise<ShiftResponse> {
  const { data } = await api.http.request<{ success: boolean; data: ShiftResponse }>({
    path: `/shifts/${id}`,
    method: "PATCH",
    body: input,
    secure: true,
    type: ContentType.Json,
    format: "json",
  })
  return data.data
}

export const shiftService = { getShifts, createShift, updateShift }
