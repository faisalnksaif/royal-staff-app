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
  last_purchase_date: string | null
  days_since_last_purchase: number | null
  retention_status: RetentionStatus
  avg_days_to_clear: number | null
  last_payment_date: string | null
  last_payment_amount: number | null
  days_since_last_payment: number | null
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
  sortBy?: "priority" | "balance"
  retention_thresholds?: { activeDays: number; churnedDays: number }
}

export type LedgerOutstandingFilter = "all" | "followed_up" | "not_followed_up" | "paid" | "overdue" | "open_followup"


export interface LedgerOutstandingParams {
  page?: number
  limit?: number
  search?: string
  filter?: LedgerOutstandingFilter
  sortBy?: "priority" | "balance"
  activeDays?: number
  churnedDays?: number
}

export interface LedgerEntry {
  voucher_id: number
  accounting_voucher_id: number | null
  ledger_id: number
  ledger_name: string
  voucher_number: string | null
  voucher_date: string
  voucher_date_raw: string
  sequence: number
  voucher_type: string
  dr_or_cr: "Dr" | "Cr" | null
  amount: number | null
  debit: number
  credit: number
  running_balance: number | null
  running_balance_dr_cr: "Dr" | "Cr" | null
  particulars: string | null
  cost_center: string | null
  remarks: string | null
  payment_type: string | null
  sales_executive_raw: string | null
  sales_executive_normalized: string | null
  staff_id: number | null
  staff_match_status: "matched" | "unmatched" | "ambiguous" | "not_applicable"
}

