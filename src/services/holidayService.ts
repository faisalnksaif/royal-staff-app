import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { HolidayListResponse, HolidayResponse } from "../types"

interface HolidayInput {
  date: string
  name: string
  notes?: string | null
}

interface HolidayRange {
  from?: string
  to?: string
}

async function getHolidays(range: HolidayRange = {}): Promise<HolidayListResponse> {
  const { data } = await api.http.request<HolidayListResponse>({
    path: "/holidays",
    method: "GET",
    query: range,
    secure: true,
    format: "json",
  })
  return data
}

async function createHoliday(input: HolidayInput): Promise<HolidayResponse> {
  const { data } = await api.http.request<{ success: boolean; data: HolidayResponse }>({
    path: "/holidays",
    method: "POST",
    body: input,
    secure: true,
    type: ContentType.Json,
    format: "json",
  })
  return data.data
}

async function updateHoliday(id: string, input: Partial<HolidayInput>): Promise<HolidayResponse> {
  const { data } = await api.http.request<{ success: boolean; data: HolidayResponse }>({
    path: `/holidays/${id}`,
    method: "PATCH",
    body: input,
    secure: true,
    type: ContentType.Json,
    format: "json",
  })
  return data.data
}

async function deleteHoliday(id: string): Promise<HolidayResponse> {
  const { data } = await api.http.request<{ success: boolean; data: HolidayResponse }>({
    path: `/holidays/${id}`,
    method: "DELETE",
    secure: true,
    format: "json",
  })
  return data.data
}

export const holidayService = { getHolidays, createHoliday, updateHoliday, deleteHoliday }
