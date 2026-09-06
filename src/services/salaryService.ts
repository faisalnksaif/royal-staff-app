import api from "./apiClient"
import type { SalaryStructure, SalaryStructureResponse, Payslip, SalaryAdvance, SalaryAdvanceStatus, GenerateAllPayrollResult } from "../types"

interface ProposeStructurePayload {
  staffId: number
  basicPay: number
  incentives?: number
  effectiveFrom: string
}

async function proposeStructure(payload: ProposeStructurePayload): Promise<{ success: boolean; data: SalaryStructure }> {
  const { data } = await api.http.request({
    path: "/salary/structure/propose",
    method: "POST",
    body: payload,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryStructure }
}

async function approveStructure(structureId: string): Promise<{ success: boolean; data: SalaryStructure }> {
  const { data } = await api.http.request({
    path: `/salary/structure/${structureId}/approve`,
    method: "PUT",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryStructure }
}

async function rejectStructure(structureId: string, rejectionReason: string): Promise<{ success: boolean; data: SalaryStructure }> {
  const { data } = await api.http.request({
    path: `/salary/structure/${structureId}/reject`,
    method: "PUT",
    body: { rejectionReason },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryStructure }
}

async function getAllStructures(): Promise<{ success: boolean; data: SalaryStructure[] }> {
  const { data } = await api.http.request({
    path: "/salary/structure",
    method: "GET",
    secure: true,
    format: "json",
  })
  const body = data as { structures?: Array<Record<string, any>>; data?: { structures?: Array<Record<string, any>> } }
  const raw = body.structures ?? body.data?.structures ?? []
  return {
    success: true,
    data: raw.map((s) => ({ ...s, id: s.id ?? s._id })) as SalaryStructure[],
  }
}

async function getStructure(staffId: number): Promise<{ success: boolean; data: SalaryStructureResponse }> {
  const { data } = await api.http.request({
    path: `/salary/structure/${staffId}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryStructureResponse }
}

async function getStructureHistory(staffId: number): Promise<{ success: boolean; data: SalaryStructure[] }> {
  const { data } = await api.http.request({
    path: `/salary/structure/${staffId}/history`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryStructure[] }
}

async function generatePayroll(staffId: number, month: number, year: number): Promise<{ success: boolean; data: Payslip }> {
  const { data } = await api.http.request({
    path: "/salary/payroll/generate",
    method: "POST",
    body: { staffId, month, year },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: Payslip }
}

async function generateAllPayroll(month: number, year: number): Promise<{ success: boolean; data: GenerateAllPayrollResult }> {
  const { data } = await api.http.request({
    path: "/salary/payroll/generate-all",
    method: "POST",
    body: { month, year },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: GenerateAllPayrollResult }
}

function unwrapPayslips(data: unknown): Payslip[] {
  const body = data as { payslips?: Array<Record<string, any>>; data?: { payslips?: Array<Record<string, any>> } | Array<Record<string, any>> }
  const raw = Array.isArray(body.data) ? body.data : body.payslips ?? (body.data as any)?.payslips ?? []
  return raw.map((p: Record<string, any>) => ({ ...p, id: p.id ?? p._id })) as Payslip[]
}

async function getMyPayslips(): Promise<{ success: boolean; data: Payslip[] }> {
  const { data } = await api.http.request({
    path: "/salary/payslips/my",
    method: "GET",
    secure: true,
    format: "json",
  })
  return { success: true, data: unwrapPayslips(data) }
}

async function getAllPayslips(month?: number, year?: number): Promise<{ success: boolean; data: Payslip[] }> {
  const params = new URLSearchParams()
  if (month != null) params.set("month", String(month))
  if (year != null) params.set("year", String(year))
  const qs = params.toString() ? `?${params.toString()}` : ""
  const { data } = await api.http.request({
    path: `/salary/payslips${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return { success: true, data: unwrapPayslips(data) }
}

async function getPayslips(staffId: number): Promise<{ success: boolean; data: Payslip[] }> {
  const { data } = await api.http.request({
    path: `/salary/payslips/${staffId}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return { success: true, data: unwrapPayslips(data) }
}

async function getAllAdvances(filters?: { status?: SalaryAdvanceStatus; month?: number; year?: number }): Promise<{ success: boolean; data: SalaryAdvance[] }> {
  const params = new URLSearchParams()
  if (filters?.status) params.set("status", filters.status)
  if (filters?.month != null) params.set("month", String(filters.month))
  if (filters?.year != null) params.set("year", String(filters.year))
  const qs = params.toString() ? `?${params.toString()}` : ""
  const { data } = await api.http.request({
    path: `/salary/advance${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  const body = data as { advances?: Array<Record<string, any>>; data?: { advances?: Array<Record<string, any>> } }
  const raw = body.advances ?? body.data?.advances ?? []
  return {
    success: true,
    data: raw.map((a) => ({ ...a, id: a.id ?? a._id })) as SalaryAdvance[],
  }
}

async function requestAdvance(staffId?: number): Promise<{ success: boolean; data: SalaryAdvance }> {
  const { data } = await api.http.request({
    path: "/salary/advance/request",
    method: "POST",
    body: staffId != null ? { staffId } : {},
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryAdvance }
}

async function approveAdvance(advanceId: string): Promise<{ success: boolean; data: SalaryAdvance }> {
  const { data } = await api.http.request({
    path: `/salary/advance/${advanceId}/approve`,
    method: "PUT",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryAdvance }
}

async function rejectAdvance(advanceId: string, rejectionReason: string): Promise<{ success: boolean; data: SalaryAdvance }> {
  const { data } = await api.http.request({
    path: `/salary/advance/${advanceId}/reject`,
    method: "PUT",
    body: { rejectionReason },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryAdvance }
}

async function getMyAdvances(): Promise<{ success: boolean; data: SalaryAdvance[] }> {
  const { data } = await api.http.request({
    path: "/salary/advance/my",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryAdvance[] }
}

async function getAdvances(staffId: number): Promise<{ success: boolean; data: SalaryAdvance[] }> {
  const { data } = await api.http.request({
    path: `/salary/advance/${staffId}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: SalaryAdvance[] }
}

export const salaryService = {
  proposeStructure,
  approveStructure,
  rejectStructure,
  getAllStructures,
  getStructure,
  getStructureHistory,
  generatePayroll,
  generateAllPayroll,
  getMyPayslips,
  getAllPayslips,
  getPayslips,
  getAllAdvances,
  requestAdvance,
  approveAdvance,
  rejectAdvance,
  getMyAdvances,
  getAdvances,
}