export interface CustomerLedgerResponse {
  success: boolean
  pagination: BillsPagination
  data: {
    customer: {
      ledger_id: number
      name: string
      balance: number
    }
    entries: LedgerEntry[]
  }
  summary: {
    total_entries: number
    total_debit: number
    total_credit: number
    net_movement: number
    opening_balance: number | null
    opening_dr_cr: "Dr" | "Cr" | null
    closing_balance: number | null
    closing_dr_cr: "Dr" | "Cr" | null
  }
  retention: {
    first_purchase_date: string | null
    last_purchase_date: string | null
    total_purchases: number
    days_since_last_purchase: number | null
    status: RetentionStatus
    activeDays: number
    churnedDays: number
  } | null
  payment_velocity: {
    avg_days_to_clear: number | null
    total_debt_amount: number
    total_cleared_amount: number
    cleared_pct: number
    last_payment_date: string | null
    last_payment_amount: number | null
    days_since_last_payment: number | null
  } | null
  follow_up: LedgerCustomerFollowUp | null
  ownership: {
    staffId: number | null
    staffName: string | null
    source: "assigned" | "dynamic" | "unassigned"
  } | null
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
export type FollowUpOutcome = "promisedToPay" | "promisedPartial" | "dispute" | "noResponse" | "reminderSent"

export interface FollowUp {
  _id: string
  customerId: string
  customerName: string
  ledgerId: number | null
  mobile: string | null
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
  outstandingAmount: number | null
  outstandingDrCr: "Dr" | "Cr" | null
  outstandingAmountAtResolution: number | null
  outstandingDrCrAtResolution: "Dr" | "Cr" | null
  amountRecovered: number | null
  outstandingBackfilled: boolean
  whatsapp: {
    lastReceiptSentAt: string | null
    lastReminderSentAt: string | null
  } | null
  whatsappSends: {
    _id: string
    staffId: number
    type: "receipt" | "reminder"
    mobile: string
    amountMentioned: number | null
    sentAt: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface AppNotification {
  _id: string
  staffId: number
  userId: number
  type: "new_transaction" | "leave_requested" | "leave_approved"
  title: string
  message: string
  ledgerId: number | null
  ledgerName: string | null
  metadata: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationsResponse {
  success: boolean
  pagination: BillsPagination
  unread_count: number
  data: AppNotification[]
}

export interface UnreadCountResponse {
  success: boolean
  data: { unread_count: number }
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

export interface FollowupsSummary {
  totalFollowUps: number
  byOutcome: {
    promisedToPay: number
    promisedPartial: number
    dispute: number
    noResponse: number
    reminderSent?: number
  }
  byResolution: {
    resolved: number
    open: number
  }
  totalFollowedUpAmount: number
  totalPromisedAmount: number
  totalPaidAmount: number
}

export interface StaffFollowupsResponse {
  success: boolean
  count: number
  data: FollowUp[]
  summary?: FollowupsSummary
}

export interface CustomerFollowupsResponse {
  success: boolean
  count: number
  data: FollowUp[]
  outstanding: {
    ledger_id: number
    outstanding_balance: number
    outstanding_dr_cr: "Dr" | "Cr"
  } | null
}

export interface AllFollowUpsResponse {
  success: boolean
  pagination: BillsPagination
  data: FollowUp[]
  summary: FollowupsSummary
}

export interface DashboardStaffLeaderboardEntry {
  staff_id: number
  user_id: number
  staff_name: string
  customers_owned: number
  total_outstanding: number
  totalFollowUps: number
  byOutcome: FollowupsSummary["byOutcome"]
  byResolution: FollowupsSummary["byResolution"]
  totalFollowedUpAmount: number
  totalPromisedAmount: number
  totalPaidAmount: number
}

export interface DashboardOverviewData {
  generated_at: string
  period: {
    startDate: string | null
    endDate: string | null
    dateField: "loggedAt" | "promisedDate" | "resolvedAt"
  }
  totals: {
    total_staff: number
    total_customers: number
    total_outstanding: number
  }
  followups: {
    totalFollowUps: number
    uniqueStaffCount: number
    uniqueCustomerCount: number
    byOutcome: FollowupsSummary["byOutcome"]
    byResolution: FollowupsSummary["byResolution"]
    totalFollowedUpAmount: number
    totalPromisedAmount: number
    totalPaidAmount: number
  }
  notifications: {
    sent_in_period: number
    unread_total: number
  }
  staff_leaderboard: DashboardStaffLeaderboardEntry[]
}

export interface DashboardOverviewResponse {
  success: boolean
  data: DashboardOverviewData
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

// ─── Payment velocity ─────────────────────────────────────────────────────────

export interface PaymentVelocityCustomer {
  ledger_id: number
  name: string
  mobile: string | null
  avg_days_to_clear: number
  total_debt_amount: number
  total_cleared_amount: number
  cleared_pct: number
  outstanding_balance: number
  outstanding_dr_cr: "Dr" | "Cr"
  last_payment_date: string | null
  last_payment_amount: number | null
  days_since_last_payment: number | null
}

export interface PaymentVelocityResponse {
  success: boolean
  pagination: BillsPagination
  data: PaymentVelocityCustomer[]
  summary: {
    customers_ranked: number
    company_avg_days_to_clear: number | null
  }
}

export type PaymentVelocitySortBy = "avg_days_to_clear" | "total_debt_amount" | "total_cleared_amount" | "cleared_pct" | "outstanding_balance" | "days_since_last_payment"
export type SortOrder = "asc" | "desc"

export interface PaymentVelocityParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: PaymentVelocitySortBy
  order?: SortOrder
}

// ─── Retention ───────────────────────────────────────────────────────────────

export type RetentionStatus = "active" | "at_risk" | "churned" | "never_purchased"

export interface RetentionCustomer {
  ledger_id: number
  name: string
  mobile: string | null
  status: RetentionStatus
  days_since_last_purchase: number | null
  total_purchases: number
  first_purchase_date: string | null
  last_purchase_date: string | null
  outstanding_balance: number
  outstanding_dr_cr: "Dr" | "Cr"
}

export interface RetentionResponse {
  success: boolean
  pagination: BillsPagination
  data: RetentionCustomer[]
  filters: {
    activeDays: number
    churnedDays: number
    status: RetentionStatus | "all"
  }
  summary: {
    total_customers: number
    active: number
    at_risk: number
    churned: number
    never_purchased: number
    active_pct: number
    churn_pct: number
  }
}

export type RetentionSortBy = "last_purchase_date" | "days_since_last_purchase" | "total_purchases" | "outstanding_balance"

export interface RetentionParams {
  page?: number
  limit?: number
  search?: string
  status?: RetentionStatus | "all"
  activeDays?: number
  churnedDays?: number
  sortBy?: RetentionSortBy
  order?: SortOrder
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
