import api from "./apiClient"
import type { Testimonial, TestimonialStats } from "../types"

async function submitTestimonial(payload: {
  revieweeStaffId: number
  message: string
}): Promise<{ success: boolean; data: Testimonial }> {
  const { data } = await api.http.request({
    path: "/testimonials",
    method: "POST",
    body: payload,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: Testimonial }
}

async function getReceivedTestimonials(staffId?: number): Promise<{
  success: boolean
  data: { revieweeUserId: number; stats: TestimonialStats; testimonials: Testimonial[] }
}> {
  const qs = staffId != null ? `?staffId=${staffId}` : ""
  const { data } = await api.http.request({
    path: `/testimonials/received${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as {
    success: boolean
    data: { revieweeUserId: number; stats: TestimonialStats; testimonials: Testimonial[] }
  }
}

async function getGivenTestimonials(): Promise<{
  success: boolean
  data: { reviewerUserId: number; count: number; testimonials: Testimonial[] }
}> {
  const { data } = await api.http.request({
    path: "/testimonials/given",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as {
    success: boolean
    data: { reviewerUserId: number; count: number; testimonials: Testimonial[] }
  }
}

async function getApprovedTestimonials(month?: string): Promise<{
  success: boolean
  data: { month: string; count: number; testimonials: Testimonial[] }
}> {
  const qs = month ? `?month=${month}` : ""
  const { data } = await api.http.request({
    path: `/testimonials/approved${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { month: string; count: number; testimonials: Testimonial[] } }
}

async function getPendingTestimonials(month?: string): Promise<{
  success: boolean
  data: { month: string; count: number; testimonials: Testimonial[] }
}> {
  const qs = month ? `?month=${month}` : ""
  const { data } = await api.http.request({
    path: `/testimonials/pending${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { month: string; count: number; testimonials: Testimonial[] } }
}

async function approveTestimonial(testimonialId: string): Promise<{ success: boolean; data: Testimonial }> {
  const { data } = await api.http.request({
    path: `/testimonials/${testimonialId}/approve`,
    method: "PUT",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: Testimonial }
}

async function rejectTestimonial(
  testimonialId: string,
  rejectionReason: string
): Promise<{ success: boolean; data: Testimonial }> {
  const { data } = await api.http.request({
    path: `/testimonials/${testimonialId}/reject`,
    method: "PUT",
    body: { rejectionReason },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: Testimonial }
}

export const testimonialService = {
  submitTestimonial,
  getReceivedTestimonials,
  getGivenTestimonials,
  getPendingTestimonials,
  getApprovedTestimonials,
  approveTestimonial,
  rejectTestimonial,
}
