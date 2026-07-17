import api from "./apiClient"
import type { StaffFollowupsResponse, CreateFollowupPayload } from "../types"

async function getStaffFollowups(
  staffId: number | string,
  limit = 100
): Promise<StaffFollowupsResponse> {
  const { data } = await api.http.request<StaffFollowupsResponse>({
    path: `/followups/staff/${staffId}?limit=${limit}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function createFollowup(payload: CreateFollowupPayload): Promise<void> {
  await api.followUps.followupsCreate(payload)
}

export const followupService = { getStaffFollowups, createFollowup }
