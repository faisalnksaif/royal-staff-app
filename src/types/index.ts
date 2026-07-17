export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: UserRole
  department: string | null
  createdAt: string
  updatedAt: string
}

export type UserRole = "superAdmin" | "manager" | "staff"

export type AttendanceStatus = "present" | "late" | "absent"

export interface StaffResponse {
  id: number
  user_id: number
  name: string
  email: string
  phone: string | null
  sales_target: number | null
  collection_target: number | null
  createdAt: string
  updatedAt: string
}

export interface StaffListResponse {
  success: boolean
  count: number
  data: StaffResponse[]
}


export type Theme = "light" | "dark" | "system"

export interface AppError {
  code: string
  message: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface Bill {
  _id: string
  staff_id: number
  user_id: number
  staff_name: string
  voucher_id: string
  voucher_date: string
  voucher_number: string
  amount: number
  aging_balance: number
  aging: number
  remarks: string | null
  createdAt: string
  updatedAt: string
}

export interface BillsPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface StaffBillsResponse {
  success: boolean
  pagination: BillsPagination
  data: Bill[]
}

export interface StaffBillsParams {
  page?: number
  limit?: number
  search?: string
}


export interface CustomerFollowUpEntry {
  id: string
  staff_id: number
  contact_method: ContactMethod
  outcome: FollowUpOutcome
  promised_amount: number | null
  promised_date: string | null
  next_follow_up_date: string | null
  remarks: string | null
  logged_at: string
}

export interface CustomerWithFollowUps {
  customer_id: number
  customer_name: string
  total_outstanding_amount: number
  follow_ups: CustomerFollowUpEntry[]
}

export interface StaffCustomersParams {
  page?: number
  limit?: number
  search?: string
}

export interface StaffCustomersResponse {
  success: boolean
  pagination: BillsPagination
  data: CustomerWithFollowUps[]
}

// ─── Ledger outstanding ───────────────────────────────────────────────────────

export interface LedgerCustomerFollowUp {
  total: number
  open: number
  resolved: number
  last_logged_at: string | null
  last_outcome: FollowUpOutcome | null
  next_followup_date: string | null
  is_overdue: boolean
  total_promised_amount: number
}

export interface LedgerCustomerOutstanding {
  ledger_id: number
  name: string
  mobile: string | null
  outstanding_balance: number
  outstanding_dr_cr: "Dr" | "Cr"
  ownership_source: "assigned" | "dynamic" | "unassigned"
  staff_sales_total: number
  other_contributors: { staff_id: number; staff_name: string; sales_total: number }[]
  follow_up: LedgerCustomerFollowUp
}

export interface LedgerFollowUpInsights {
  customers_total: number
  customers_never_followed_up: number
  customers_overdue_followup: number
  total_followups: number
  open_followups: number
  resolved_followups: number
  resolution_rate_pct: number
  by_outcome: Record<string, number>
  total_promised_amount: number
  total_received_via_resolved_followups: number
  avg_days_to_resolve: number | null
}

export interface LedgerOutstandingResponse {
  success: boolean
  pagination: BillsPagination
  data: LedgerCustomerOutstanding[]
  totals: { total_outstanding: number; total_staff_sales: number }
  follow_up_insights: LedgerFollowUpInsights
}

export type LedgerOutstandingFilter = "all" | "followed_up" | "not_followed_up" | "paid" | "overdue" | "open_followup"

export interface LedgerOutstandingParams {
  page?: number
  limit?: number
  search?: string
  filter?: LedgerOutstandingFilter
}

export interface AgingBucket {
  _id: number
  count: number
  amount: number
}

export interface StaffBillsSummaryResponse {
  success: boolean
  data: {
    total_customers: number
    total_outstanding: number
    total_follow_ups: number
    customers: Array<{
      customer_name: string
      customer_id: number
      outstanding: number
      follow_ups_count: number
    }>
    by_aging: AgingBucket[]
  }
}

export type ContactMethod = "phoneCall" | "sms" | "email" | "inPerson" | "whatsapp"
export type FollowUpOutcome = "promisedToPay" | "promisedPartial" | "dispute" | "noContact" | "paid"

export interface FollowUp {
  _id: string
  customerId: string
  customerName: string
  staffId: number
  userId: number
  staffName: string
  loggedAt: string
  contactMethod: ContactMethod
  outcome: FollowUpOutcome
  promisedAmount: number | null
  promisedDate: string | null
  nextFollowUpDate: string | null
  quickRemarks: string[]
  freeTextRemark: string | null
  disputeDetails: string | null
  resolvedByPayment: boolean
  resolvedAt: string | null
  resolvedVoucherId: number | null
  createdAt: string
  updatedAt: string
}

export interface AttendanceSession {
  sessionNumber: number
  checkIn: string
  checkOut: string | null
  workHours: number | null
}

export interface AttendanceScanResponse {
  success: boolean
  matched: boolean
  staff?: { id: number; name: string }
  confidence?: number
  action?: "checkIn" | "checkOut"
  attendance?: {
    id: string
    staffId: number
    date: string
    sessionCount: number
    sessions: AttendanceSession[]
    totalWorkHours: number
    totalBreakTime: number
    status: AttendanceStatus
  }
}

export interface AttendanceRecord {
  staffId: number
  staffName: string
  sessionCount: number
  sessions: AttendanceSession[]
  totalWorkHours: number | null
  totalBreakTime: number | null
  status: AttendanceStatus
}

export interface AttendanceDayResponse {
  success: boolean
  date: string
  summary: { present: number; absent: number; late: number }
  data: AttendanceRecord[]
}

export interface StaffFollowupsResponse {
  success: boolean
  count: number
  data: FollowUp[]
}

export type LeaveStatus = "pending" | "approved" | "rejected"
export type LeaveType = "Personal" | "Medical"

export interface LeaveRequest {
  id: string
  staffId: number
  staffName: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  numberOfDays: number
  reason: string
  status: LeaveStatus
  approvedAt?: string | null
  rejectionReason?: string | null
  createdAt: string
}

export interface LeaveStatsOverview {
  total: number
  byStatus: { pending: number; approved: number; rejected: number }
  byType: { personal: number; medical: number }
  currentMonth: number
}

export interface LeaveBalance {
  staffId: number
  name: string
  totalLeavePerYear: number
  leaveBalance: number
  leaveUsedThisYear: number
  leaveUsedThisMonth: number
  monthlyLimit: number
}

export type AppearanceItemKey = "uniform" | "socks_banyan" | "hair_beard_moustache"

export interface AppearanceRecord {
  staffId: number
  staffName: string
  date?: string
  status?: "ok" | "bad"
  violations?: AppearanceItemKey[]
  issues?: AppearanceItemKey[]
  remarks?: string | null
  markedAt?: string | null
}

export interface TodayAppearance {
  date: string
  count: number
  badCount: number
  staff: AppearanceRecord[]
}

export interface ScoreBreakdownItem {
  rule: string
  category: string
  earned: number
  possible: number
  metrics: { name: string; value: number; contribution: number }[]
  passed: boolean
  explanation: string
}

export interface StaffScore {
  _id: string
  staffId: number
  staffName: string
  month: string
  year: number
  monthNumber: number
  totalScore: number
  maxPossibleScore: number
  percentageScore: number
  breakdown: ScoreBreakdownItem[]
  calculatedAt: string
  calculatedBy: string
  remarks: string | null
}

export interface MonthlyScoresData {
  month: string
  count: number
  scores: StaffScore[]
}

export interface ScoringConfig {
  _id: string
  month: string
  year: number
  monthNumber: number
  attendance: {
    maxLateCases: number
    pointsIfNoLate: number
    penaltyIfExceeds: number
    lateThresholdMinutes: number
  }
  leaves: {
    maxAllowedPerMonth: number
    pointsIfWithinLimit: number
    penaltyIfExceeds: number
  }
  appearance: {
    enabled: boolean
    pointsPerViolation: number
    maxPoints: number
    violations: string[]
  }
  extraPerformance: {
    pointsPerPerformance: number
    maxPointsAllowed: number
  }
  isActive: boolean
}

export type ExtraPerformanceStatus = "pending" | "approved" | "rejected"
export type ExtraPerformanceCategory =
  | "Training"
  | "Process Improvement"
  | "Customer Excellence"
  | "Team Leadership"
  | "Other"

export interface ExtraPerformance {
  _id: string
  staffId: number
  staffName: string
  month: string
  year: number
  monthNumber: number
  title: string
  description: string
  date: string
  category: ExtraPerformanceCategory
  status: ExtraPerformanceStatus
  points: number
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface ExtraPerformanceStats {
  total: number
  approved: number
  pending: number
  rejected: number
}

export interface CreateFollowupPayload {
  customerId: string
  customerName: string
  staffId: number
  userId?: number
  staffName: string
  loggedAt?: string
  contactMethod: ContactMethod
  outcome: FollowUpOutcome
  promisedAmount?: number | null
  promisedDate?: string | null
  nextFollowUpDate?: string | null
  quickRemarks?: string[]
  freeTextRemark?: string | null
  disputeDetails?: string | null
}
