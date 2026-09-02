/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ShiftResponse {
  /** @example "6a6eb4734de5019c90374faf" */
  _id?: string;
  /** @example "General" */
  name: string;
  /**
   * 24hr "HH:mm" in the configured timezone (Asia/Kolkata)
   * @example "08:30"
   */
  startTime: string;
  /**
   * Normal shift end - checking out at/before this is not overtime
   * @example "18:30"
   */
  endTime1: string;
  /**
   * Overtime threshold - checking out after this counts as overtime. Commonly equal to endTime1 (no OT grace window).
   * @example "19:00"
   */
  endTime2: string;
  /** @example true */
  isDefault?: boolean;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

export interface DepartmentResponse {
  /** @example "6a6f3ad24de5019c90375d7c" */
  _id?: string;
  /** @example "Store" */
  name: string;
  /** @example true */
  isDefault?: boolean;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

/** A rowbest customer ledger, as synced into LedgerCustomer */
export interface LedgerCustomerResponse {
  /**
   * Rowbest ledger id - source of truth key
   * @example 688580
   */
  ledger_id?: number;
  /** @example "C- ANEES" */
  name?: string;
  /** @example "Sundry Debtors" */
  group?: string;
  /**
   * Customer's mobile number from rowbest, if on file
   * @example "9846220088"
   */
  mobile?: string | null;
  /** @example 8064269 */
  dr?: number;
  /** @example 0 */
  cr?: number;
  /**
   * dr - cr
   * @example 8064269
   */
  balance?: number;
  /**
   * Staff currently responsible for this customer (see ownership cutoff rule)
   * @example 2646
   */
  assigned_staff_id?: number | null;
  /** @example "ANSARKA" */
  assigned_staff_name?: string | null;
  /** See PUT /ledger/customers/{ledgerId}/hold - held customers are hidden from staff entirely */
  on_hold?: boolean | null;
  hold_reason?: string | null;
  held_by_staff_id?: number | null;
  held_by_staff_name?: string | null;
  /** @format date-time */
  held_at?: string | null;
  /** @format date-time */
  fetchedAt?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

/** A single synced rowbest ledger transaction, as stored in LedgerEntry */
export interface LedgerEntryResponse {
  /**
   * Rowbest transaction-line id - unique idempotency key
   * @example 30694733
   */
  voucher_id?: number;
  /**
   * Underlying voucher id used to build edit_path
   * @example 7684810
   */
  accounting_voucher_id?: number | null;
  /** @example 688315 */
  ledger_id?: number;
  /**
   * Denormalized customer name at fetch time
   * @example "IRSHAD ACM"
   */
  ledger_name?: string;
  /** @example "RV2627/R/07801" */
  voucher_number?: string | null;
  /** @format date-time */
  voucher_date?: string;
  /**
   * Original dd-mm-yyyy string from rowbest, kept for debugging
   * @example "11-07-2026"
   */
  voucher_date_raw?: string;
  /**
   * Same-day tiebreaker preserving rowbest's true chronological order (not always voucher_number order)
   * @example 2
   */
  sequence?: number;
  /**
   * Receipt | Payment | Sales | Sales Return | ...
   * @example "Sales"
   */
  voucher_type?: string;
  dr_or_cr?: "Dr" | "Cr" | null;
  amount?: number | null;
  /** @example 171 */
  debit?: number;
  /** @example 0 */
  credit?: number;
  /** @example 24595 */
  running_balance?: number | null;
  running_balance_dr_cr?: "Dr" | "Cr" | null;
  /** @example "Sales" */
  particulars?: string | null;
  cost_center?: string | null;
  remarks?: string | null;
  /** @example "UPI" */
  payment_type?: string | null;
  supplier_invoice_no?: string | null;
  vehicle_no?: string | null;
  /** @example "/admin/sales/7684810/edit?id=688315" */
  edit_path?: string | null;
  /** Sales-executive name as scraped from rowbest, before normalization/matching */
  sales_executive_raw?: string | null;
  sales_executive_normalized?: string | null;
  /** Resolved internal Staff.id, if sales_executive_raw matched exactly one staff member */
  staff_id?: number | null;
  /** not_applicable means this voucher type has no sales-executive field at all (e.g. Payment vouchers) */
  staff_match_status?: "matched" | "unmatched" | "ambiguous" | "not_applicable";
  /** Whether the sales-executive scrape has run for this entry */
  sales_executive_fetched?: boolean;
  /** @format date-time */
  sales_executive_fetched_at?: string | null;
  /** @format date-time */
  fetchedAt?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

export interface UserResponse {
  /**
   * MongoDB user ID
   * @example "507f1f77bcf86cd799439011"
   */
  id: string;
  /**
   * @format email
   * @example "ANASROYAL@GMAIL.COM"
   */
  email: string;
  /** @example "ANAS" */
  name?: string | null;
  /** @example 3027 */
  user_id?: number | null;
  /** @example "staff" */
  role: "staff" | "manager" | "superAdmin" | "hr" | "scanner";
  /** @example true */
  isActive: boolean;
}

/** A staff member's own note/todo item */
export interface TodoResponse {
  /** @example "507f1f77bcf86cd799439033" */
  id?: string;
  /** @example 3027 */
  staffId?: number;
  /** @example "Follow up with vendor about delayed shipment" */
  title?: string;
  /** @example "Call in the afternoon after lunch" */
  notes?: string | null;
  /**
   * YYYY-MM-DD the todo is intended for, or null if undated
   * @format date
   * @example "2026-08-05"
   */
  plannedFor?: string | null;
  /** @example "normal" */
  priority?: "low" | "normal" | "high";
  /** @example "planned" */
  status?: "planned" | "done" | "cancelled";
  /**
   * What was actually done - set when marking done/cancelled
   * @example "Called vendor, shipment arriving Monday"
   */
  actionNote?: string | null;
  /** @format date-time */
  completedAt?: string | null;
  /**
   * Set once the plannedFor-day push reminder has been sent, to avoid re-sending
   * @format date-time
   */
  reminderSentAt?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

/** A department's scanning-device login (role scanner) */
export interface ScanningDeviceResponse {
  /** @example "507f1f77bcf86cd799439099" */
  id?: string;
  /**
   * @format email
   * @example "scan-kitchen@rowbest.com"
   */
  email?: string;
  /** @example "Kitchen scanner" */
  name?: string | null;
  /** @example true */
  isActive?: boolean;
  /**
   * Department ID, or the populated department object on GET/list responses
   * @example "507f1f77bcf86cd799439022"
   */
  departmentId?: string;
  location?: {
    /** @example 11.2588 */
    lat?: number;
    /** @example 75.7804 */
    lng?: number;
    /**
     * Allowed distance (meters) from this point for a scan to be considered location-verified
     * @example 100
     */
    radiusMeters?: number;
  } | null;
}

export interface StaffResponse {
  /** @example 2645 */
  id: number;
  /** @example 3027 */
  user_id: number;
  /** @example "ANAS" */
  name: string;
  /**
   * @format email
   * @example "ANASROYAL@GMAIL.COM"
   */
  email?: string;
  /** @example null */
  phone?: string | null;
  /** @example null */
  sales_target?: number | null;
  /** @example null */
  collection_target?: number | null;
  /**
   * When false, this staff member is excluded from attendance tracking, summaries, and dashboards (e.g. management/stale records)
   * @example true
   */
  isEligibleForAttendance?: boolean;
  /**
   * MongoDB ID of the assigned Department (see /departments)
   * @example "6a6f3ad24de5019c90375d7c"
   */
  departmentId?: string | null;
  /**
   * MongoDB ID of the assigned Shift (see /shifts). Null/unset falls back to the default shift.
   * @example "6a6eb4734de5019c90374faf"
   */
  shiftId?: string | null;
  /**
   * Whether the staff member has at least one enrolled face photo
   * @example false
   */
  hasPhoto?: boolean;
  /**
   * Number of enrolled reference photos
   * @example 0
   */
  photoCount?: number;
  /**
   * @format date-time
   * @example "2026-06-19T18:00:00.000Z"
   */
  createdAt?: string;
  /**
   * @format date-time
   * @example "2026-06-19T18:00:00.000Z"
   */
  updatedAt?: string;
}

export interface BillResponse {
  /**
   * MongoDB bill ID
   * @example "507f1f77bcf86cd799439012"
   */
  _id?: string;
  /** @example 2645 */
  staff_id?: number;
  /** @example 3027 */
  user_id?: number;
  /** @example "ANAS" */
  staff_name?: string;
  /** @example "INV001" */
  voucher_id?: string;
  /**
   * @format date
   * @example "2026-06-19"
   */
  voucher_date?: string;
  /** @example "VOL-001" */
  voucher_number?: string;
  /** @example 10000 */
  amount?: number;
  /** @example 10000 */
  aging_balance?: number;
  /**
   * Days overdue
   * @example 30
   */
  aging?: number;
  /**
   * Whether bill is before (historical) or after (current) cutoff date
   * @example "current"
   */
  period?: "historical" | "current";
  /** @example null */
  remarks?: string | null;
  /**
   * @format date-time
   * @example "2026-06-19T18:00:00.000Z"
   */
  createdAt?: string;
  /**
   * @format date-time
   * @example "2026-06-19T18:00:00.000Z"
   */
  updatedAt?: string;
}

export interface FollowUpResponse {
  /**
   * MongoDB follow-up ID
   * @example "507f1f77bcf86cd799439013"
   */
  _id: string;
  /** @example "CUST001" */
  customerId: string;
  /** @example "ABC Company" */
  customerName: string;
  /**
   * Rowbest ledger id, resolved from customerName if not supplied
   * @example 688580
   */
  ledgerId?: number | null;
  /**
   * Customer's mobile number - live-joined from LedgerCustomer.mobile on every read (kept current, and filled in for older records that predate the snapshot), falling back to the value captured at logging time if no match is found
   * @example "9846220088"
   */
  mobile?: string | null;
  /** @example 2645 */
  staffId: number;
  /** @example 3027 */
  userId?: number;
  /** @example "ANAS" */
  staffName: string;
  /**
   * Set automatically when a Receipt lands for this customer during ledger sync - never affects `outcome`
   * @example false
   */
  resolvedByPayment?: boolean;
  /** @format date-time */
  resolvedAt?: string | null;
  /** Rowbest voucher id of the Receipt that triggered auto-resolution */
  resolvedVoucherId?: number | null;
  /**
   * Customer's outstanding balance at the moment this follow-up was logged
   * @example 15000
   */
  outstandingAmount?: number | null;
  outstandingDrCr?: "Dr" | "Cr" | null;
  /**
   * Customer's outstanding balance at the moment this follow-up was auto-resolved by a payment
   * @example 5000
   */
  outstandingAmountAtResolution?: number | null;
  outstandingDrCrAtResolution?: "Dr" | "Cr" | null;
  /** Sign-aware diff (outstandingAmount minus outstandingAmountAtResolution) - positive means the outstanding balance went down. Compare against promisedAmount to see if the promise was kept. */
  amountRecovered?: number | null;
  /**
   * True if the outstanding-balance fields were filled in by a one-time migration using the balance as of the migration run (not a true historical snapshot), rather than captured live
   * @example false
   */
  outstandingBackfilled?: boolean;
  /** Denormalized WhatsApp send history, updated by POST /followups/{id}/whatsapp - lets the card show status without an extra query */
  whatsapp?: {
    /** @format date-time */
    lastReceiptSentAt?: string | null;
    /** @format date-time */
    lastReminderSentAt?: string | null;
  };
  /** Full audit trail of every WhatsApp send logged via POST /followups/{id}/whatsapp - whatsapp above only holds the latest per type, this holds all of them. */
  whatsappSends?: {
    _id?: string;
    /** @example 12 */
    staffId?: number;
    type?: "receipt" | "reminder";
    /** @example "919876543210" */
    mobile?: string;
    /** @example 5000 */
    amountMentioned?: number | null;
    /** @format date-time */
    sentAt?: string;
  }[];
  /**
   * @format date-time
   * @example "2026-06-19T10:30:00.000Z"
   */
  loggedAt: string;
  /** @example "phoneCall" */
  contactMethod: "phoneCall" | "sms" | "email" | "inPerson" | "whatsapp";
  /** @example "promisedToPay" */
  outcome:
    | "promisedToPay"
    | "promisedPartial"
    | "dispute"
    | "noResponse"
    | "reminderSent";
  /** @example 5000 */
  promisedAmount?: number | null;
  /**
   * @format date
   * @example "2026-06-26"
   */
  promisedDate?: string | null;
  /**
   * @format date
   * @example "2026-06-25"
   */
  nextFollowUpDate?: string | null;
  /** @example ["Customer interested","Will call back"] */
  quickRemarks?: string[];
  /** @example "Customer is in a difficult situation" */
  freeTextRemark?: string | null;
  /** @example "Customer claims amount is incorrect" */
  disputeDetails?: string | null;
  /**
   * @format date-time
   * @example "2026-06-19T10:30:00.000Z"
   */
  createdAt?: string;
  /**
   * @format date-time
   * @example "2026-06-19T10:30:00.000Z"
   */
  updatedAt?: string;
}

export interface NotificationResponse {
  /**
   * MongoDB notification ID
   * @example "507f1f77bcf86cd799439099"
   */
  _id: string;
  /** @example 2645 */
  staffId: number;
  /** @example 3027 */
  userId: number;
  /**
   * new_transaction is legacy (no longer emitted - was too noisy, fired on every ledger entry). payment_received fires only when a payment resolves an open follow-up.
   * @example "payment_received"
   */
  type:
    | "new_transaction"
    | "promise_due"
    | "promise_reminder"
    | "payment_received";
  /** @example "5 new transactions for ABC Company" */
  title: string;
  /** @example "ABC Company has 5 new ledger entries (debit ₹25,000, credit ₹10,000)" */
  message: string;
  /** @example 882028 */
  ledgerId?: number | null;
  /** @example "ABC Company" */
  ledgerName?: string | null;
  /** Extra event-specific data (e.g. new entry count, debit/credit totals) */
  metadata?: object | null;
  /** @example false */
  isRead: boolean;
  /** @format date-time */
  readAt?: string | null;
  /**
   * @format date-time
   * @example "2026-07-17T14:15:03.787Z"
   */
  createdAt?: string;
  /**
   * @format date-time
   * @example "2026-07-17T14:15:03.787Z"
   */
  updatedAt?: string;
}

export interface ErrorResponse {
  /** @example false */
  success?: boolean;
  /** @example "Unauthorized - no token provided" */
  error?: string;
}

/** Monthly performance score for a staff member based on attendance, leaves, and appearance */
export interface StaffScoreResponse {
  /**
   * MongoDB score ID
   * @example "6a4417ccd5ddf48055605a22"
   */
  _id?: string;
  /** @example 2645 */
  staffId?: number;
  /** @example "ANAS" */
  staffName?: string;
  /** @example "2026-06" */
  month?: string;
  /** @example 2026 */
  year?: number;
  /** @example 6 */
  monthNumber?: number;
  /**
   * Total earned score (sum of all categories)
   * @example 25
   */
  totalScore?: number;
  /**
   * Maximum possible score for active rules.
   * Total framework is 100 points:
   * - Attendance: 10 points
   * - Leaves: 10 points
   * - Appearance: 5 points
   * - Cleaning Culture: 5 points
   * - Welcoming Customer: 10 points
   * - Customer Dealing: 15 points
   * - Customer & Quotation Followup: 10 points
   * - Meeting: 5 points
   * - Extra Performance: 10 points
   * - Testimonial: 20 points
   * @example 25
   */
  maxPossibleScore?: number;
  /**
   * Score as percentage (0-100)
   * @example 100
   */
  percentageScore?: number;
  /** Detailed score breakdown by category (Attendance, Leave, Appearance) */
  breakdown?: {
    /** @example "AttendanceRule" */
    rule?: "AttendanceRule" | "LeaveRule" | "AppearanceRule";
    /** @example "Attendance" */
    category?: "Attendance" | "Leave" | "Appearance";
    /**
     * Points earned for this category
     * @example 10
     */
    earned?: number;
    /**
     * Maximum possible points for this category
     * @example 10
     */
    possible?: number;
    /**
     * Whether staff met the criteria for this category
     * @example true
     */
    passed?: boolean;
    /**
     * Human-readable explanation of the score
     * @example "0 late arrivals (max 3 allowed)"
     */
    explanation?: string;
    /** Detailed metrics that contributed to this score */
    metrics?: {
      /**
       * Metric name (e.g., lateCases, leaveCount, violationDays)
       * @example "lateCases"
       */
      name?: string;
      /**
       * Actual metric value
       * @example 0
       */
      value?: number;
      /**
       * Points contributed by this metric
       * @example 10
       */
      contribution?: number;
    }[];
  }[];
  /**
   * When this score was calculated
   * @format date-time
   */
  calculatedAt?: string;
  /** @example "system" */
  calculatedBy?: string;
  remarks?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

/** Extra performance submission with approval status */
export interface ExtraPerformanceResponse {
  /**
   * MongoDB performance submission ID
   * @example "6a4417ccd5ddf48055605a23"
   */
  _id?: string;
  /** @example 2645 */
  staffId?: number;
  /** @example "ANAS" */
  staffName?: string;
  /** @example "2026-06" */
  month?: string;
  /** @example 2026 */
  year?: number;
  /** @example 6 */
  monthNumber?: number;
  /**
   * Performance title
   * @example "Led customer training session"
   */
  title?: string;
  /**
   * Detailed description
   * @example "Conducted comprehensive training for 15 customers"
   */
  description?: string;
  /**
   * Date performance occurred (IST)
   * @format date
   * @example "2026-06-28"
   */
  date?: string;
  /** @example "Training" */
  category?:
    | "Training"
    | "Process Improvement"
    | "Customer Excellence"
    | "Team Leadership"
    | "Other";
  /**
   * Approval status
   * @example "approved"
   */
  status?: "pending" | "approved" | "rejected";
  /**
   * Points awarded (10 when approved)
   * @example 10
   */
  points?: number;
  /** MongoDB user ID of superadmin who approved (if approved) */
  approvedBy?: string | null;
  /**
   * Approval timestamp (if approved)
   * @format date-time
   */
  approvedAt?: string | null;
  /** Reason for rejection (if rejected) */
  rejectionReason?: string | null;
  /**
   * When performance was submitted
   * @format date-time
   */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

/** A testimonial from one staff member about another, with approval status */
export interface TestimonialResponse {
  /**
   * MongoDB testimonial ID
   * @example "6a4417ccd5ddf48055605a24"
   */
  _id?: string;
  /**
   * Rowbest numeric user ID of the staff member who wrote the testimonial
   * @example 3027
   */
  reviewerUserId?: number;
  /** @example "ANAS" */
  reviewerName?: string;
  /**
   * Rowbest numeric user ID of the staff member being reviewed
   * @example 3028
   */
  revieweeUserId?: number;
  /** @example "ANSARKA" */
  revieweeName?: string;
  /**
   * Month the testimonial counts toward (derived from submission date)
   * @example "2026-06"
   */
  month?: string;
  /** @example 2026 */
  year?: number;
  /** @example 6 */
  monthNumber?: number;
  /** @example "Anas went out of his way to help close the month-end reconciliation - great teamwork." */
  message?: string;
  /**
   * Approval status
   * @example "approved"
   */
  status?: "pending" | "approved" | "rejected";
  /**
   * Points awarded to the reviewee when approved (5)
   * @example 5
   */
  points?: number;
  /** MongoDB user ID of the manager/HR/superAdmin who approved (if approved) */
  approvedBy?: string | null;
  /**
   * Approval timestamp (if approved)
   * @format date-time
   */
  approvedAt?: string | null;
  /** Reason for rejection (if rejected) */
  rejectionReason?: string | null;
  /**
   * When the testimonial was submitted
   * @format date-time
   */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

/** A meeting created by an admin, used as the basis for attendance tracking and Meeting scoring */
export interface MeetingResponse {
  /**
   * MongoDB meeting ID
   * @example "6a4417ccd5ddf48055605a24"
   */
  _id?: string;
  /** @example "Weekly Sales Review" */
  title?: string;
  /** @format date-time */
  date?: string;
  notes?: string | null;
  /** MongoDB user ID of the admin who created the meeting */
  createdBy?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

/** A single staff member's attendance record for a meeting */
export interface MeetingAttendanceEntry {
  /** Staff.id (internal id) */
  staffId?: number;
  /** @example "ANAS" */
  staffName?: string;
  /** @example "present" */
  status?: "present" | "absent" | "excused";
  /** Present only when status is excused */
  reason?: string | null;
  /** MongoDB user ID of the admin who last updated this status */
  markedBy?: string | null;
  /** @format date-time */
  markedAt?: string | null;
}

/**
 * Scoring rules configuration for a specific month. Controls point allocation for all scoring categories.
 *
 * **Total Score: 100 points**
 * - Attendance: 10 points
 * - Leaves: 10 points
 * - Appearance: 5 points
 * - Cleaning Culture: 5 points
 * - Welcoming Customer: 10 points
 * - Customer Dealing: 15 points
 * - Customer & Quotation Followup: 10 points
 * - Meeting: 5 points
 * - Extra Performance: 10 points
 * - Testimonial: 20 points
 */
export interface ScoringConfigResponse {
  /** MongoDB config ID */
  _id?: string;
  /**
   * Month in YYYY-MM format
   * @example "2026-06"
   */
  month?: string;
  /** @example 2026 */
  year?: number;
  /**
   * @min 1
   * @max 12
   * @example 6
   */
  monthNumber?: number;
  /** Attendance scoring rules (Late arrivals) */
  attendance?: {
    /**
     * Maximum late cases allowed (> lateThresholdMinutes) before penalty
     * @example 3
     */
    maxLateCases?: number;
    /**
     * Points awarded if late cases within limit
     * @example 10
     */
    pointsIfNoLate?: number;
    /**
     * Penalty points if exceeds maxLateCases
     * @example -10
     */
    penaltyIfExceeds?: number;
    /**
     * Minutes after work start (9:00 AM) to be considered late
     * @example 30
     */
    lateThresholdMinutes?: number;
  };
  /** Leave scoring rules (Approved leaves per month) */
  leaves?: {
    /**
     * Recommended approved leaves per month before a score penalty applies (default 1)
     * @example 1
     */
    maxAllowedPerMonth?: number;
    /**
     * Points awarded if leaves within limit
     * @example 10
     */
    pointsIfWithinLimit?: number;
    /**
     * Penalty points if exceeds maxAllowedPerMonth
     * @example -10
     */
    penaltyIfExceeds?: number;
  };
  /** Appearance scoring rules (Dress code violations) */
  appearance?: {
    /**
     * Enable/disable appearance scoring
     * @example true
     */
    enabled?: boolean;
    /**
     * Points deducted per violation day
     * @example -5
     */
    pointsPerViolation?: number;
    /**
     * Maximum points for appearance category
     * @example 5
     */
    maxPoints?: number;
    /**
     * 'perDay' (default): deducts |pointsPerViolation| for every bad day, recurring. 'flat': forfeits it once, first bad day.
     * @default "perDay"
     */
    mode?: "flat" | "perDay";
    /**
     * Types of violations to track
     * @example ["uniform","socks_banyan","hair_beard_moustache"]
     */
    violations?: ("uniform" | "socks_banyan" | "hair_beard_moustache")[];
  };
  /** Cleaning culture scoring rules (mode "flat" forfeits pointsPerBadDay once for the month; "perDay" deducts it per bad day, recurring) */
  cleaning?: {
    /**
     * Enable/disable cleaning scoring
     * @example true
     */
    enabled?: boolean;
    /**
     * Points for cleaning category
     * @example 5
     */
    maxPoints?: number;
    /**
     * @default "flat"
     * @example "flat"
     */
    mode?: "flat" | "perDay";
    /**
     * Points deducted per the mode above
     * @example 5
     */
    pointsPerBadDay?: number;
  };
  /** Welcoming customer scoring rules (mode "flat" forfeits pointsPerBadDay once for the month; "perDay" deducts it per bad day, recurring) */
  welcomingCustomer?: {
    /**
     * Enable/disable welcoming customer scoring
     * @example true
     */
    enabled?: boolean;
    /**
     * Points for welcoming customer category
     * @example 10
     */
    maxPoints?: number;
    /**
     * @default "flat"
     * @example "flat"
     */
    mode?: "flat" | "perDay";
    /**
     * Points deducted per the mode above
     * @example 10
     */
    pointsPerBadDay?: number;
  };
  /** Customer dealing scoring rules - Store-department staff are scored from customer feedback (POST /feedback/requests answers), everyone else from the customer_dealing daily check (mode "flat" forfeits pointsPerBadDay once; "perDay" deducts it per bad day, recurring) */
  customerDealing?: {
    /**
     * Enable/disable customer dealing scoring
     * @example true
     */
    enabled?: boolean;
    /**
     * Points for customer dealing category
     * @example 15
     */
    maxPoints?: number;
    /**
     * Store staff only - points deducted per completed feedback submission with at least one "no" answer, not deduplicated per customer
     * @example 15
     */
    pointsPerBadFeedback?: number;
    /**
     * Non-Store staff only (daily-check based)
     * @default "flat"
     * @example "flat"
     */
    mode?: "flat" | "perDay";
    /**
     * Non-Store staff only - points deducted per the mode above
     * @example 15
     */
    pointsPerBadDay?: number;
  };
  /** Customer & quotation follow-up scoring rules (mode "perDay", the default, deducts pointsPerBadMark per bad day this month and compounds; "flat" forfeits it once) */
  customerQuotationFollowup?: {
    /**
     * Enable/disable customer & quotation followup scoring
     * @example true
     */
    enabled?: boolean;
    /**
     * Points for customer & quotation followup category
     * @example 10
     */
    maxPoints?: number;
    /**
     * @default "perDay"
     * @example "perDay"
     */
    mode?: "flat" | "perDay";
    /**
     * Points deducted per the mode above (perDay compounds - e.g. 2 bad days = -20, floored at 0)
     * @example 10
     */
    pointsPerBadMark?: number;
  };
  /** Extra performance scoring rules (Approved submissions) */
  extraPerformance?: {
    /**
     * Points awarded per approved performance
     * @example 10
     */
    pointsPerPerformance?: number;
    /**
     * Maximum points allowed per month for extra performance
     * @example 10
     */
    maxPointsAllowed?: number;
  };
  /** Testimonial scoring rules (Approved testimonials from other staff) */
  testimonial?: {
    /**
     * Points awarded per approved testimonial
     * @example 5
     */
    pointsPerTestimonial?: number;
    /**
     * Maximum points allowed per month for testimonials
     * @example 20
     */
    maxPointsAllowed?: number;
  };
  /**
   * Whether this config is active
   * @example true
   */
  isActive?: boolean;
  /**
   * When this config was created
   * @format date-time
   */
  createdAt?: string;
  /**
   * When this config was last updated
   * @format date-time
   */
  updatedAt?: string;
}

/** A yes/no question in the feedback question bank */
export interface FeedbackQuestion {
  /** @example "6a4417ccd5ddf48055605a24" */
  _id?: string;
  /** @example "Was the staff member polite and helpful?" */
  text?: string;
  /**
   * Inactive questions are excluded from new feedback links but remain on any FeedbackRequest that already snapshotted them
   * @example true
   */
  isActive?: boolean;
  /**
   * Display order, lower first
   * @example 1
   */
  order?: number;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

/** A feedback link sent to a customer, its snapshotted questions, and (once completed) the customer's answers and submitting device info */
export interface FeedbackRequest {
  /** @example "6a4417ccd5ddf48055605a25" */
  _id?: string;
  /**
   * Opaque token used in the customer-facing link
   * @example "b6c1a5e2-4f3d-4a1b-9c2e-7d8f6a1b2c3d"
   */
  token?: string;
  /**
   * Staff.id (internal id) of the staff member who sent the link
   * @example 2646
   */
  staffId?: number;
  /**
   * Rowbest numeric user ID of the staff member who sent the link
   * @example 3027
   */
  staffUserId?: number;
  /**
   * Rowbest ledger id of the customer
   * @example 1024
   */
  ledgerId?: number;
  /** @example "Sunrise Traders" */
  customerName?: string;
  /** @example "9876543210" */
  customerMobile?: string;
  /** @example "completed" */
  status?: "pending" | "completed" | "expired";
  /** Snapshot of active questions at the time this link was created - unaffected by later edits to the question bank */
  questions?: {
    questionId?: string;
    text?: string;
  }[];
  /** Present once status is "completed" */
  answers?: {
    questionId?: string;
    answer?: boolean;
  }[];
  /** Captured at submission time only */
  device?: {
    /** Client-supplied opaque device identifier */
    fingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  /**
   * Set if this submission's device fingerprint/IP also appears on a completed request for a different customer - a manual-review signal, not an automatic block
   * @example false
   */
  flagged?: boolean;
  /** @example "Device also used for feedback on a different customer (ledger 1031, request 6a4417ccd5ddf48055605a99)" */
  flagReason?: string;
  /** @format date-time */
  sentAt?: string;
  /** @format date-time */
  completedAt?: string;
  /**
   * Link stops accepting submissions after this time (7 days after sentAt)
   * @format date-time
   */
  expiresAt?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://localhost:9999/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Royal App Backend API
 * @version 1.0.0
 * @baseUrl http://localhost:9999/api
 * @contact API Support <faisalnkpadi@gmail.com>
 *
 * Website monitoring and staff management system with bill tracking
 */
export class Api<SecurityDataType extends unknown> {
  http: HttpClient<SecurityDataType>;

  constructor(http: HttpClient<SecurityDataType>) {
    this.http = http;
  }

  system = {
    /**
     * @description Returns the health status of the API server
     *
     * @tags System
     * @name HealthList
     * @summary Health check
     * @request GET:/health
     * @secure
     */
    healthList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Server is running" */
          message?: string;
          /**
           * @format date-time
           * @example "2026-06-27T16:47:00.000Z"
           */
          timestamp?: string;
        },
        any
      >({
        path: `/health`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  authentication = {
    /**
     * @description Create a new user account with email and password
     *
     * @tags Authentication
     * @name RegisterCreate
     * @summary Register a new user
     * @request POST:/auth/register
     * @secure
     */
    registerCreate: (
      data: {
        /**
         * @format email
         * @example "user@example.com"
         */
        email: string;
        /** @example "ANAS" */
        name?: string | null;
        /**
         * @minLength 4
         * @example "1234"
         */
        password: string;
        /** @example 3027 */
        user_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "User registered successfully" */
          message?: string;
          data?: UserResponse;
        },
        ErrorResponse
      >({
        path: `/auth/register`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Authenticate user with email and password, returns JWT token
     *
     * @tags Authentication
     * @name LoginCreate
     * @summary Login user
     * @request POST:/auth/login
     * @secure
     */
    loginCreate: (
      data: {
        /**
         * @format email
         * @example "ANASROYAL@GMAIL.COM"
         */
        email: string;
        /** @example "1234" */
        password: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Login successful" */
          message?: string;
          /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
          token?: string;
          data?: UserResponse;
        },
        ErrorResponse
      >({
        path: `/auth/login`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve the authenticated user's profile information
     *
     * @tags Authentication
     * @name GetAuthentication
     * @summary Get current user profile
     * @request GET:/auth/me
     * @secure
     */
    getAuthentication: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: UserResponse;
        },
        ErrorResponse
      >({
        path: `/auth/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Lets any authenticated user (staff, manager, HR, superAdmin, or scanner device) change their own password, verifying the current password first. There is no separate "admin resets someone else's password" endpoint - each account changes its own.
     *
     * @tags Authentication
     * @name ChangePasswordUpdate
     * @summary Change the current user's own password
     * @request PUT:/auth/change-password
     * @secure
     */
    changePasswordUpdate: (
      data: {
        /** @example "1234" */
        currentPassword: string;
        /**
         * @minLength 4
         * @example "5678"
         */
        newPassword: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Password changed successfully" */
          message?: string;
        },
        ErrorResponse
      >({
        path: `/auth/change-password`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Stores the device's Expo push token on the authenticated user's staff record, for sending push notifications later
     *
     * @tags Authentication
     * @name PushTokenUpdate
     * @summary Save the current user's Expo push token
     * @request PUT:/auth/push-token
     * @secure
     */
    pushTokenUpdate: (
      data: {
        /** @example "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" */
        expoPushToken: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          message?: string;
          data?: {
            expoPushToken?: string;
          };
        },
        void
      >({
        path: `/auth/push-token`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve list of all users (requires authentication)
     *
     * @tags Authentication
     * @name UsersList
     * @summary Get all users
     * @request GET:/auth/users
     * @secure
     */
    usersList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example 7 */
          count?: number;
          data?: UserResponse[];
        },
        ErrorResponse
      >({
        path: `/auth/users`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a role=scanner login for a department's physical attendance-scanning device. The device logs in via /auth/login with these credentials and sends the resulting bearer token on every POST /attendance/scan call. lat/lng/radiusMeters define the device's expected physical location, used to flag scans made outside that radius.
     *
     * @tags Authentication
     * @name ScanningDevicesCreate
     * @summary Create a department's scanning-device login (admin)
     * @request POST:/auth/scanning-devices
     * @secure
     */
    scanningDevicesCreate: (
      data: {
        /**
         * @format email
         * @example "scan-kitchen@rowbest.com"
         */
        email: string;
        /**
         * @minLength 4
         * @example "s3cret"
         */
        password: string;
        /** @example "Kitchen scanner" */
        name?: string | null;
        /** @example "507f1f77bcf86cd799439022" */
        departmentId: string;
        /** @example 11.2588 */
        lat: number;
        /** @example 75.7804 */
        lng: number;
        /** @example 100 */
        radiusMeters: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Scanning device created successfully" */
          message?: string;
          /** A department's scanning-device login (role scanner) */
          data?: ScanningDeviceResponse;
        },
        ErrorResponse | void
      >({
        path: `/auth/scanning-devices`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Authentication
     * @name ScanningDevicesList
     * @summary List department scanning-device logins (admin)
     * @request GET:/auth/scanning-devices
     * @secure
     */
    scanningDevicesList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example 3 */
          count?: number;
          data?: ScanningDeviceResponse[];
        },
        void
      >({
        path: `/auth/scanning-devices`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Authentication
     * @name ScanningDevicesPartialUpdate
     * @summary Update a scanning device's department/location/active state (admin)
     * @request PATCH:/auth/scanning-devices/{id}
     * @secure
     */
    scanningDevicesPartialUpdate: (
      id: string,
      data: {
        departmentId?: string;
        lat?: number;
        lng?: number;
        radiusMeters?: number;
        isActive?: boolean;
        name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** A department's scanning-device login (role scanner) */
          data?: ScanningDeviceResponse;
        },
        void
      >({
        path: `/auth/scanning-devices/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  staff = {
    /**
     * @description Retrieve list of all staff members (MANAGER ONLY)
     *
     * @tags Staff
     * @name StaffList
     * @summary Get all staff
     * @request GET:/staff
     * @secure
     */
    staffList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example 7 */
          count?: number;
          data?: (StaffResponse & {
            /**
             * Role of this staff member's linked User account
             * @example "manager"
             */
            role?: "staff" | "manager" | "superAdmin" | "hr" | "scanner";
          })[];
        },
        ErrorResponse
      >({
        path: `/staff`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Id+name pairs (sorted by name) for every staff member with isEligibleForAttendance true - for populating a colleague picker, e.g. "who are you writing a testimonial about" or a "reassign to" dropdown. Any authenticated user may call this (unlike GET /staff, which is manager-only and returns full records).
     *
     * @tags Staff
     * @name OptionsList
     * @summary Lightweight staff list for dropdowns/pickers
     * @request GET:/staff/options
     * @secure
     */
    optionsList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            /**
             * Staff.id (internal id)
             * @example 2645
             */
            id?: number;
            /** @example "ANAS" */
            name?: string;
          }[];
        },
        ErrorResponse
      >({
        path: `/staff/options`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve a specific staff member (staff can only access their own record, managers can access any)
     *
     * @tags Staff
     * @name StaffDetail
     * @summary Get staff by ID
     * @request GET:/staff/{id}
     * @secure
     */
    staffDetail: (id: number, params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: StaffResponse;
        },
        ErrorResponse
      >({
        path: `/staff/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a staff member's department and/or shift assignment. Manager/HR/superAdmin only.
     *
     * @tags Staff
     * @name StaffPartialUpdate
     * @summary Update staff department/shift
     * @request PATCH:/staff/{id}
     * @secure
     */
    staffPartialUpdate: (
      id: number,
      data: {
        /**
         * MongoDB ID of an existing Department document (see /departments)
         * @example "6a6f3ad24de5019c90375d7c"
         */
        departmentId?: string;
        /**
         * MongoDB ID of an existing Shift document
         * @example "6a6eb4734de5019c90374faf"
         */
        shiftId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            /** @example 2645 */
            id?: number;
            /** @example "ANAS" */
            name?: string;
            /** @example "6a6f3ad24de5019c90375d7c" */
            departmentId?: string;
            /** @example "6a6eb4734de5019c90374faf" */
            shiftId?: string;
          };
        },
        ErrorResponse
      >({
        path: `/staff/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  ledger = {
    /**
     * @description Paginated list of all rowbest ledger customers with dr/cr summary - managers only
     *
     * @tags Ledger
     * @name CustomersList
     * @summary List ledger customers
     * @request GET:/ledger/customers
     * @secure
     */
    customersList: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** Filter by customer name */
        search?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: LedgerCustomerResponse[];
        },
        void
      >({
        path: `/ledger/customers`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the customer record, its synced transactions (paginated), a debit/credit summary, retention status, payment velocity, follow-up summary, and current ownership - a full profile for one customer. retention and payment_velocity are always computed over this customer's FULL synced history, independent of from_date/to_date (those only scope the transaction list and summary debit/credit totals). Managers only.
     *
     * @tags Ledger
     * @name CustomersDetail
     * @summary Get a customer's ledger detail (paginated entries + summary + retention + payment velocity + follow-up + ownership)
     * @request GET:/ledger/customers/{ledgerId}
     * @secure
     */
    customersDetail: (
      ledgerId: number,
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** @format date */
        from_date?: string;
        /** @format date */
        to_date?: string;
        /**
         * Days since last purchase to be considered "active" (for `retention`)
         * @default 30
         */
        activeDays?: number;
        /**
         * Days since last purchase beyond which "churned" (for `retention`, must be greater than activeDays)
         * @default 90
         */
        churnedDays?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: {
            /** A rowbest customer ledger, as synced into LedgerCustomer */
            customer?: LedgerCustomerResponse;
            /** This page's synced transactions for this customer */
            entries?: LedgerEntryResponse[];
          };
          /** Debit/credit totals computed over the full (optionally date-filtered) entry set, not just the current page. opening_balance/closing_balance are both LedgerCustomer.balance (the customer's live balance, sourced from rowbest's customer list, not derived per-entry) - since local entry sync isn't guaranteed complete (some history still lives in a legacy pre-rowbest system), these are always equal to each other and don't vary with from_date/to_date. For a live point-in-time value over an arbitrary range, use GET /ledger/customers/{ledgerId}/opening-balance instead. */
          summary?: {
            total_entries?: number;
            total_debit?: number;
            total_credit?: number;
            /** total_debit - total_credit for this window only - NOT the account balance, since it ignores whatever the balance already was before the window started. Use closing_balance for the actual balance. */
            net_movement?: number;
            opening_balance?: number;
            opening_dr_cr?: "Dr" | "Cr";
            closing_balance?: number;
            closing_dr_cr?: "Dr" | "Cr";
          };
          /** This customer's buying-recency classification - same logic as GET /ledger/retention, computed over full history regardless of from_date/to_date */
          retention?: {
            /** @format date-time */
            first_purchase_date?: string | null;
            /** @format date-time */
            last_purchase_date?: string | null;
            /** Count of synced Sales vouchers, all-time */
            total_purchases?: number;
            days_since_last_purchase?: number | null;
            status?: "active" | "at_risk" | "churned" | "never_purchased";
            activeDays?: number;
            churnedDays?: number;
          };
          /** This customer's FIFO debt-clearance speed - same logic as GET /ledger/payment-velocity, computed over full history */
          payment_velocity?: {
            /** Null if this customer has never had any debt cleared */
            avg_days_to_clear?: number | null;
            total_debt_amount?: number;
            total_cleared_amount?: number;
            cleared_pct?: number;
            /**
             * Most recent actual Receipt voucher date - independent of the FIFO clearance calculation
             * @format date-time
             */
            last_payment_date?: string | null;
            last_payment_amount?: number | null;
            days_since_last_payment?: number | null;
          };
          /** Follow-up activity for this customer (see GET /ledger/staff/{userId}/outstanding's follow_up field for the same shape) */
          follow_up?: {
            total?: number;
            open?: number;
            resolved?: number;
            /** @format date-time */
            last_logged_at?: string | null;
            last_outcome?:
              | "promisedToPay"
              | "promisedPartial"
              | "dispute"
              | "noResponse"
              | "reminderSent"
              | null;
            /** @format date-time */
            next_followup_date?: string | null;
            /** An open (unpaid) follow-up whose promisedDate has passed, or whose nextFollowUpDate has passed */
            is_overdue?: boolean;
            total_promised_amount?: number;
          };
          /** Who currently "owns" this customer, per the ownership cutoff rule (see GET /ledger/staff/{userId}/outstanding) */
          ownership?: {
            staffId?: number | null;
            staffName?: string | null;
            source?: "assigned" | "dynamic" | "unassigned";
          };
          /** Completed customer feedback submissions for this customer, newest first (see POST /feedback/requests). Pending/expired links (no answers yet) are excluded. */
          feedback?: {
            _id?: string;
            /** Staff.id (internal id) of the staff member who sent the feedback link */
            staffId?: number;
            /** Null if the staff record no longer exists */
            staffName?: string | null;
            questions?: {
              questionId?: string;
              text?: string;
            }[];
            answers?: {
              questionId?: string;
              answer?: boolean;
            }[];
            /** See GET /feedback/flagged - a manual-review signal, not a claim of confirmed fraud */
            flagged?: boolean;
            flagReason?: string | null;
            /** @format date-time */
            sentAt?: string;
            /** @format date-time */
            completedAt?: string;
          }[];
        },
        void
      >({
        path: `/ledger/customers/${ledgerId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Computed live against rowbest (not from locally-synced data) for accuracy over arbitrary date ranges. If this customer is on hold (see PUT /ledger/customers/{ledgerId}/hold), staff get a 404 - the same as a nonexistent ledgerId - managers/superAdmin are unaffected.
     *
     * @tags Ledger
     * @name CustomersOpeningBalanceList
     * @summary Get opening/closing balance for a date range
     * @request GET:/ledger/customers/{ledgerId}/opening-balance
     * @secure
     */
    customersOpeningBalanceList: (
      ledgerId: number,
      query: {
        /** @format date */
        from_date: string;
        /** @format date */
        to_date: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/ledger/customers/${ledgerId}/opening-balance`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description A held customer is hidden from staff entirely - not just /ledger/staff/{userId}/outstanding's list, but direct lookups (GET /ledger/customers/{ledgerId}/opening-balance, GET /followups/customer/{customerId} both 404) and follow-up creation (POST /followups 400s). Held customers are also excluded from every staff-attributed total (dashboard leaderboard, /ledger/staff/{userId}/outstanding's totals/follow_up_insights), regardless of viewer - a held customer isn't any staff member's responsibility. Managers/superAdmin retain full visibility everywhere, including in the lists above and in GET /ledger/mappings. Company-wide totals (e.g. /dashboard/overview's totals.total_outstanding, GET /ledger/outstanding) are unaffected - a held customer still owes real money, they're just not being actively chased.
     *
     * @tags Ledger
     * @name CustomersHoldUpdate
     * @summary Hold or unhold a customer (managers/superAdmin)
     * @request PUT:/ledger/customers/{ledgerId}/hold
     * @secure
     */
    customersHoldUpdate: (
      ledgerId: number,
      data: {
        hold: boolean;
        /**
         * Required (non-empty) when hold is true. Ignored/cleared when hold is false.
         * @example "Dispute over last invoice - do not contact until resolved"
         */
        reason?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            ledger_id?: number;
            name?: string;
            on_hold?: boolean;
            hold_reason?: string | null;
            /** The user_id (not internal Staff.id) of whoever set the hold - same convention as FollowUp.staffId */
            held_by_staff_id?: number | null;
            held_by_staff_name?: string | null;
            /** @format date-time */
            held_at?: string | null;
          };
        },
        void
      >({
        path: `/ledger/customers/${ledgerId}/hold`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff can only access their own, managers can access any
     *
     * @tags Ledger
     * @name StaffDetail
     * @summary Get a staff member's ledger entries
     * @request GET:/ledger/staff/{userId}
     * @secure
     */
    staffDetail: (
      userId: number,
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        search?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/ledger/staff/${userId}`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Returns customers currently assigned to this staff (per the ownership cutoff rule in Settings key `ledger_ownership_cutoff_date` - before the cutoff, ownership comes from the manually-maintained staff-customer mapping spreadsheet; after it, ownership is derived dynamically from each customer's most recent matched Sales voucher). Each customer includes its live outstanding balance and a breakdown of which staff have historically sold to them (no single "owner" is forced on the sales-contribution side). Staff can only access their own, managers can access any. Customers on hold (see PUT /ledger/customers/{ledgerId}/hold) never appear in `data` for a staff viewer (managers still see them, with `on_hold`/`hold_reason` populated) and are always excluded from `totals` and `follow_up_insights`, regardless of viewer.
     *
     * @tags Ledger
     * @name StaffOutstandingList
     * @summary Get customers currently owned by a staff member, with outstanding
     * @request GET:/ledger/staff/{userId}/outstanding
     * @secure
     */
    staffOutstandingList: (
      userId: number,
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** Filter by customer name */
        search?: string;
        /**
         * Filter by follow-up status. `paid` means the customer has at least one follow-up resolved by a payment. `red_list` means the customer's last purchase was 21+ days ago and no payment has been made since that purchase. `follow_up_insights` in the response is always computed over the full owned set, regardless of this filter.
         * @default "all"
         */
        filter?:
          | "all"
          | "followed_up"
          | "not_followed_up"
          | "paid"
          | "overdue"
          | "open_followup"
          | "red_list";
        /**
         * `priority` (default) ranks by worst-case risk, highest first: (1) overdue follow-up - a promise was already missed, (2) churned + still owes money (Dr balance) - stopped buying and hasn't paid, the highest bad-debt risk, (3) never followed up at all + still owes money - a coverage gap, (4) at_risk (buying is slowing down) + still owes money, (5) everyone else. Within each tier, longest since last payment first (customers who have never paid sort before any finite gap), then highest outstanding_balance. "balance" is the simple outstanding_balance-descending sort with no risk weighting. "newest" sorts by created_at descending (most recently synced first).
         * @default "priority"
         */
        sortBy?: "priority" | "balance" | "newest";
        /**
         * Days since last purchase to be considered "active" (for `retention_status`)
         * @default 30
         */
        activeDays?: number;
        /**
         * Days since last purchase beyond which "churned" (for `retention_status`, must be greater than activeDays)
         * @default 90
         */
        churnedDays?: number;
        /**
         * A customer is flagged `is_new` if first synced from rowbest (LedgerCustomer.createdAt) within this many days
         * @default 7
         */
        newDays?: number;
        /**
         * Filter `data` to a single retention_status (same buying-recency classification as GET /ledger/retention)
         * @default "all"
         */
        retention_status?:
          | "all"
          | "active"
          | "at_risk"
          | "churned"
          | "never_purchased";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: {
            /** @example 688580 */
            ledger_id?: number;
            /** @example "C- ANEES" */
            name?: string;
            /**
             * Customer's mobile number from rowbest, if on file
             * @example "9846220088"
             */
            mobile?: string | null;
            /** @example 8064269 */
            outstanding_balance?: number;
            outstanding_dr_cr?: "Dr" | "Cr";
            /** Whether ownership came from the spreadsheet (assigned), derived post-cutoff (dynamic), or is unset */
            ownership_source?: "assigned" | "dynamic" | "unassigned";
            /** This staff's share of total Sales debit to this customer */
            staff_sales_total?: number;
            other_contributors?: {
              staff_id?: number;
              staff_name?: string;
              sales_total?: number;
            }[];
            /** Follow-up activity for this specific customer */
            follow_up?: {
              total?: number;
              /** Not yet resolved by a payment */
              open?: number;
              resolved?: number;
              /** @format date-time */
              last_logged_at?: string | null;
              last_outcome?:
                | "promisedToPay"
                | "promisedPartial"
                | "dispute"
                | "noResponse"
                | "reminderSent"
                | null;
              /** @format date-time */
              next_followup_date?: string | null;
              /** An open (unpaid) follow-up whose promisedDate has passed, or whose nextFollowUpDate has passed */
              is_overdue?: boolean;
              /** Sum of promisedAmount across still-open follow-ups */
              total_promised_amount?: number;
            };
            /**
             * Most recent synced Sales voucher date, all-time - as of the last ledger sync (~10 min lag), not live
             * @format date-time
             */
            last_purchase_date?: string | null;
            days_since_last_purchase?: number | null;
            /** Same classification as GET /ledger/retention */
            retention_status?:
              | "active"
              | "at_risk"
              | "churned"
              | "never_purchased";
            /** FIFO-derived average days this customer takes to clear debt once incurred - same logic as GET /ledger/payment-velocity, as of the last ledger sync. Null if they've never cleared anything yet. */
            avg_days_to_clear?: number | null;
            /**
             * Most recent actual Receipt voucher date, as of the last ledger sync - independent of avg_days_to_clear, answers "have they paid recently?"
             * @format date-time
             */
            last_payment_date?: string | null;
            last_payment_amount?: number | null;
            days_since_last_payment?: number | null;
            /** True if last_purchase_date is 21+ days ago and no payment has been made since that purchase */
            is_in_red_list?: boolean;
            /** First synced from rowbest within the last `newDays` days */
            is_new?: boolean;
            /**
             * When this customer was first synced from rowbest
             * @format date-time
             */
            created_at?: string;
            /** Only ever true here for a manager/superAdmin viewer - held customers are absent from `data` entirely for staff */
            on_hold?: boolean;
            hold_reason?: string | null;
          }[];
          /** The filter that was applied to `data` */
          filter?:
            | "all"
            | "followed_up"
            | "not_followed_up"
            | "paid"
            | "overdue"
            | "open_followup"
            | "red_list";
          retention_status?:
            | "all"
            | "active"
            | "at_risk"
            | "churned"
            | "never_purchased";
          sortBy?: "priority" | "balance" | "newest";
          retention_thresholds?: {
            activeDays?: number;
            churnedDays?: number;
          };
          newDays?: number;
          totals?: {
            total_outstanding?: number;
            total_staff_sales?: number;
          };
          /** Staff-wide follow-up effectiveness, computed across all owned customers (not just the current page) - answers "how much did we follow up, how much did we actually receive". */
          follow_up_insights?: {
            customers_total?: number;
            /** Owned customers with zero follow-up records ever - a coverage gap */
            customers_never_followed_up?: number;
            /** Owned customers with an open follow-up whose promisedDate (or nextFollowUpDate) has passed */
            customers_overdue_followup?: number;
            total_followups?: number;
            open_followups?: number;
            resolved_followups?: number;
            /** resolved_followups / total_followups * 100 */
            resolution_rate_pct?: number;
            /** @example {"promisedToPay":12,"dispute":2,"noResponse":5} */
            by_outcome?: Record<string, number>;
            /** Sum of promisedAmount across still-open follow-ups */
            total_promised_amount?: number;
            /** Actual credit amount on the vouchers that resolved a follow-up (promised vs. actually collected) */
            total_received_via_resolved_followups?: number;
            /** Average days between a follow-up being logged and being resolved by payment */
            avg_days_to_resolve?: number | null;
          };
        },
        void
      >({
        path: `/ledger/staff/${userId}/outstanding`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Company-wide counterpart to GET /ledger/staff/{userId}/outstanding - same follow-up filtering, retention/payment-velocity fields, and worst-case-first priority sort, but across every customer instead of one staff member's owned set (no per-staff ownership/sales-contribution breakdown). Managers only.
     *
     * @tags Ledger
     * @name OutstandingList
     * @summary Get all customers across all staff, with outstanding
     * @request GET:/ledger/outstanding
     * @secure
     */
    outstandingList: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** Filter by customer name */
        search?: string;
        /**
         * Filter by follow-up status. `paid` means the customer has at least one follow-up resolved by a payment. `red_list` means the customer's last purchase was 21+ days ago and no payment has been made since that purchase.
         * @default "all"
         */
        filter?:
          | "all"
          | "followed_up"
          | "not_followed_up"
          | "paid"
          | "overdue"
          | "open_followup"
          | "red_list";
        /**
         * `priority` (default) ranks by worst-case risk, highest first: (1) overdue follow-up - a promise was already missed, (2) churned + still owes money (Dr balance) - stopped buying and hasn't paid, the highest bad-debt risk, (3) never followed up at all + still owes money - a coverage gap, (4) at_risk (buying is slowing down) + still owes money, (5) everyone else. Within each tier, longest since last payment first (customers who have never paid sort before any finite gap), then highest outstanding_balance. `balance` is the simple outstanding_balance-descending sort with no risk weighting. `newest` sorts by created_at descending (most recently synced first).
         * @default "priority"
         */
        sortBy?: "priority" | "balance" | "newest";
        /**
         * Days since last purchase to be considered "active" (for `retention_status`)
         * @default 30
         */
        activeDays?: number;
        /**
         * Days since last purchase beyond which "churned" (for `retention_status`, must be greater than activeDays)
         * @default 90
         */
        churnedDays?: number;
        /**
         * A customer is flagged `is_new` if first synced from rowbest (LedgerCustomer.createdAt) within this many days
         * @default 7
         */
        newDays?: number;
        /**
         * Filter `data` to a single retention_status (same buying-recency classification as GET /ledger/retention)
         * @default "all"
         */
        retention_status?:
          | "all"
          | "active"
          | "at_risk"
          | "churned"
          | "never_purchased";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: {
            /** @example 868301 */
            ledger_id?: number;
            /** @example "FAVAS VENGARA" */
            name?: string;
            /** @example "9747006008" */
            mobile?: string | null;
            /** @example 50000 */
            outstanding_balance?: number;
            outstanding_dr_cr?: "Dr" | "Cr";
            follow_up?: {
              total?: number;
              open?: number;
              resolved?: number;
              /** @format date-time */
              last_logged_at?: string | null;
              last_outcome?:
                | "promisedToPay"
                | "promisedPartial"
                | "dispute"
                | "noResponse"
                | "reminderSent"
                | null;
              /** @format date-time */
              next_followup_date?: string | null;
              /** An open (unpaid) follow-up whose promisedDate has passed, or whose nextFollowUpDate has passed */
              is_overdue?: boolean;
              total_promised_amount?: number;
            };
            /**
             * Most recent synced Sales voucher date, all-time - as of the last ledger sync (~10 min lag), not live
             * @format date-time
             */
            last_purchase_date?: string | null;
            days_since_last_purchase?: number | null;
            /** Same classification as GET /ledger/retention */
            retention_status?:
              | "active"
              | "at_risk"
              | "churned"
              | "never_purchased";
            /** FIFO-derived average days this customer takes to clear debt once incurred - same logic as GET /ledger/payment-velocity, as of the last ledger sync. Null if they've never cleared anything yet. */
            avg_days_to_clear?: number | null;
            /**
             * Most recent actual Receipt voucher date, as of the last ledger sync - independent of avg_days_to_clear, answers "have they paid recently?"
             * @format date-time
             */
            last_payment_date?: string | null;
            last_payment_amount?: number | null;
            days_since_last_payment?: number | null;
            /** True if last_purchase_date is 21+ days ago and no payment has been made since that purchase */
            is_in_red_list?: boolean;
            /** First synced from rowbest within the last `newDays` days */
            is_new?: boolean;
            /**
             * When this customer was first synced from rowbest
             * @format date-time
             */
            created_at?: string;
            /** Manager-set hold flag - see PUT /ledger/customers/{ledgerId}/hold. Held customers are still included here (this endpoint is managers-only), unlike GET /ledger/staff/{userId}/outstanding which hides them from staff viewers. */
            on_hold?: boolean;
            hold_reason?: string | null;
          }[];
          filter?:
            | "all"
            | "followed_up"
            | "not_followed_up"
            | "paid"
            | "overdue"
            | "open_followup"
            | "red_list";
          retention_status?:
            | "all"
            | "active"
            | "at_risk"
            | "churned"
            | "never_purchased";
          sortBy?: "priority" | "balance" | "newest";
          retention_thresholds?: {
            activeDays?: number;
            churnedDays?: number;
          };
          newDays?: number;
          totals?: {
            total_outstanding?: number;
          };
        },
        void
      >({
        path: `/ledger/outstanding`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Buckets every Sundry Debtors customer by days since their last Sales voucher: `active` (<= activeDays), `at_risk` (between activeDays and churnedDays), `churned` (> churnedDays), or `never_purchased` (no Sales voucher ever synced). Based on buying behavior (Sales vouchers), independent of follow-up/collections activity. `summary` counts are always computed over the full customer set regardless of the `status` filter applied to `data`. Managers only.
     *
     * @tags Ledger
     * @name RetentionList
     * @summary Customer retention summary (active/at-risk/churned/never-purchased)
     * @request GET:/ledger/retention
     * @secure
     */
    retentionList: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** Filter by customer name */
        search?: string;
        /**
         * Filter `data` to a single retention status
         * @default "all"
         */
        status?: "all" | "active" | "at_risk" | "churned" | "never_purchased";
        /**
         * Days since last purchase to be considered "active"
         * @default 30
         */
        activeDays?: number;
        /**
         * Days since last purchase beyond which a customer is "churned" (must be greater than activeDays)
         * @default 90
         */
        churnedDays?: number;
        /**
         * Field to sort by. `last_purchase_date` and `days_since_last_purchase` both push never_purchased customers (null) to the end regardless of `order`. `created_at` sorts by when the customer was first synced from rowbest - "sort by newest customer".
         * @default "last_purchase_date"
         */
        sortBy?:
          | "last_purchase_date"
          | "days_since_last_purchase"
          | "total_purchases"
          | "outstanding_balance"
          | "created_at";
        /** @default "desc" */
        order?: "asc" | "desc";
        /**
         * A customer is flagged `is_new` if first synced from rowbest (LedgerCustomer.createdAt) within this many days
         * @default 7
         */
        newDays?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: {
            /** @example 698368 */
            ledger_id?: number;
            /** @example "AK GAS" */
            name?: string;
            mobile?: string | null;
            /** @format date-time */
            first_purchase_date?: string | null;
            /** @format date-time */
            last_purchase_date?: string | null;
            /** Count of synced Sales vouchers */
            total_purchases?: number;
            days_since_last_purchase?: number | null;
            status?: "active" | "at_risk" | "churned" | "never_purchased";
            /**
             * Current live balance, from LedgerCustomer - independent of the buying-recency status above
             * @example 15000
             */
            outstanding_balance?: number;
            outstanding_dr_cr?: "Dr" | "Cr";
            /** First synced from rowbest within the last `newDays` days */
            is_new?: boolean;
            /**
             * When this customer was first synced from rowbest
             * @format date-time
             */
            created_at?: string;
          }[];
          filters?: {
            activeDays?: number;
            churnedDays?: number;
            status?:
              | "all"
              | "active"
              | "at_risk"
              | "churned"
              | "never_purchased";
            newDays?: number;
          };
          sort?: {
            sortBy?:
              | "last_purchase_date"
              | "days_since_last_purchase"
              | "total_purchases"
              | "outstanding_balance"
              | "created_at";
            order?: "asc" | "desc";
          };
          /** Computed over all Sundry Debtors customers, not just the current page or status filter */
          summary?: {
            total_customers?: number;
            active?: number;
            at_risk?: number;
            churned?: number;
            never_purchased?: number;
            active_pct?: number;
            churn_pct?: number;
          };
        },
        void
      >({
        path: `/ledger/retention`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Reconstructs total signed outstanding debt (sum of LedgerCustomer.balance, same convention as GET /dashboard/overview's total_outstanding) for each calendar day going back `days` days - with no separate snapshot/history collection. Derived from each LedgerEntry's own running_balance (rowbest's balance-as-of-that-transaction), forward- filled per customer against the requested day list, seeded by opening_balance before a customer's earliest synced entry. History only goes back as far as sync history exists for each customer - there's no daily granularity into the pre-rowbest legacy era. Today's point can lag slightly behind the live dashboard total since it depends on the last completed sync, not real-time. Managers only.
     *
     * @tags Ledger
     * @name DebtHistoryList
     * @summary Total company-wide debt for each of the last N days (for charting)
     * @request GET:/ledger/debt-history
     * @secure
     */
    debtHistoryList: (
      query?: {
        /**
         * How many days of history to return, ending today
         * @max 365
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            /** @example "2026-07-21" */
            date?: string;
            /** @example 25022177.34 */
            total_debt?: number;
          }[];
        },
        void
      >({
        path: `/ledger/debt-history`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description FIFO-matches each customer's debit entries (debt incurred) against their later credit entries (debt cleared) in chronological order - the standard accounting assumption when individual invoices aren't explicitly linked to specific payments, consistent with how rowbest's own running_balance is built. Ranked fastest (lowest avg_days_to_clear) first. Customers who have never had any debt cleared are excluded (avg_days_to_clear would be null). Managers only.
     *
     * @tags Ledger
     * @name PaymentVelocityList
     * @summary Customers ranked by how fast they historically clear debt
     * @request GET:/ledger/payment-velocity
     * @secure
     */
    paymentVelocityList: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** Filter by customer name */
        search?: string;
        /**
         * Field to sort by. `days_since_last_payment` sorts by recency of the last actual Receipt - customers with no payment on record (null) always sort last regardless of `order`.
         * @default "avg_days_to_clear"
         */
        sortBy?:
          | "avg_days_to_clear"
          | "total_debt_amount"
          | "total_cleared_amount"
          | "cleared_pct"
          | "outstanding_balance"
          | "days_since_last_payment";
        /** @default "asc" */
        order?: "asc" | "desc";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: {
            /** @example 846539 */
            ledger_id?: number;
            /** @example "KAMARUDHEEN CHINAKKAL" */
            name?: string;
            mobile?: string | null;
            /**
             * Credit-weighted average days between a debit and whatever credit(s) paid it off, as of the last ledger sync (~10 min lag)
             * @example 0
             */
            avg_days_to_clear?: number;
            /** Sum of every debit entry ever synced for this customer, plus their pre-sync opening balance if captured (see `npm run ledger:sync:opening-balances`) - covers debt carried over from a legacy pre-rowbest system that can't be synced as individual entries, so this reconciles with the live outstanding balance instead of only reflecting locally-synced history. */
            total_debt_amount?: number;
            /** Sum of debt actually matched against a later credit (FIFO) */
            total_cleared_amount?: number;
            /** total_cleared_amount / total_debt_amount * 100 - how much of their history this average is based on */
            cleared_pct?: number;
            /** Current live balance, from LedgerCustomer */
            outstanding_balance?: number;
            outstanding_dr_cr?: "Dr" | "Cr";
            /**
             * Most recent actual Receipt voucher date, as of the last ledger sync - independent of the FIFO clearance calculation, contextualizes avg_days_to_clear with "have they paid recently?"
             * @format date-time
             * @example "2026-06-26T04:00:00.000Z"
             */
            last_payment_date?: string | null;
            /** @example 5000 */
            last_payment_amount?: number | null;
            days_since_last_payment?: number | null;
          }[];
          sort?: {
            sortBy?:
              | "avg_days_to_clear"
              | "total_debt_amount"
              | "total_cleared_amount"
              | "cleared_pct"
              | "outstanding_balance"
              | "days_since_last_payment";
            order?: "asc" | "desc";
          };
          summary?: {
            customers_ranked?: number;
            /** Cleared-amount-weighted average across all ranked customers */
            company_avg_days_to_clear?: number | null;
          };
        },
        void
      >({
        path: `/ledger/payment-velocity`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Aggregates customer dr/cr/balance by ledger group (e.g. Sundry Debtors) - managers only
     *
     * @tags Ledger
     * @name SummaryByGroupList
     * @summary Ledger balance summary by group
     * @request GET:/ledger/summary/by-group
     * @secure
     */
    summaryByGroupList: (params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/ledger/summary/by-group`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Ledger entries whose sales_executive name couldn't be matched to a Staff record - managers only
     *
     * @tags Ledger
     * @name UnmatchedList
     * @summary List entries with unresolved sales executive
     * @request GET:/ledger/unmatched
     * @secure
     */
    unmatchedList: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/ledger/unmatched`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description DB-only re-resolution pass against already-stored unmatched entries (no rowbest calls) - managers only
     *
     * @tags Ledger
     * @name ResolveUnmatchedCreate
     * @summary Re-run staff-name matching
     * @request POST:/ledger/resolve-unmatched
     * @secure
     */
    resolveUnmatchedCreate: (params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/ledger/resolve-unmatched`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Lightweight id+name list (sorted by name) of every staff member, for populating a "reassign to" dropdown alongside GET/PUT /ledger/mappings.
     *
     * @tags Ledger
     * @name MappingsStaffOptionsList
     * @summary List staff for the mapping-assignment dropdown (managers/superAdmin)
     * @request GET:/ledger/mappings/staff-options
     * @secure
     */
    mappingsStaffOptionsList: (params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /** @example 2645 */
            staff_id?: number;
            /** @example "ANAS" */
            name?: string;
          }[];
        },
        void
      >({
        path: `/ledger/mappings/staff-options`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Only customers with balance > 0 (see GET /ledger/outstanding for the same convention). `ownership_source` reflects the actual resolved owner - `assigned` (from the manually-maintained mapping, LedgerCustomer.assigned_staff_id) before the ownership cutoff date, or after it `dynamic` (derived from the customer's most recent matched Sales voucher) falling back to `assigned` if there's no dynamic signal yet, or `unassigned` if neither exists - see GET /ledger/staff/{userId}/outstanding for the same rule. Combine with `is_new` to find brand-new customers that still need a staff assignment.
     *
     * @tags Ledger
     * @name MappingsList
     * @summary List customer->staff assignments (managers/superAdmin)
     * @request GET:/ledger/mappings
     * @secure
     */
    mappingsList: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** Filter by customer name or assigned staff name */
        search?: string;
        /**
         * A customer is flagged `is_new` if first synced from rowbest (LedgerCustomer.createdAt) within this many days
         * @default 7
         */
        newDays?: number;
        /**
         * Filter `data` to a single resolved ownership_source
         * @default "all"
         */
        ownership?: "all" | "assigned" | "dynamic" | "unassigned";
        /**
         * Filter `data` by hold status - see PUT /ledger/customers/{ledgerId}/hold
         * @default "all"
         */
        hold?: "all" | "held" | "not_held";
        /**
         * `created_at` (default) surfaces the newest customers first with the default `order=desc` - i.e. "sort by new customers".
         * @default "created_at"
         */
        sortBy?: "created_at" | "balance" | "name";
        /** @default "desc" */
        order?: "asc" | "desc";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: {
            /** @example 688580 */
            ledger_id?: number;
            /** @example "C- ANEES" */
            name?: string;
            /** @example "Sundry Debtors" */
            group?: string;
            mobile?: string | null;
            balance?: number;
            assigned_staff_id?: number | null;
            assigned_staff_name?: string | null;
            ownership_source?: "assigned" | "dynamic" | "unassigned";
            /** First synced from rowbest within the last `newDays` days */
            is_new?: boolean;
            /**
             * When this customer was first synced from rowbest
             * @format date-time
             */
            created_at?: string;
            on_hold?: boolean;
            hold_reason?: string | null;
            held_by_staff_name?: string | null;
            /** @format date-time */
            held_at?: string | null;
          }[];
          newDays?: number;
          ownership?: "all" | "assigned" | "dynamic" | "unassigned";
          hold?: "all" | "held" | "not_held";
          sortBy?: "created_at" | "balance" | "name";
          order?: "asc" | "desc";
        },
        void
      >({
        path: `/ledger/mappings`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ledger
     * @name MappingsUpdate
     * @summary Reassign a customer to a different staff member (managers/superAdmin)
     * @request PUT:/ledger/mappings/{ledgerId}
     * @secure
     */
    mappingsUpdate: (
      ledgerId: number,
      data: {
        /**
         * Staff.id (internal id) of the new assignee
         * @example 2645
         */
        staffId: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            ledger_id?: number;
            name?: string;
            assigned_staff_id?: number;
            assigned_staff_name?: string;
          };
        },
        void
      >({
        path: `/ledger/mappings/${ledgerId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  followUps = {
    /**
     * @description Create a new follow-up record for a customer
     *
     * @tags Follow-ups
     * @name FollowupsCreate
     * @summary Log a follow-up
     * @request POST:/followups
     * @secure
     */
    followupsCreate: (
      data: {
        /** @example "CUST001" */
        customerId: string;
        /** @example "ABC Company" */
        customerName: string;
        /**
         * Optional. Rowbest ledger id (LedgerCustomer.ledger_id). If omitted, best-effort resolved server-side by matching customerName - pass it explicitly when known for a reliable join instead of relying on name matching.
         * @example 688580
         */
        ledgerId?: number;
        /** @example 2645 */
        staffId: number;
        /** @example 3027 */
        userId?: number;
        /** @example "ANAS" */
        staffName: string;
        /**
         * @format date-time
         * @example "2026-06-19T10:30:00Z"
         */
        loggedAt?: string;
        /** @example "phoneCall" */
        contactMethod: "phoneCall" | "sms" | "email" | "inPerson" | "whatsapp";
        /** @example "promisedToPay" */
        outcome:
          | "promisedToPay"
          | "promisedPartial"
          | "dispute"
          | "noResponse"
          | "reminderSent";
        /**
         * Ignored/overridden when outcome is promisedToPay - the server always sets it to the customer's current live outstanding balance in that case (promisedToPay means the full amount by definition; use promisedPartial for a custom figure)
         * @example 5000
         */
        promisedAmount?: number | null;
        /**
         * @format date
         * @example "2026-06-26"
         */
        promisedDate?: string | null;
        /**
         * @format date
         * @example "2026-06-25"
         */
        nextFollowUpDate?: string | null;
        /** @example ["Customer interested","Will call back"] */
        quickRemarks?: string[];
        /** @example "Customer is in a difficult situation" */
        freeTextRemark?: string | null;
        /** @example "Customer claims amount is incorrect" */
        disputeDetails?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Follow-up logged successfully" */
          message?: string;
          data?: FollowUpResponse;
        },
        ErrorResponse
      >({
        path: `/followups`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Follow-ups
     * @name FollowupsDetail
     * @summary Get follow-up by ID
     * @request GET:/followups/{id}
     * @secure
     */
    followupsDetail: (id: string, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          data?: FollowUpResponse;
        },
        void
      >({
        path: `/followups/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Follow-ups
     * @name FollowupsUpdate
     * @summary Update follow-up
     * @request PUT:/followups/{id}
     * @secure
     */
    followupsUpdate: (
      id: string,
      data: {
        outcome?:
          | "promisedToPay"
          | "promisedPartial"
          | "dispute"
          | "noResponse"
          | "reminderSent";
        /** Ignored/overridden if the resulting outcome (this update's, or the existing one if outcome isn't being changed) is promisedToPay - see POST /followups */
        promisedAmount?: number;
        /** @format date */
        promisedDate?: string;
        /** @format date */
        nextFollowUpDate?: string;
        freeTextRemark?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          message?: string;
          data?: FollowUpResponse;
        },
        void
      >({
        path: `/followups/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Follow-ups
     * @name FollowupsDelete
     * @summary Delete follow-up
     * @request DELETE:/followups/{id}
     * @secure
     */
    followupsDelete: (id: string, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/followups/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Records that a WhatsApp message was sent for this follow-up - the actual send happens client-side (e.g. via a WhatsApp deep link), this just logs it. Fire-and-forget from the frontend's perspective. Updates whatsapp.lastReceiptSentAt/lastReminderSentAt on the follow-up (see FollowUpResponse) so the card can show send status without an extra query, and appends a full audit entry.
     *
     * @tags Follow-ups
     * @name WhatsappCreate
     * @summary Log a WhatsApp message send
     * @request POST:/followups/{id}/whatsapp
     * @secure
     */
    whatsappCreate: (
      id: string,
      data: {
        /** @example 12 */
        staffId: number;
        type: "receipt" | "reminder";
        /** @example "919876543210" */
        mobile: string;
        /** @example 5000 */
        amountMentioned?: number | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            _id?: string;
            /** @format date-time */
            sentAt?: string;
          };
        },
        void
      >({
        path: `/followups/${id}/whatsapp`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description For sending a reminder to a customer who doesn't have any logged follow-up yet - creates a new FollowUpResponse representing the reminder itself (contactMethod: whatsapp, outcome: reminderSent) and immediately logs the WhatsApp send against it (same mechanism as POST /followups/{id}/whatsapp), so `sentAt` is captured and it shows up in the customer's normal follow-up history and stats. customerName/mobile/outstandingAmount are resolved from LedgerCustomer, not supplied by the caller.
     *
     * @tags Follow-ups
     * @name ReminderCreate
     * @summary Send a WhatsApp reminder without an existing follow-up (managers/superAdmin)
     * @request POST:/followups/reminder
     * @secure
     */
    reminderCreate: (
      data: {
        /**
         * Rowbest ledger id (LedgerCustomer.ledger_id)
         * @example 688580
         */
        ledgerId: number;
        /** @example 5000 */
        amountMentioned?: number | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          message?: string;
          data?: FollowUpResponse;
        },
        void
      >({
        path: `/followups/reminder`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Company-wide follow-up list, optionally narrowed to one staff via `staffId`. Same filter convention and `summary` block as GET /followups/staff/{staffId} - the only difference is `staffId` is optional here (omit it to see every staff member's follow-ups).
     *
     * @tags Follow-ups
     * @name GetFollowUps
     * @summary Get all follow-ups across all staff (managers/superAdmin)
     * @request GET:/followups/all
     * @secure
     */
    getFollowUps: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** Narrow to a single staff member (the same staffId convention as FollowUpResponse.staffId - a user_id, not an internal Staff.id) */
        staffId?: number;
        /**
         * Which date period/startDate/endDate applies to. Defaults to loggedAt (when the call was made).
         * @default "loggedAt"
         */
        dateField?: "loggedAt" | "promisedDate" | "resolvedAt";
        /** Shorthand date filter - `today`, `yesterday`, or `this_month`. Overrides startDate/endDate if given. */
        period?: "today" | "yesterday" | "this_month";
        /**
         * Custom range start (YYYY-MM-DD), ignored if period is set
         * @format date
         */
        startDate?: string;
        /**
         * Custom range end (YYYY-MM-DD), ignored if period is set
         * @format date
         */
        endDate?: string;
        /** Filter to a single customer by the legacy string customerId */
        customerId?: string;
        /** Filter to a single customer by ledger_id (takes precedence over customerId if both given) */
        ledgerId?: number;
        /** Filter to a single outcome */
        outcome?:
          | "promisedToPay"
          | "promisedPartial"
          | "dispute"
          | "noResponse"
          | "reminderSent";
        /** Filter by system-detected payment status - `resolved` means a real payment has landed for that customer since the follow-up was logged (resolvedByPayment=true), `open` means it hasn't yet. Independent of `outcome`. */
        resolutionStatus?: "resolved" | "open";
        /**
         * Field to sort by. promisedAmount/amountRecovered/ outstandingAmount all push follow-ups with no value for that field (e.g. amountRecovered on one that's still open) to the end regardless of `order`.
         * @default "loggedAt"
         */
        sortBy?:
          | "loggedAt"
          | "promisedAmount"
          | "amountRecovered"
          | "outstandingAmount";
        /** @default "desc" */
        order?: "asc" | "desc";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: FollowUpResponse[];
          sortBy?:
            | "loggedAt"
            | "promisedAmount"
            | "amountRecovered"
            | "outstandingAmount";
          order?: "asc" | "desc";
          /** Same shape as GET /followups/staff/{staffId}'s summary, computed over the filtered set (all staff, or just staffId if given) */
          summary?: {
            totalFollowUps?: number;
            byOutcome?: Record<string, number>;
            byResolution?: {
              resolved?: number;
              open?: number;
            };
            totalFollowedUpAmount?: number;
            totalPromisedAmount?: number;
            totalPaidAmount?: number;
          };
        },
        void
      >({
        path: `/followups/all`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description If this customer is on hold (see PUT /ledger/customers/{ledgerId}/hold), staff get a 404 - full invisibility, same as a nonexistent customer - managers/superAdmin are unaffected.
     *
     * @tags Follow-ups
     * @name CustomerDetail
     * @summary Get follow-ups by customer
     * @request GET:/followups/customer/{customerId}
     * @secure
     */
    customerDetail: (
      customerId: string,
      query?: {
        /** @default 50 */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          count?: number;
          /** This customer's current live outstanding balance (not the per-follow-up snapshot in FollowUpResponse.outstandingAmount, which can go stale). Resolved via ledgerId off any of the returned follow-ups, falling back to treating customerId itself as a ledger_id. Null if no matching LedgerCustomer is found. */
          outstanding?: {
            /** @example 688315 */
            ledger_id?: number;
            /** @example 24595 */
            outstanding_balance?: number;
            outstanding_dr_cr?: "Dr" | "Cr";
          } | null;
          data?: FollowUpResponse[];
        },
        void
      >({
        path: `/followups/customer/${customerId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff can only access their own, managers can access any. Returns a paginated list plus a `summary` block (outcome breakdown, resolved/open counts, promised/recovered totals) computed over the same filtered set, not just the current page.
     *
     * @tags Follow-ups
     * @name StaffDetail
     * @summary Get follow-ups by staff, with filters and a summary
     * @request GET:/followups/staff/{staffId}
     * @secure
     */
    staffDetail: (
      staffId: number,
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /**
         * Which date period/startDate/endDate applies to. Defaults to loggedAt (when the call was made).
         * @default "loggedAt"
         */
        dateField?: "loggedAt" | "promisedDate" | "resolvedAt";
        /** Shorthand date filter - `today`, `yesterday`, or `this_month`. Overrides startDate/endDate if both given. */
        period?: "today" | "yesterday" | "this_month";
        /**
         * Custom range start (YYYY-MM-DD), ignored if period is set
         * @format date
         */
        startDate?: string;
        /**
         * Custom range end (YYYY-MM-DD), ignored if period is set
         * @format date
         */
        endDate?: string;
        /** Filter to a single customer by the legacy string customerId */
        customerId?: string;
        /** Filter to a single customer by ledger_id (takes precedence over customerId if both given) */
        ledgerId?: number;
        /** Filter to a single outcome (e.g. noResponse) */
        outcome?:
          | "promisedToPay"
          | "promisedPartial"
          | "dispute"
          | "noResponse"
          | "reminderSent";
        /** Filter by system-detected payment status - `resolved` means a real payment has landed for that customer since the follow-up was logged (resolvedByPayment=true), `open` means it hasn't yet. Independent of `outcome`. */
        resolutionStatus?: "resolved" | "open";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: FollowUpResponse[];
          /** Two independent classifications - byOutcome is human-entered, byResolution is system-detected. A follow-up can be `open` in byResolution while its outcome is anything, or `resolved` while its outcome is still e.g. promisedToPay if the staff never updated it after payment landed. */
          summary?: {
            totalFollowUps?: number;
            /** What the staff member selected when logging the call */
            byOutcome?: {
              promisedToPay?: number;
              promisedPartial?: number;
              dispute?: number;
              noResponse?: number;
              reminderSent?: number;
            };
            /** Whether the ledger sync has detected a real payment for this customer since the follow-up was logged */
            byResolution?: {
              resolved?: number;
              open?: number;
            };
            /** Sum of each customer's outstanding balance at the moment they were followed up on */
            totalFollowedUpAmount?: number;
            totalPromisedAmount?: number;
            /** Sum of amountRecovered across resolved follow-ups - actual money collected as a result */
            totalPaidAmount?: number;
          };
        },
        void
      >({
        path: `/followups/staff/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve aggregated follow-up statistics for all staff (MANAGER ONLY)
     *
     * @tags Follow-ups
     * @name StatsTotalList
     * @summary Get total follow-up summary across all staff
     * @request GET:/followups/stats/total
     * @secure
     */
    statsTotalList: (
      query?: {
        /**
         * Which date period/startDate/endDate applies to. Defaults to loggedAt (when the call was made).
         * @default "loggedAt"
         */
        dateField?: "loggedAt" | "promisedDate" | "resolvedAt";
        /** Shorthand date filter - `today`, `yesterday`, or `this_month`. Overrides startDate/endDate if given. */
        period?: "today" | "yesterday" | "this_month";
        /**
         * Custom range start (YYYY-MM-DD), ignored if period is set
         * @format date
         */
        startDate?: string;
        /**
         * Custom range end (YYYY-MM-DD), ignored if period is set
         * @format date
         */
        endDate?: string;
        /** Filter to a single outcome */
        outcome?:
          | "promisedToPay"
          | "promisedPartial"
          | "dispute"
          | "noResponse"
          | "reminderSent";
        /** Filter by system-detected payment status - `resolved` means a real payment has landed for that customer since the follow-up was logged (resolvedByPayment=true), `open` means it hasn't yet. Independent of `outcome`. */
        resolutionStatus?: "resolved" | "open";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            totalFollowUps?: number;
            uniqueStaffCount?: number;
            uniqueCustomerCount?: number;
            byOutcome?: {
              promisedToPay?: number;
              promisedPartial?: number;
              dispute?: number;
              noResponse?: number;
              reminderSent?: number;
            };
            byResolution?: {
              resolved?: number;
              open?: number;
            };
            totalFollowedUpAmount?: number;
            totalPromisedAmount?: number;
            totalPaidAmount?: number;
          };
        },
        void
      >({
        path: `/followups/stats/total`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve aggregated follow-up statistics for a staff member (Managers can view any staff, staff can only view their own)
     *
     * @tags Follow-ups
     * @name StatsSummaryDetail
     * @summary Get follow-up summary for specific staff
     * @request GET:/followups/stats/summary/{staffId}
     * @secure
     */
    statsSummaryDetail: (
      staffId: number,
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          /** Two independent classifications - byOutcome is human-entered, byResolution is system-detected (see /followups/staff/{staffId}) */
          data?: {
            totalFollowUps?: number;
            byOutcome?: {
              promisedToPay?: number;
              promisedPartial?: number;
              dispute?: number;
              noResponse?: number;
              reminderSent?: number;
            };
            byResolution?: {
              resolved?: number;
              open?: number;
            };
            totalFollowedUpAmount?: number;
            totalPromisedAmount?: number;
            totalPaidAmount?: number;
          };
        },
        void
      >({
        path: `/followups/stats/summary/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  notifications = {
    /**
     * @description Staff can only access their own, managers can access any. Newest first.
     *
     * @tags Notifications
     * @name StaffDetail
     * @summary Get a staff member's notifications
     * @request GET:/notifications/staff/{userId}
     * @secure
     */
    staffDetail: (
      userId: number,
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** @default false */
        unread_only?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          unread_count?: number;
          data?: NotificationResponse[];
        },
        void
      >({
        path: `/notifications/staff/${userId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff can only access their own, managers can access any
     *
     * @tags Notifications
     * @name StaffUnreadCountList
     * @summary Get a staff member's unread notification count
     * @request GET:/notifications/staff/{userId}/unread-count
     * @secure
     */
    staffUnreadCountList: (userId: number, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            unread_count?: number;
          };
        },
        void
      >({
        path: `/notifications/staff/${userId}/unread-count`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff can only access their own, managers can access any
     *
     * @tags Notifications
     * @name StaffReadAllUpdate
     * @summary Mark all of a staff member's notifications as read
     * @request PUT:/notifications/staff/{userId}/read-all
     * @secure
     */
    staffReadAllUpdate: (userId: number, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            updated?: number;
          };
        },
        void
      >({
        path: `/notifications/staff/${userId}/read-all`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Ownership is enforced against the authenticated user's own staff record, not a URL param
     *
     * @tags Notifications
     * @name ReadUpdate
     * @summary Mark a single notification as read
     * @request PUT:/notifications/{id}/read
     * @secure
     */
    readUpdate: (id: string, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          data?: NotificationResponse;
        },
        void
      >({
        path: `/notifications/${id}/read`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  dashboard = {
    /**
     * @description Totals across the whole company plus a per-staff leaderboard, sorted by outstanding balance descending. Outstanding balances are always current/live; the follow-up numbers (byOutcome, byResolution, totalPromisedAmount, etc.) are scoped to the date range.
     *
     * @tags Dashboard
     * @name OverviewList
     * @summary Company-wide overview for managers/superAdmin
     * @request GET:/dashboard/overview
     * @secure
     */
    overviewList: (
      query?: {
        /**
         * Which date period/startDate/endDate applies to. Defaults to loggedAt (when the call was made).
         * @default "loggedAt"
         */
        dateField?: "loggedAt" | "promisedDate" | "resolvedAt";
        /** Shorthand date filter for the follow-up numbers. Defaults to this_month if neither period nor startDate/endDate is given. */
        period?: "today" | "yesterday" | "this_month";
        /**
         * Custom range start (YYYY-MM-DD), ignored if period is set
         * @format date
         */
        startDate?: string;
        /**
         * Custom range end (YYYY-MM-DD), ignored if period is set
         * @format date
         */
        endDate?: string;
        /** Filter the follow-up numbers to a single outcome */
        outcome?:
          | "promisedToPay"
          | "promisedPartial"
          | "dispute"
          | "noResponse"
          | "reminderSent";
        /** Filter the follow-up numbers by system-detected payment status - `resolved` means a real payment has landed for that customer since the follow-up was logged (resolvedByPayment=true), `open` means it hasn't yet. Independent of `outcome`. */
        resolutionStatus?: "resolved" | "open";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /** @format date-time */
            generated_at?: string;
            period?: {
              /** @format date-time */
              startDate?: string | null;
              /** @format date-time */
              endDate?: string | null;
              dateField?: "loggedAt" | "promisedDate" | "resolvedAt";
            };
            totals?: {
              total_staff?: number;
              /** All Sundry Debtors customers, regardless of current balance */
              total_customers?: number;
              /** Sundry Debtors customers with a positive (Dr) live balance - i.e. actually owing money right now */
              customers_with_debt?: number;
              /** Sum of balance (dr - cr) across all Sundry Debtors customers, live/current */
              total_outstanding?: number;
            };
            /** Company-wide, same shape as /followups/stats/total */
            followups?: {
              totalFollowUps?: number;
              uniqueStaffCount?: number;
              uniqueCustomerCount?: number;
              byOutcome?: Record<string, number>;
              byResolution?: {
                resolved?: number;
                open?: number;
              };
              totalFollowedUpAmount?: number;
              totalPromisedAmount?: number;
              totalPaidAmount?: number;
            };
            notifications?: {
              sent_in_period?: number;
              /** Across all staff, all-time (not scoped to the date range) */
              unread_total?: number;
            };
            /** One entry per staff member, sorted by total_outstanding descending */
            staff_leaderboard?: {
              staff_id?: number;
              user_id?: number;
              staff_name?: string;
              customers_owned?: number;
              /** Owned customers with a positive (Dr) live balance - i.e. actually owing money right now */
              customers_with_debt?: number;
              total_outstanding?: number;
              totalFollowUps?: number;
              byOutcome?: Record<string, number>;
              byResolution?: {
                resolved?: number;
                open?: number;
              };
              totalFollowedUpAmount?: number;
              totalPromisedAmount?: number;
              totalPaidAmount?: number;
            }[];
          };
        },
        void
      >({
        path: `/dashboard/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  attendance = {
    /**
     * @description Requires a department scanning-device login (role scanner - see POST /auth/scanning-devices), camera-first, no staff pre-selected. Runs face recognition against staff belonging to the scanner's department (plus any staff flagged canScanAnyDepartment, e.g. drivers) to identify the closest match, then automatically toggles check-in/check-out based on that staff member's existing sessions for the day. lat/lng are mandatory and are compared against the scanning device's configured location - scans outside its allowed radius are still recorded (not blocked) but returned/stored with locationVerified: false for fraud review. Duplicate/too-soon scans are rejected server-side using the existing fraud-prevention gap (MIN_GAP_FOR_CHECKOUT / MIN_GAP_FOR_NEW_SESSION) - in that case the response has matched: true but success: false with an error message, and no action/attendance fields.
     *
     * @tags Attendance
     * @name ScanCreate
     * @summary Scan a face photo for attendance (check-in/check-out)
     * @request POST:/attendance/scan
     * @secure
     */
    scanCreate: (
      data: {
        /**
         * JPEG/PNG/WEBP photo captured from the device camera (max 5MB by default)
         * @format binary
         */
        photo: File;
        /**
         * ISO timestamp of the scan
         * @format date-time
         */
        timestamp: string;
        /**
         * Current GPS latitude reported by the scanning device
         * @example 11.2588
         */
        lat: number;
        /**
         * Current GPS longitude reported by the scanning device
         * @example 75.7804
         */
        lng: number;
        /** Optional client-supplied identifier of the physical scanning device */
        deviceId?: string;
        /** Optional client-supplied human-readable name of the physical scanning device */
        deviceName?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          matched?: boolean;
          staff?: {
            id?: number;
            name?: string;
          };
          /** 0-1 similarity score, shown as a rounded percentage in the UI */
          confidence?: number;
          /** Present when matched is false */
          reason?: "no_match" | "low_confidence" | "no_face_detected";
          /** Present when success is false (no-match, no-face, or a matched-but-rejected scan e.g. duplicate/too-soon) */
          error?: string;
          /** Present when matched is true and the scan was accepted */
          action?: "checkIn" | "checkOut";
          /** Present when matched is true and the scan was accepted - false if the scan's lat/lng was outside the scanning device's configured radius (not blocked, only flagged) */
          locationVerified?: boolean;
          /** Present when matched is true and the scan was accepted - that staff member's updated day summary */
          attendance?: {
            id?: string;
            staffId?: number;
            date?: string;
            sessionCount?: number;
            sessions?: {
              sessionNumber?: number;
              /** @format date-time */
              checkIn?: string;
              /** @format date-time */
              checkOut?: string | null;
              workHours?: number | null;
              /** True if checkout was never scanned and the session was force-closed by the nightly stale-session cleanup job */
              autoClosed?: boolean;
            }[];
            totalWorkHours?: number | null;
            totalBreakTime?: number | null;
            status?: "present" | "late" | "absent";
            isOnLeave?: boolean;
            leaveType?: string | null;
          };
        },
        void
      >({
        path: `/attendance/scan`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * @description Requires a scanner-role login (see POST /auth/scanning-devices). Returns the most recent check-in/check-out events recorded today by this device's department, newest first - lets the staff member standing at the device confirm their scan just registered correctly.
     *
     * @tags Attendance
     * @name ScansRecentList
     * @summary Recent scans recorded by the calling scanning device's department
     * @request GET:/attendance/scans/recent
     * @secure
     */
    scansRecentList: (
      query?: {
        /**
         * Max number of events to return
         * @max 100
         * @default 20
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example 5 */
          count?: number;
          data?: {
            staffId?: number;
            staffName?: string;
            action?: "checkIn" | "checkOut";
            /** @format date-time */
            timestamp?: string;
            /** 0-1 face-match similarity score for this scan */
            confidence?: number;
            /** False if this scan's lat/lng was outside the device's configured radius */
            locationVerified?: boolean;
          }[];
        },
        void
      >({
        path: `/attendance/scans/recent`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Uploads one face photo for a specific pose (straight, left, or right), extracts its descriptor, and stores it as that pose's reference photo - re-enrolling the same pose replaces the previous photo/descriptor for it. The pose label is provided by the client and is NOT server-validated (no pose/landmark checking is performed) - it's used only for bookkeeping so a staff member becomes scan-eligible (readyForAttendance) once all three required poses (straight, left, right) have been enrolled. Requires owner, manager, or superAdmin role.
     *
     * @tags Attendance
     * @name EnrollCreate
     * @summary Enroll (or replace) a staff member's reference photo for one pose
     * @request POST:/attendance/enroll/{staffId}
     * @secure
     */
    enrollCreate: (
      staffId: number,
      data: {
        /**
         * JPEG/PNG/WEBP photo with a single clear, well-lit face (max 5MB by default)
         * @format binary
         */
        photo: File;
        /** Which pose this photo represents - client-labeled, not server-validated */
        pose: "straight" | "left" | "right";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          message?: string;
          staffId?: number;
          pose?: "straight" | "left" | "right";
          photoCount?: number;
          posesCaptured?: ("straight" | "left" | "right")[];
          posesRemaining?: ("straight" | "left" | "right")[];
          /** True once straight, left, and right have all been enrolled */
          readyForAttendance?: boolean;
        },
        void
      >({
        path: `/attendance/enroll/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * @description Removes all enrolled reference photos/descriptors for a staff member. They can re-enroll afterward. Staff can only clear their own enrollment; owner, manager, or superAdmin can clear any staff member's enrollment.
     *
     * @tags Attendance
     * @name EnrollDelete
     * @summary Delete a staff member's enrolled photo(s)
     * @request DELETE:/attendance/enroll/{staffId}
     * @secure
     */
    enrollDelete: (staffId: number, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
        },
        void
      >({
        path: `/attendance/enroll/${staffId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve attendance records for a specific date. Shows all staff with their attendance status (present/absent/late) including multiple sessions per day. Managers can view all, staff can only view own.
     *
     * @tags Attendance
     * @name AttendanceList
     * @summary Get attendance records by date
     * @request GET:/attendance
     * @secure
     */
    attendanceList: (
      query: {
        /**
         * @format date
         * @example "2026-06-29"
         */
        date: string;
        /** @example 2645 */
        staffId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          /** @example "2026-06-29" */
          date?: string;
          summary?: {
            /** @example 45 */
            present?: number;
            /** @example 5 */
            absent?: number;
            /** @example 3 */
            late?: number;
          };
          data?: {
            staffId?: number;
            staffName?: string;
            /** Number of check-in/check-out sessions */
            sessionCount?: number;
            /** Multiple sessions for breaks and meals */
            sessions?: object[];
            totalWorkHours?: number | null;
            totalBreakTime?: number | null;
            /**
             * Early-arrival (>=15 min before shift start) plus late-checkout (past the shift's overtime threshold) minutes, combined - computed but not yet credited until approved
             * @example 20
             */
            pendingOvertimeMinutes?: number;
            /**
             * 0 until a manager/HR/superAdmin approves this day's overtime via PATCH /attendance/{staffId}/{date}/overtime-approval - this is the only figure counted in reports/dashboards
             * @example 0
             */
            approvedOvertimeMinutes?: number;
            /**
             * none if pendingOvertimeMinutes is 0 for the day
             * @example "pending"
             */
            overtimeApprovalStatus?:
              | "none"
              | "pending"
              | "approved"
              | "rejected";
            /**
             * Minutes late vs the staff's assigned shift start time (0 if on-time or early)
             * @example 0
             */
            lateMinutes?: number;
            /** The session gap (if any) starting within the 10:00-11:30 window */
            teaBreak?: {
              /**
               * Checkout time of the session before the break; null if no gap fell in the tea-break window that day
               * @format date-time
               * @example "2026-06-22T03:30:00.000Z"
               */
              startTime?: string | null;
              /**
               * Check-in time of the session after the break; null if no gap fell in the tea-break window that day
               * @format date-time
               * @example "2026-06-22T03:45:00.000Z"
               */
              endTime?: string | null;
              /**
               * Measured gap length; null if no gap fell in the tea-break window that day
               * @example 15
               */
              minutes?: number | null;
              /** @example 10 */
              allowanceMinutes?: number;
              /** @example 5 */
              excessMinutes?: number;
            };
            /** The session gap (if any) starting at/after 11:30. Allowance is 120 minutes on Friday, 30 minutes other days. */
            lunchBreak?: {
              /**
               * Checkout time of the session before the break; null if no gap fell in the lunch-break window that day
               * @format date-time
               * @example "2026-06-22T08:31:00.000Z"
               */
              startTime?: string | null;
              /**
               * Check-in time of the session after the break; null if no gap fell in the lunch-break window that day
               * @format date-time
               * @example "2026-06-22T08:56:00.000Z"
               */
              endTime?: string | null;
              /** @example 45 */
              minutes?: number | null;
              /** @example 30 */
              allowanceMinutes?: number;
              /** @example 15 */
              excessMinutes?: number;
            };
            status?: "present" | "absent" | "late" | "half-day";
            isOnLeave?: boolean;
            leaveType?: string | null;
          }[];
        },
        void
      >({
        path: `/attendance`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Overwrites a day's check-in/check-out sessions (e.g. staff forgot to check in/out) and recomputes totals, lateness, overtime, and break-excess for that day. Every edit is appended to the record's audit trail (editor, role, timestamp, before/after snapshot, reason). If the recomputed overtime minutes differ from before, any prior approval decision is reset to pending - see PATCH /attendance/{staffId}/{date}/overtime-approval. Permissions (nobody may edit their own session, regardless of role): - manager/HR may edit STAFF sessions only (not each other's, not their own) - superAdmin may edit STAFF, MANAGER, and HR sessions (not their own)
     *
     * @tags Attendance
     * @name SessionsPartialUpdate
     * @summary Manually edit a staff member's sessions for a day
     * @request PATCH:/attendance/{staffId}/{date}/sessions
     * @secure
     */
    sessionsPartialUpdate: (
      staffId: number,
      date: string,
      data: {
        /** Full replacement list of sessions for the day, sorted by checkIn automatically */
        sessions: {
          /**
           * @format date-time
           * @example "2026-06-29T02:55:00.000Z"
           */
          checkIn: string;
          /**
           * @format date-time
           * @example "2026-06-29T13:00:00.000Z"
           */
          checkOut?: string | null;
        }[];
        /** @example "Forgot to check out - corrected by manager" */
        reason?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** The recomputed attendance record for that day (same shape as an item in GET /attendance's data array) */
          data?: object;
        },
        ErrorResponse
      >({
        path: `/attendance/${staffId}/${date}/sessions`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Overtime is computed from shift rules (early arrival + late checkout) but never auto-credited - it sits as pendingOvertimeMinutes with overtimeApprovalStatus: pending until a manager/HR/superAdmin explicitly approves or rejects it here. Approving sets approvedOvertimeMinutes to approvedMinutes if given (letting a manager credit only part of the computed minutes - e.g. discounting an implausible late checkout - without editing the underlying sessions), clamped to [0, pendingOvertimeMinutes]; otherwise the full pendingOvertimeMinutes is credited. Rejecting always sets it to 0. Fails with 400 if there is no pending overtime to decide on (e.g. already decided, or nothing computed that day). Permissions (nobody may decide on their own overtime, regardless of role): - manager/HR may decide on STAFF overtime only (not each other's, not their own) - superAdmin may decide on STAFF, MANAGER, and HR overtime (not their own)
     *
     * @tags Attendance
     * @name OvertimeApprovalPartialUpdate
     * @summary Approve or reject a staff member's pending overtime for a day
     * @request PATCH:/attendance/{staffId}/{date}/overtime-approval
     * @secure
     */
    overtimeApprovalPartialUpdate: (
      staffId: number,
      date: string,
      data: {
        /** @example true */
        approved: boolean;
        /**
         * Optional partial credit when approved is true - clamped to [0, pendingOvertimeMinutes]. Omit to credit the full pendingOvertimeMinutes. Ignored when approved is false.
         * @example 45
         */
        approvedMinutes?: number;
        /** @example "Confirmed with staff - stayed to finish closing stock count" */
        reason?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** The updated attendance record for that day (same shape as an item in GET /attendance's data array) */
          data?: object;
        },
        ErrorResponse
      >({
        path: `/attendance/${staffId}/${date}/overtime-approval`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve aggregated attendance statistics for a specific date for dashboard view. Includes counts of present/absent/late/on leave staff, total and average work hours, break time, and attendance rate. Accessible only to managers, HR, and super admins.
     *
     * @tags Attendance
     * @name SummaryDetail
     * @summary Get attendance summary for dashboard
     * @request GET:/attendance/summary/{date}
     * @secure
     */
    summaryDetail: (date: string, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          /** @example "2026-06-29" */
          date?: string;
          /** @example 50 */
          totalStaff?: number;
          /** @example 45 */
          presentCount?: number;
          /** @example 3 */
          absentCount?: number;
          /** @example 2 */
          lateCount?: number;
          /** @example 0 */
          onLeaveCount?: number;
          /**
           * @format float
           * @example 360.5
           */
          totalWorkHours?: number;
          /**
           * @format float
           * @example 45
           */
          totalBreakTime?: number;
          /**
           * @format float
           * @example 8
           */
          averageWorkHours?: number;
          /**
           * @format float
           * @example 1
           */
          averageBreakTime?: number;
          /**
           * @format float
           * @example 94
           */
          attendanceRate?: number;
        },
        void
      >({
        path: `/attendance/summary/${date}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve a comprehensive attendance dashboard for a date range - daily trend, per-staff breakdown, leave overlay, and late/overtime/absence flags. Approved leaves within the range are cross-referenced so staff on leave aren't counted as absent. Accessible only to managers, HR, and super admins.
     *
     * @tags Attendance
     * @name DashboardList
     * @summary Get full attendance dashboard for a date range
     * @request GET:/attendance/dashboard
     * @secure
     */
    dashboardList: (
      query: {
        /**
         * @format date
         * @example "2026-06-01"
         */
        startDate: string;
        /**
         * @format date
         * @example "2026-06-30"
         */
        endDate: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: {
              /** @example "2026-06-01" */
              start?: string;
              /** @example "2026-06-30" */
              end?: string;
              /** @example 30 */
              days?: number;
            };
            /** @example 50 */
            totalStaff?: number;
            summary?: {
              /** @example 1200 */
              totalPresent?: number;
              /** @example 80 */
              totalLate?: number;
              /**
               * Days converted to a half-day leave (4th+ occurrence in a month of arriving >=30 min late)
               * @example 6
               */
              totalHalfDay?: number;
              /** @example 150 */
              totalAbsent?: number;
              /** @example 70 */
              totalOnLeave?: number;
              /**
               * @format float
               * @example 92.5
               */
              overallAttendanceRate?: number;
            };
            /** Daily attendance counts and rate across the range. Sundays are excluded entirely (weekly holiday). */
            trend?: {
              /** @example "2026-06-01" */
              date?: string;
              /** @example 45 */
              present?: number;
              /** @example 2 */
              late?: number;
              /** @example 1 */
              halfDay?: number;
              /** @example 1 */
              absent?: number;
              /** @example 2 */
              onLeave?: number;
              /**
               * @format float
               * @example 94
               */
              attendanceRate?: number;
            }[];
            /** Per-staff totals over the range, sorted by attendance rate ascending */
            staffBreakdown?: {
              /** @example 12 */
              staffId?: number;
              /** @example "Jane Doe" */
              staffName?: string;
              /** @example 22 */
              presentDays?: number;
              /** @example 3 */
              lateDays?: number;
              /** @example 1 */
              halfDayDays?: number;
              /** @example 2 */
              absentDays?: number;
              /** @example 3 */
              onLeaveDays?: number;
              /**
               * @format float
               * @example 176.5
               */
              totalWorkHours?: number;
              /**
               * Sum of approvedOvertimeMinutes over the range - the only overtime figure that should feed payroll/reports
               * @example 270
               */
              totalApprovedOvertimeMinutes?: number;
              /**
               * Sum of pendingOvertimeMinutes for days still awaiting an approval decision (approved/rejected days are excluded)
               * @example 45
               */
              totalPendingOvertimeMinutes?: number;
              /** @example 30 */
              totalTeaBreakExcessMinutes?: number;
              /** @example 90 */
              totalLunchBreakExcessMinutes?: number;
              /**
               * Days where a session was auto-closed by the stale-session cleanup job due to a missing checkout
               * @example 1
               */
              missedCheckoutDays?: number;
              /**
               * @format float
               * @example 83.33
               */
              attendanceRate?: number;
            }[];
            /** Staff flagged for attention within the range */
            flags?: {
              /** Staff with 3 or more late days in the range */
              chronicallyLate?: {
                /** @example 12 */
                staffId?: number;
                /** @example "Jane Doe" */
                staffName?: string;
                /** @example 4 */
                lateDays?: number;
              }[];
              /** Staff with 600 or more approved overtime minutes (10+ hours) in the range */
              excessiveOvertime?: {
                /** @example 12 */
                staffId?: number;
                /** @example "Jane Doe" */
                staffName?: string;
                /** @example 750 */
                totalApprovedOvertimeMinutes?: number;
              }[];
              /** Staff with any overtime still awaiting an approve/reject decision in the range */
              pendingOvertimeApprovals?: {
                /** @example 12 */
                staffId?: number;
                /** @example "Jane Doe" */
                staffName?: string;
                /** @example 45 */
                totalPendingOvertimeMinutes?: number;
              }[];
              /** Staff with 3 or more absent days in the range */
              frequentAbsentees?: {
                /** @example 12 */
                staffId?: number;
                /** @example "Jane Doe" */
                staffName?: string;
                /** @example 5 */
                absentDays?: number;
              }[];
              /** Staff with 2 or more days where a session was auto-closed due to a missing checkout */
              missedCheckouts?: {
                /** @example 12 */
                staffId?: number;
                /** @example "Jane Doe" */
                staffName?: string;
                /** @example 2 */
                missedCheckoutDays?: number;
              }[];
              /** Staff with 60 or more combined tea+lunch break excess minutes in the range */
              excessiveBreaks?: {
                /** @example 12 */
                staffId?: number;
                /** @example "Jane Doe" */
                staffName?: string;
                /** @example 120 */
                totalBreakExcessMinutes?: number;
              }[];
            };
          };
        },
        void
      >({
        path: `/attendance/dashboard`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve staff member's own attendance history for a date range. Includes multiple sessions per day with break tracking.
     *
     * @tags Attendance
     * @name MyHistoryList
     * @summary Get personal attendance history
     * @request GET:/attendance/my-history
     * @secure
     */
    myHistoryList: (
      query: {
        /**
         * @format date
         * @example "2026-06-01"
         */
        startDate: string;
        /**
         * @format date
         * @example "2026-06-30"
         */
        endDate: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            name?: string;
            period?: {
              start?: string;
              end?: string;
            };
            summary?: {
              presentDays?: number;
              absentDays?: number;
              lateDays?: number;
              halfDayDays?: number;
              totalWorkHours?: number;
              totalBreakTime?: number;
              /** Sum of approvedOvertimeMinutes over the range */
              totalApprovedOvertimeMinutes?: number;
              /** Sum of pendingOvertimeMinutes for days still awaiting an approval decision */
              totalPendingOvertimeMinutes?: number;
              totalTeaBreakExcessMinutes?: number;
              totalLunchBreakExcessMinutes?: number;
            };
            records?: {
              date?: string;
              /** Number of sessions (breaks/meals) */
              sessionCount?: number;
              /** Detailed session breakdown */
              sessions?: object[];
              totalWorkHours?: number;
              totalBreakTime?: number;
              lateMinutes?: number;
              pendingOvertimeMinutes?: number;
              approvedOvertimeMinutes?: number;
              overtimeApprovalStatus?:
                | "none"
                | "pending"
                | "approved"
                | "rejected";
              teaBreakMinutes?: number | null;
              teaBreakExcessMinutes?: number;
              lunchBreakMinutes?: number | null;
              lunchBreakExcessMinutes?: number;
              status?: "present" | "absent" | "late" | "half-day";
            }[];
          };
        },
        any
      >({
        path: `/attendance/my-history`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  shifts = {
    /**
     * @description Retrieve all defined shifts (name, startTime/endTime1/endTime2). Manager/HR/superAdmin only.
     *
     * @tags Shifts
     * @name ShiftsList
     * @summary List all shifts
     * @request GET:/shifts
     * @secure
     */
    shiftsList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example 7 */
          count?: number;
          data?: ShiftResponse[];
        },
        ErrorResponse
      >({
        path: `/shifts`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new shift definition. Manager/HR/superAdmin only.
     *
     * @tags Shifts
     * @name ShiftsCreate
     * @summary Create a shift
     * @request POST:/shifts
     * @secure
     */
    shiftsCreate: (
      data: {
        /** @example "Morning Shift" */
        name: string;
        /**
         * 24hr "HH:mm"
         * @example "08:30"
         */
        startTime: string;
        /** @example "17:30" */
        endTime1: string;
        /** @example "17:30" */
        endTime2: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: ShiftResponse;
        },
        ErrorResponse
      >({
        path: `/shifts`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Shifts
     * @name ShiftsDetail
     * @summary Get a shift by ID
     * @request GET:/shifts/{id}
     * @secure
     */
    shiftsDetail: (id: string, params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: ShiftResponse;
        },
        ErrorResponse
      >({
        path: `/shifts/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a shift's name and/or hours. Applies to every staff member currently assigned to this shift.
     *
     * @tags Shifts
     * @name ShiftsPartialUpdate
     * @summary Update a shift
     * @request PATCH:/shifts/{id}
     * @secure
     */
    shiftsPartialUpdate: (
      id: string,
      data: {
        /** @example "Morning Shift" */
        name?: string;
        /** @example "08:30" */
        startTime?: string;
        /** @example "17:30" */
        endTime1?: string;
        /** @example "17:30" */
        endTime2?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: ShiftResponse;
        },
        ErrorResponse
      >({
        path: `/shifts/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  departments = {
    /**
     * @description Retrieve all defined departments. Manager/HR/superAdmin only.
     *
     * @tags Departments
     * @name DepartmentsList
     * @summary List all departments
     * @request GET:/departments
     * @secure
     */
    departmentsList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example 3 */
          count?: number;
          data?: DepartmentResponse[];
        },
        ErrorResponse
      >({
        path: `/departments`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new department. Manager/HR/superAdmin only.
     *
     * @tags Departments
     * @name DepartmentsCreate
     * @summary Create a department
     * @request POST:/departments
     * @secure
     */
    departmentsCreate: (
      data: {
        /** @example "Packing" */
        name: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: DepartmentResponse;
        },
        ErrorResponse
      >({
        path: `/departments`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Departments
     * @name DepartmentsDetail
     * @summary Get a department by ID
     * @request GET:/departments/{id}
     * @secure
     */
    departmentsDetail: (id: string, params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: DepartmentResponse;
        },
        ErrorResponse
      >({
        path: `/departments/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Rename a department. Applies to every staff member currently assigned to it.
     *
     * @tags Departments
     * @name DepartmentsPartialUpdate
     * @summary Update a department
     * @request PATCH:/departments/{id}
     * @secure
     */
    departmentsPartialUpdate: (
      id: string,
      data: {
        /** @example "Packing" */
        name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: DepartmentResponse;
        },
        ErrorResponse
      >({
        path: `/departments/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  leaves = {
    /**
     * @description Staff requests a leave. Requires approval from a manager or superAdmin. 1 leave per month is recommended; requests beyond that are still allowed but go through approval and may incur a score deduction unless exempted. Maximum 12 leaves per year.
     *
     * @tags Leaves
     * @name RequestCreate
     * @summary Request a leave
     * @request POST:/leaves/request
     * @secure
     */
    requestCreate: (
      data: {
        /**
         * Leave start date (IST)
         * @format date
         * @example "2026-07-01"
         */
        startDate: string;
        /**
         * Leave end date (inclusive)
         * @format date
         * @example "2026-07-03"
         */
        endDate: string;
        /** @example "Personal" */
        leaveType: "Personal" | "Medical";
        /** @example "Family vacation" */
        reason: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            id?: string;
            /** @example "pending" */
            status?: string;
            numberOfDays?: number;
            remainingLeaves?: number;
          };
        },
        void
      >({
        path: `/leaves/request`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve personal leave requests with optional status filter
     *
     * @tags Leaves
     * @name MyRequestsList
     * @summary Get my leave requests
     * @request GET:/leaves/my-requests
     * @secure
     */
    myRequestsList: (
      query?: {
        status?: "pending" | "approved" | "rejected";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            count?: number;
            leaves?: {
              id?: string;
              leaveType?: string;
              /** @format date */
              startDate?: string;
              /** @format date */
              endDate?: string;
              numberOfDays?: number;
              reason?: string;
              status?: string;
              /** Mongo user ID of the approver/rejecter */
              approvedBy?: string | null;
              /** Name (or email fallback) of the approver/rejecter */
              approvedByName?: string | null;
              /** @format date-time */
              approvedAt?: string | null;
              /** True if this leave is beyond the recommended monthly amount for its type, meaning it needs to be exempted (isExempted) to avoid a score deduction. False for leaves already within the recommended limit - no exemption needed. */
              isExemptionEligible?: boolean;
              /** Whether a manager/HR has exempted this leave from the score deduction - see PUT /leaves/{leaveId}/exempt */
              isExempted?: boolean | null;
              /** @format date-time */
              exemptedAt?: string | null;
              exemptionReason?: string | null;
            }[];
          };
        },
        any
      >({
        path: `/leaves/my-requests`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Check leave balance and usage statistics. Staff can view own, managers/superadmin can view any.
     *
     * @tags Leaves
     * @name BalanceDetail
     * @summary Get leave balance
     * @request GET:/leaves/balance/{staffId}
     * @secure
     */
    balanceDetail: (staffId: number, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            name?: string;
            /** @example 12 */
            totalLeavePerYear?: number;
            /** Remaining leaves for the year */
            leaveBalance?: number;
            /** Approved leave days used this year */
            leaveUsedThisYear?: number;
            /** Approved leave days used this month */
            leaveUsedThisMonth?: number;
            /** Pending + approved leave days this year */
            totalRequestedThisYear?: number;
            /** Pending + approved leave days this month */
            totalRequestedThisMonth?: number;
            /**
             * Advisory only, not enforced. Requests beyond this are still allowed but require approval and may incur a score deduction unless exempted.
             * @example 1
             */
            recommendedMonthlyLimit?: number;
          };
        },
        any
      >({
        path: `/leaves/balance/${staffId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve all leave requests across all staff with optional status filter
     *
     * @tags Leaves
     * @name LeavesList
     * @summary Get all leave requests (MANAGERS/SUPER ADMIN)
     * @request GET:/leaves
     * @secure
     */
    leavesList: (
      query?: {
        status?: "pending" | "approved" | "rejected";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            count?: number;
            leaves?: {
              id?: string;
              staffId?: number;
              staffName?: string;
              leaveType?: string;
              /** @format date */
              startDate?: string;
              /** @format date */
              endDate?: string;
              numberOfDays?: number;
              reason?: string;
              status?: string;
              /** Mongo user ID of the manager/HR/superAdmin who approved/rejected this request */
              approvedBy?: string | null;
              /** Name (or email fallback) of the approver/rejecter */
              approvedByName?: string | null;
              /** True if this leave is beyond the recommended monthly amount for its type, meaning it needs to be exempted (isExempted) to avoid a score deduction. False for leaves already within the recommended limit - no exemption needed. */
              isExemptionEligible?: boolean;
              /** Whether a manager/HR has exempted this leave from the score deduction - see PUT /leaves/{leaveId}/exempt */
              isExempted?: boolean | null;
              /** @format date-time */
              exemptedAt?: string | null;
              exemptionReason?: string | null;
              /** user_id of the manager/superAdmin this request was delegated to, if any */
              delegatedTo?: number;
              /** Whether the requesting user can approve/reject this specific leave (always false for non-pending leaves) */
              canApprove?: boolean;
              /** @format date-time */
              createdAt?: string;
            }[];
          };
        },
        void
      >({
        path: `/leaves`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Approve a pending leave request. HR and superAdmin can always approve. A manager can only approve if the `leave.managerCanApproveDirect` setting is enabled, or if HR/superAdmin delegated this specific request to them via POST /leaves/{leaveId}/delegate.
     *
     * @tags Leaves
     * @name ApproveUpdate
     * @summary Approve leave request (HR/SUPER ADMIN, or delegated/permitted MANAGER)
     * @request PUT:/leaves/{leaveId}/approve
     * @secure
     */
    approveUpdate: (leaveId: string, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            id?: string;
            /** @example "approved" */
            status?: string;
            /** @format date-time */
            approvedAt?: string;
          };
        },
        void
      >({
        path: `/leaves/${leaveId}/approve`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Reject a pending leave request with reason. Same permission rules as approve - HR and superAdmin can always reject; a manager needs `leave.managerCanApproveDirect` enabled or an explicit delegation.
     *
     * @tags Leaves
     * @name RejectUpdate
     * @summary Reject leave request (HR/SUPER ADMIN, or delegated/permitted MANAGER)
     * @request PUT:/leaves/{leaveId}/reject
     * @secure
     */
    rejectUpdate: (
      leaveId: string,
      data: {
        /** @example "Insufficient notice" */
        rejectionReason: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            id?: string;
            /** @example "rejected" */
            status?: string;
          };
        },
        void
      >({
        path: `/leaves/${leaveId}/reject`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reassigns approval authority for a pending leave request to a specific active manager or superAdmin. Once delegated, that user can approve/reject this request regardless of the `leave.managerCanApproveDirect` setting.
     *
     * @tags Leaves
     * @name DelegateUpdate
     * @summary Delegate approval authority for a leave request (HR/SUPER ADMIN)
     * @request PUT:/leaves/{leaveId}/delegate
     * @secure
     */
    delegateUpdate: (
      leaveId: string,
      data: {
        /**
         * user_id of the manager/superAdmin to delegate approval to
         * @example 42
         */
        delegateToUserId: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            id?: string;
            delegatedTo?: number;
            /** @format date-time */
            delegatedAt?: string;
          };
        },
        void
      >({
        path: `/leaves/${leaveId}/delegate`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Leaves beyond the recommended 1/month normally incur a score deduction (see AttendanceLeaveRule). This grants or revokes an exemption from that deduction for the given leave, independent of its approve/reject status - used for both Personal (manager judgment call) and Medical (typically following HR-verified proof) leave types.
     *
     * @tags Leaves
     * @name ExemptUpdate
     * @summary Grant/revoke a score exemption for a leave (HR/SUPER ADMIN/MANAGER)
     * @request PUT:/leaves/{leaveId}/exempt
     * @secure
     */
    exemptUpdate: (
      leaveId: string,
      data: {
        /** true to grant the exemption, false to revoke it */
        exempted: boolean;
        /** @example "Approved family emergency" */
        reason?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            id?: string;
            isExempted?: boolean;
            exemptedBy?: string;
            /** @format date-time */
            exemptedAt?: string;
            exemptionReason?: string;
          };
        },
        void
      >({
        path: `/leaves/${leaveId}/exempt`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a pending leave request. Staff can only delete their own, superadmin can delete any.
     *
     * @tags Leaves
     * @name LeavesDelete
     * @summary Delete a pending leave request
     * @request DELETE:/leaves/{leaveId}
     * @secure
     */
    leavesDelete: (leaveId: string, params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            id?: string;
            /** @example "Leave request deleted successfully" */
            message?: string;
          };
        },
        {
          /** @example false */
          success?: boolean;
          /** @example "Cannot delete leave with status approved" */
          error?: string;
        } | void
      >({
        path: `/leaves/${leaveId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve aggregated leave statistics across the organization
     *
     * @tags Leaves
     * @name StatsOverviewList
     * @summary Get leave statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/leaves/stats/overview
     * @secure
     */
    statsOverviewList: (params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            total?: number;
            byStatus?: {
              pending?: number;
              approved?: number;
              rejected?: number;
            };
            byType?: {
              personal?: number;
              medical?: number;
            };
            currentMonth?: number;
          };
        },
        void
      >({
        path: `/leaves/stats/overview`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  todos = {
    /**
     * @description Personal notes and to-dos - always created for the authenticated staff member (no staffId in the body).
     *
     * @tags Todos
     * @name TodosCreate
     * @summary Create a todo/note for the current staff member
     * @request POST:/todos
     * @secure
     */
    todosCreate: (
      data: {
        /** @example "Follow up with vendor about delayed shipment" */
        title: string;
        notes?: string | null;
        /**
         * YYYY-MM-DD
         * @format date
         * @example "2026-08-05"
         */
        plannedFor?: string | null;
        /** @default "normal" */
        priority?: "low" | "normal" | "high";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          message?: string;
          /** A staff member's own note/todo item */
          data?: TodoResponse;
        },
        void
      >({
        path: `/todos`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Defaults to the authenticated user's own todos. Managers/HR/superAdmin may pass ?staffId= to view another staff member's instead.
     *
     * @tags Todos
     * @name TodosList
     * @summary List todos for the current staff member (or another, for admins)
     * @request GET:/todos
     * @secure
     */
    todosList: (
      query?: {
        /** Admin roles only - view this staff member's todos instead of your own */
        staffId?: number;
        status?: "planned" | "done" | "cancelled";
        /**
         * Exact YYYY-MM-DD match
         * @format date
         */
        plannedFor?: string;
        /** If true, returns only still-planned todos with plannedFor before today (overrides status/plannedFor) */
        overdue?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          count?: number;
          data?: TodoResponse[];
        },
        void
      >({
        path: `/todos`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Todos
     * @name TodosDetail
     * @summary Get a todo by ID
     * @request GET:/todos/{id}
     * @secure
     */
    todosDetail: (id: string, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          /** A staff member's own note/todo item */
          data?: TodoResponse;
        },
        void
      >({
        path: `/todos/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description For closing out a todo (marking it done/cancelled with what was actually done), use POST /todos/{id}/complete instead.
     *
     * @tags Todos
     * @name TodosUpdate
     * @summary Update a todo's title/notes/plannedFor/priority
     * @request PUT:/todos/{id}
     * @secure
     */
    todosUpdate: (
      id: string,
      data: {
        title?: string;
        notes?: string | null;
        /** @format date */
        plannedFor?: string | null;
        priority?: "low" | "normal" | "high";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          message?: string;
          /** A staff member's own note/todo item */
          data?: TodoResponse;
        },
        void
      >({
        path: `/todos/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Todos
     * @name TodosDelete
     * @summary Delete a todo
     * @request DELETE:/todos/{id}
     * @secure
     */
    todosDelete: (id: string, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/todos/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Todos
     * @name CompleteCreate
     * @summary Mark a todo done or cancelled, optionally noting what was actually done
     * @request POST:/todos/{id}/complete
     * @secure
     */
    completeCreate: (
      id: string,
      data: {
        status: "done" | "cancelled";
        /**
         * What was actually done
         * @example "Called vendor, shipment arriving Monday"
         */
        actionNote?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          message?: string;
          /** A staff member's own note/todo item */
          data?: TodoResponse;
        },
        void
      >({
        path: `/todos/${id}/complete`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  appearance = {
    /**
     * @description Update appearance status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags Appearance
     * @name AppearanceUpdate
     * @summary Update staff appearance (MANAGERS/SUPER ADMIN)
     * @request PUT:/appearance/{staffId}
     * @secure
     */
    appearanceUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["uniform","socks_banyan"]
         */
        violations: ("uniform" | "socks_banyan" | "hair_beard_moustache")[];
        /** @example "Wrinkled uniform, mismatched socks" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/appearance/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve appearance status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags Appearance
     * @name TodayList
     * @summary Get appearance for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/appearance/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-06-30"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: (
                | "uniform"
                | "socks_banyan"
                | "hair_beard_moustache"
              )[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/appearance/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark specific appearance violations for a staff member for a given date (defaults to today)
     *
     * @tags Appearance
     * @name MarkBadCreate
     * @summary Mark staff appearance as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/appearance/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Appearance violations to mark
         * @example ["uniform","socks_banyan"]
         */
        violations: ("uniform" | "socks_banyan" | "hair_beard_moustache")[];
        /** @example "Wrinkled uniform, mismatched socks" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/appearance/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff appearance status back to OK for a given date (defaults to today)
     *
     * @tags Appearance
     * @name ResetCreate
     * @summary Reset appearance to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/appearance/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/appearance/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get appearance history for a specific staff member
     *
     * @tags Appearance
     * @name HistoryDetail
     * @summary Get appearance history (MANAGERS/SUPER ADMIN)
     * @request GET:/appearance/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/appearance/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated appearance statistics across staff
     *
     * @tags Appearance
     * @name StatsOverviewList
     * @summary Get appearance statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/appearance/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadAppearance?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/appearance/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  cleaning = {
    /**
     * @description Update cleaning status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags Cleaning
     * @name CleaningUpdate
     * @summary Update staff cleaning culture status (MANAGERS/SUPER ADMIN)
     * @request PUT:/cleaning/{staffId}
     * @secure
     */
    cleaningUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["cleanliness"]
         */
        violations: "cleanliness"[];
        /** @example "Workstation left uncleaned" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/cleaning/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve cleaning status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags Cleaning
     * @name TodayList
     * @summary Get cleaning status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/cleaning/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "cleanliness"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/cleaning/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark cleaning violation for a staff member for a given date (defaults to today)
     *
     * @tags Cleaning
     * @name MarkBadCreate
     * @summary Mark staff cleaning as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/cleaning/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Cleaning violations to mark
         * @example ["cleanliness"]
         */
        violations: "cleanliness"[];
        /** @example "Workstation left uncleaned" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/cleaning/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff cleaning status back to OK for a given date (defaults to today)
     *
     * @tags Cleaning
     * @name ResetCreate
     * @summary Reset cleaning status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/cleaning/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/cleaning/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get cleaning history for a specific staff member
     *
     * @tags Cleaning
     * @name HistoryDetail
     * @summary Get cleaning history (MANAGERS/SUPER ADMIN)
     * @request GET:/cleaning/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/cleaning/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated cleaning statistics across staff
     *
     * @tags Cleaning
     * @name StatsOverviewList
     * @summary Get cleaning statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/cleaning/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/cleaning/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  stockMaintenance = {
    /**
     * @description Update stock maintenance status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags StockMaintenance
     * @name StockMaintenanceUpdate
     * @summary Update staff stock maintenance culture status (MANAGERS/SUPER ADMIN)
     * @request PUT:/stock-maintenance/{staffId}
     * @secure
     */
    stockMaintenanceUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["dead_stock"]
         */
        violations: "dead_stock"[];
        /** @example "Dead stock found in mica section not reported" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/stock-maintenance/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve stock maintenance status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags StockMaintenance
     * @name TodayList
     * @summary Get stock maintenance status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/stock-maintenance/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "dead_stock"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/stock-maintenance/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark stock maintenance violation for a staff member for a given date (defaults to today)
     *
     * @tags StockMaintenance
     * @name MarkBadCreate
     * @summary Mark staff stock maintenance as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/stock-maintenance/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Stock Maintenance violations to mark
         * @example ["dead_stock"]
         */
        violations: "dead_stock"[];
        /** @example "Dead stock found in mica section not reported" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/stock-maintenance/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff stock maintenance status back to OK for a given date (defaults to today)
     *
     * @tags StockMaintenance
     * @name ResetCreate
     * @summary Reset stock maintenance status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/stock-maintenance/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/stock-maintenance/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get stock maintenance history for a specific staff member
     *
     * @tags StockMaintenance
     * @name HistoryDetail
     * @summary Get stock maintenance history (MANAGERS/SUPER ADMIN)
     * @request GET:/stock-maintenance/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/stock-maintenance/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated stock maintenance statistics across staff
     *
     * @tags StockMaintenance
     * @name StatsOverviewList
     * @summary Get stock maintenance statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/stock-maintenance/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/stock-maintenance/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  packingBillCrossCheck = {
    /**
     * @description Update packing/bill cross-check status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags PackingBillCrossCheck
     * @name PackingBillCrossCheckUpdate
     * @summary Update staff packing/bill cross-check culture status (MANAGERS/SUPER ADMIN)
     * @request PUT:/packing-bill-cross-check/{staffId}
     * @secure
     */
    packingBillCrossCheckUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["packing_not_cross_checked"]
         */
        violations: "packing_not_cross_checked"[];
        /** @example "Packed items did not match the bill" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/packing-bill-cross-check/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve packing/bill cross-check status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags PackingBillCrossCheck
     * @name TodayList
     * @summary Get packing/bill cross-check status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/packing-bill-cross-check/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "packing_not_cross_checked"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/packing-bill-cross-check/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark packing/bill cross-check violation for a staff member for a given date (defaults to today)
     *
     * @tags PackingBillCrossCheck
     * @name MarkBadCreate
     * @summary Mark staff packing/bill cross-check as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/packing-bill-cross-check/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Packing/Bill Cross-Check violations to mark
         * @example ["packing_not_cross_checked"]
         */
        violations: "packing_not_cross_checked"[];
        /** @example "Packed items did not match the bill" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/packing-bill-cross-check/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff packing/bill cross-check status back to OK for a given date (defaults to today)
     *
     * @tags PackingBillCrossCheck
     * @name ResetCreate
     * @summary Reset packing/bill cross-check status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/packing-bill-cross-check/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/packing-bill-cross-check/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get packing/bill cross-check history for a specific staff member
     *
     * @tags PackingBillCrossCheck
     * @name HistoryDetail
     * @summary Get packing/bill cross-check history (MANAGERS/SUPER ADMIN)
     * @request GET:/packing-bill-cross-check/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/packing-bill-cross-check/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated packing/bill cross-check statistics across staff
     *
     * @tags PackingBillCrossCheck
     * @name StatsOverviewList
     * @summary Get packing/bill cross-check statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/packing-bill-cross-check/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/packing-bill-cross-check/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  salesReturnHandling = {
    /**
     * @description Update sales return handling status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags SalesReturnHandling
     * @name SalesReturnHandlingUpdate
     * @summary Update staff sales return handling culture status (MANAGERS/SUPER ADMIN)
     * @request PUT:/sales-return-handling/{staffId}
     * @secure
     */
    salesReturnHandlingUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["late_sales_return"]
         */
        violations: "late_sales_return"[];
        /** @example "Sales return not processed within SLA" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/sales-return-handling/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve sales return handling status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags SalesReturnHandling
     * @name TodayList
     * @summary Get sales return handling status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/sales-return-handling/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "late_sales_return"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/sales-return-handling/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark sales return handling violation for a staff member for a given date (defaults to today)
     *
     * @tags SalesReturnHandling
     * @name MarkBadCreate
     * @summary Mark staff sales return handling as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/sales-return-handling/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Sales Return Handling violations to mark
         * @example ["late_sales_return"]
         */
        violations: "late_sales_return"[];
        /** @example "Sales return not processed within SLA" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/sales-return-handling/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff sales return handling status back to OK for a given date (defaults to today)
     *
     * @tags SalesReturnHandling
     * @name ResetCreate
     * @summary Reset sales return handling status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/sales-return-handling/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/sales-return-handling/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get sales return handling history for a specific staff member
     *
     * @tags SalesReturnHandling
     * @name HistoryDetail
     * @summary Get sales return handling history (MANAGERS/SUPER ADMIN)
     * @request GET:/sales-return-handling/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/sales-return-handling/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated sales return handling statistics across staff
     *
     * @tags SalesReturnHandling
     * @name StatsOverviewList
     * @summary Get sales return handling statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/sales-return-handling/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/sales-return-handling/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  wastage = {
    /**
     * @description Update wastage status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags Wastage
     * @name WastageUpdate
     * @summary Update staff wastage culture status (MANAGERS/SUPER ADMIN)
     * @request PUT:/wastage/{staffId}
     * @secure
     */
    wastageUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["wastage"]
         */
        violations: "wastage"[];
        /** @example "Excess mica offcuts not logged as wastage" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/wastage/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve wastage status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags Wastage
     * @name TodayList
     * @summary Get wastage status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/wastage/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "wastage"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/wastage/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark wastage violation for a staff member for a given date (defaults to today)
     *
     * @tags Wastage
     * @name MarkBadCreate
     * @summary Mark staff wastage as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/wastage/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Avoiding Wastage violations to mark
         * @example ["wastage"]
         */
        violations: "wastage"[];
        /** @example "Excess mica offcuts not logged as wastage" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/wastage/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff wastage status back to OK for a given date (defaults to today)
     *
     * @tags Wastage
     * @name ResetCreate
     * @summary Reset wastage status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/wastage/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/wastage/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get wastage history for a specific staff member
     *
     * @tags Wastage
     * @name HistoryDetail
     * @summary Get wastage history (MANAGERS/SUPER ADMIN)
     * @request GET:/wastage/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/wastage/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated wastage statistics across staff
     *
     * @tags Wastage
     * @name StatsOverviewList
     * @summary Get wastage statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/wastage/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/wastage/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  stockTaking = {
    /**
     * @description Update stock taking status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags StockTaking
     * @name StockTakingUpdate
     * @summary Update staff stock taking culture status (MANAGERS/SUPER ADMIN)
     * @request PUT:/stock-taking/{staffId}
     * @secure
     */
    stockTakingUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["stock_taking_incomplete"]
         */
        violations: "stock_taking_incomplete"[];
        /** @example "Monthly stock take not completed" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/stock-taking/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve stock taking status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags StockTaking
     * @name TodayList
     * @summary Get stock taking status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/stock-taking/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "stock_taking_incomplete"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/stock-taking/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark stock taking violation for a staff member for a given date (defaults to today)
     *
     * @tags StockTaking
     * @name MarkBadCreate
     * @summary Mark staff stock taking as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/stock-taking/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Stock Taking violations to mark
         * @example ["stock_taking_incomplete"]
         */
        violations: "stock_taking_incomplete"[];
        /** @example "Monthly stock take not completed" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/stock-taking/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff stock taking status back to OK for a given date (defaults to today)
     *
     * @tags StockTaking
     * @name ResetCreate
     * @summary Reset stock taking status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/stock-taking/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/stock-taking/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get stock taking history for a specific staff member
     *
     * @tags StockTaking
     * @name HistoryDetail
     * @summary Get stock taking history (MANAGERS/SUPER ADMIN)
     * @request GET:/stock-taking/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/stock-taking/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated stock taking statistics across staff
     *
     * @tags StockTaking
     * @name StatsOverviewList
     * @summary Get stock taking statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/stock-taking/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/stock-taking/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  workflowStatus = {
    /**
     * @description Update workflow status status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags WorkflowStatus
     * @name WorkflowStatusUpdate
     * @summary Update staff workflow status culture status (MANAGERS/SUPER ADMIN)
     * @request PUT:/workflow-status/{staffId}
     * @secure
     */
    workflowStatusUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["workflow_status_not_updated"]
         */
        violations: "workflow_status_not_updated"[];
        /** @example "Workflow status not updated for the day" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/workflow-status/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve workflow status status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags WorkflowStatus
     * @name TodayList
     * @summary Get workflow status status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/workflow-status/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "workflow_status_not_updated"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/workflow-status/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark workflow status violation for a staff member for a given date (defaults to today)
     *
     * @tags WorkflowStatus
     * @name MarkBadCreate
     * @summary Mark staff workflow status as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/workflow-status/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Workflow Status Updating violations to mark
         * @example ["workflow_status_not_updated"]
         */
        violations: "workflow_status_not_updated"[];
        /** @example "Workflow status not updated for the day" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/workflow-status/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff workflow status status back to OK for a given date (defaults to today)
     *
     * @tags WorkflowStatus
     * @name ResetCreate
     * @summary Reset workflow status status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/workflow-status/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/workflow-status/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get workflow status history for a specific staff member
     *
     * @tags WorkflowStatus
     * @name HistoryDetail
     * @summary Get workflow status history (MANAGERS/SUPER ADMIN)
     * @request GET:/workflow-status/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/workflow-status/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated workflow status statistics across staff
     *
     * @tags WorkflowStatus
     * @name StatsOverviewList
     * @summary Get workflow status statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/workflow-status/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/workflow-status/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  majorViolation = {
    /**
     * @description Update major violation status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations. Deduction only - no points earned.
     *
     * @tags MajorViolation
     * @name MajorViolationUpdate
     * @summary Update staff major violation status (MANAGERS/SUPER ADMIN)
     * @request PUT:/major-violation/{staffId}
     * @secure
     */
    majorViolationUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["loading_mistake"]
         */
        violations: (
          | "direct_delivery_no_billing"
          | "loading_mistake"
          | "interfere_md_authority"
          | "dead_stock_reporting"
          | "item_change_after_billing_not_edited"
          | "no_random_stock_updation"
          | "mobile_usage"
          | "angry_with_customer"
          | "conflict_between_staff"
        )[];
        /** @example "Loaded wrong material onto delivery truck" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/major-violation/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve major violation status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags MajorViolation
     * @name TodayList
     * @summary Get major violation status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: (
                | "direct_delivery_no_billing"
                | "loading_mistake"
                | "interfere_md_authority"
                | "dead_stock_reporting"
                | "item_change_after_billing_not_edited"
                | "no_random_stock_updation"
                | "mobile_usage"
                | "angry_with_customer"
                | "conflict_between_staff"
              )[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/major-violation/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark major violation for a staff member for a given date (defaults to today)
     *
     * @tags MajorViolation
     * @name MarkBadCreate
     * @summary Mark staff major violation as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/major-violation/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Major violations to mark
         * @example ["loading_mistake"]
         */
        violations: (
          | "direct_delivery_no_billing"
          | "loading_mistake"
          | "interfere_md_authority"
          | "dead_stock_reporting"
          | "item_change_after_billing_not_edited"
          | "no_random_stock_updation"
          | "mobile_usage"
          | "angry_with_customer"
          | "conflict_between_staff"
        )[];
        /** @example "Loaded wrong material onto delivery truck" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/major-violation/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff major violation status back to OK for a given date (defaults to today)
     *
     * @tags MajorViolation
     * @name ResetCreate
     * @summary Reset major violation status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/major-violation/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/major-violation/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get major violation history for a specific staff member
     *
     * @tags MajorViolation
     * @name HistoryDetail
     * @summary Get major violation history (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/major-violation/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated major violation statistics across staff
     *
     * @tags MajorViolation
     * @name StatsOverviewList
     * @summary Get major violation statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/major-violation/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  majorViolationGlass = {
    /**
     * @description Update major violation status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations. Deduction only - no points earned.
     *
     * @tags MajorViolationGlass
     * @name MajorViolationGlassUpdate
     * @summary Update staff major violation status (MANAGERS/SUPER ADMIN)
     * @request PUT:/major-violation-glass/{staffId}
     * @secure
     */
    majorViolationGlassUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["cutting_mistake"]
         */
        violations: (
          | "interfere_md_authority"
          | "cutting_mistake"
          | "mobile_usage"
          | "angry_with_customer"
          | "conflict_between_staff"
        )[];
        /** @example "Wrong cutting size for customer order" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/major-violation-glass/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve major violation status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags MajorViolationGlass
     * @name TodayList
     * @summary Get major violation status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-glass/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: (
                | "interfere_md_authority"
                | "cutting_mistake"
                | "mobile_usage"
                | "angry_with_customer"
                | "conflict_between_staff"
              )[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/major-violation-glass/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark major violation for a staff member for a given date (defaults to today)
     *
     * @tags MajorViolationGlass
     * @name MarkBadCreate
     * @summary Mark staff major violation as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/major-violation-glass/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Major violations to mark
         * @example ["cutting_mistake"]
         */
        violations: (
          | "interfere_md_authority"
          | "cutting_mistake"
          | "mobile_usage"
          | "angry_with_customer"
          | "conflict_between_staff"
        )[];
        /** @example "Wrong cutting size for customer order" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/major-violation-glass/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff major violation status back to OK for a given date (defaults to today)
     *
     * @tags MajorViolationGlass
     * @name ResetCreate
     * @summary Reset major violation status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/major-violation-glass/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/major-violation-glass/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get major violation history for a specific staff member
     *
     * @tags MajorViolationGlass
     * @name HistoryDetail
     * @summary Get major violation history (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-glass/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/major-violation-glass/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated major violation statistics across staff
     *
     * @tags MajorViolationGlass
     * @name StatsOverviewList
     * @summary Get major violation statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-glass/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/major-violation-glass/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  majorViolationStore = {
    /**
     * @description Update major violation status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations. Deduction only - no points earned.
     *
     * @tags MajorViolationStore
     * @name MajorViolationStoreUpdate
     * @summary Update staff major violation status (MANAGERS/SUPER ADMIN)
     * @request PUT:/major-violation-store/{staffId}
     * @secure
     */
    majorViolationStoreUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["billing_mistake"]
         */
        violations: (
          | "mobile_usage"
          | "angry_with_customer"
          | "conflict_between_staff"
          | "billing_mistake"
        )[];
        /** @example "Billed the wrong item/quantity" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/major-violation-store/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve major violation status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags MajorViolationStore
     * @name TodayList
     * @summary Get major violation status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-store/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: (
                | "mobile_usage"
                | "angry_with_customer"
                | "conflict_between_staff"
                | "billing_mistake"
              )[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/major-violation-store/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark major violation for a staff member for a given date (defaults to today)
     *
     * @tags MajorViolationStore
     * @name MarkBadCreate
     * @summary Mark staff major violation as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/major-violation-store/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Major violations to mark
         * @example ["billing_mistake"]
         */
        violations: (
          | "mobile_usage"
          | "angry_with_customer"
          | "conflict_between_staff"
          | "billing_mistake"
        )[];
        /** @example "Billed the wrong item/quantity" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/major-violation-store/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff major violation status back to OK for a given date (defaults to today)
     *
     * @tags MajorViolationStore
     * @name ResetCreate
     * @summary Reset major violation status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/major-violation-store/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/major-violation-store/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get major violation history for a specific staff member
     *
     * @tags MajorViolationStore
     * @name HistoryDetail
     * @summary Get major violation history (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-store/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/major-violation-store/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated major violation statistics across staff
     *
     * @tags MajorViolationStore
     * @name StatsOverviewList
     * @summary Get major violation statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-store/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/major-violation-store/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  majorViolationHardware = {
    /**
     * @description Update major violation status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations. Deduction only - no points earned.
     *
     * @tags MajorViolationHardware
     * @name MajorViolationHardwareUpdate
     * @summary Update staff major violation status (MANAGERS/SUPER ADMIN)
     * @request PUT:/major-violation-hardware/{staffId}
     * @secure
     */
    majorViolationHardwareUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["late_sales_return_handling"]
         */
        violations: (
          | "late_sales_return_handling"
          | "mobile_usage"
          | "conflict_between_staff"
        )[];
        /** @example "Billed the wrong item/quantity" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/major-violation-hardware/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve major violation status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags MajorViolationHardware
     * @name TodayList
     * @summary Get major violation status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-hardware/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: (
                | "late_sales_return_handling"
                | "mobile_usage"
                | "conflict_between_staff"
              )[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/major-violation-hardware/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark major violation for a staff member for a given date (defaults to today)
     *
     * @tags MajorViolationHardware
     * @name MarkBadCreate
     * @summary Mark staff major violation as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/major-violation-hardware/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Major violations to mark
         * @example ["late_sales_return_handling"]
         */
        violations: (
          | "late_sales_return_handling"
          | "mobile_usage"
          | "conflict_between_staff"
        )[];
        /** @example "Billed the wrong item/quantity" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/major-violation-hardware/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff major violation status back to OK for a given date (defaults to today)
     *
     * @tags MajorViolationHardware
     * @name ResetCreate
     * @summary Reset major violation status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/major-violation-hardware/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/major-violation-hardware/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get major violation history for a specific staff member
     *
     * @tags MajorViolationHardware
     * @name HistoryDetail
     * @summary Get major violation history (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-hardware/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/major-violation-hardware/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated major violation statistics across staff
     *
     * @tags MajorViolationHardware
     * @name StatsOverviewList
     * @summary Get major violation statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/major-violation-hardware/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/major-violation-hardware/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  welcomingCustomer = {
    /**
     * @description Update welcoming customer status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags Welcoming Customer
     * @name WelcomingCustomerUpdate
     * @summary Update staff welcoming customer status (MANAGERS/SUPER ADMIN)
     * @request PUT:/welcoming-customer/{staffId}
     * @secure
     */
    welcomingCustomerUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["no_greeting"]
         */
        violations: ("no_greeting" | "no_smile" | "ignored_customer")[];
        /** @example "Did not greet customer at entry" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/welcoming-customer/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve welcoming customer status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags Welcoming Customer
     * @name TodayList
     * @summary Get welcoming customer status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/welcoming-customer/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 3 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: ("no_greeting" | "no_smile" | "ignored_customer")[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/welcoming-customer/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark welcoming customer violation(s) for a staff member for a given date (defaults to today)
     *
     * @tags Welcoming Customer
     * @name MarkBadCreate
     * @summary Mark staff welcoming customer status as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/welcoming-customer/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Welcoming customer violations to mark
         * @example ["no_greeting"]
         */
        violations: ("no_greeting" | "no_smile" | "ignored_customer")[];
        /** @example "Did not greet customer at entry" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/welcoming-customer/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff welcoming customer status back to OK for a given date (defaults to today)
     *
     * @tags Welcoming Customer
     * @name ResetCreate
     * @summary Reset welcoming customer status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/welcoming-customer/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/welcoming-customer/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get welcoming customer history for a specific staff member
     *
     * @tags Welcoming Customer
     * @name HistoryDetail
     * @summary Get welcoming customer history (MANAGERS/SUPER ADMIN)
     * @request GET:/welcoming-customer/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/welcoming-customer/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated welcoming customer statistics across staff
     *
     * @tags Welcoming Customer
     * @name StatsOverviewList
     * @summary Get welcoming customer statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/welcoming-customer/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/welcoming-customer/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  customerDealing = {
    /**
     * @description Update customer dealing status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations. Store-department staff are scored from customer feedback instead (see POST /feedback/requests) - marking one here is rejected with 400, since it would have no effect on their score.
     *
     * @tags Customer Dealing
     * @name CustomerDealingUpdate
     * @summary Update staff customer dealing status (MANAGERS/SUPER ADMIN)
     * @request PUT:/customer-dealing/{staffId}
     * @secure
     */
    customerDealingUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["poor_customer_dealing"]
         */
        violations: "poor_customer_dealing"[];
        /** @example "Rude to a customer at the counter" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/customer-dealing/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve customer dealing status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted. Includes Store-department staff too, though their entries never affect scoring.
     *
     * @tags Customer Dealing
     * @name TodayList
     * @summary Get customer dealing status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/customer-dealing/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 2 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "poor_customer_dealing"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/customer-dealing/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark a customer dealing violation for a staff member for a given date (defaults to today). Rejected with 400 for Store-department staff.
     *
     * @tags Customer Dealing
     * @name MarkBadCreate
     * @summary Mark staff customer dealing status as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/customer-dealing/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Customer dealing violations to mark
         * @example ["poor_customer_dealing"]
         */
        violations: "poor_customer_dealing"[];
        /** @example "Rude to a customer at the counter" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/customer-dealing/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff customer dealing status back to OK for a given date (defaults to today)
     *
     * @tags Customer Dealing
     * @name ResetCreate
     * @summary Reset customer dealing status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/customer-dealing/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/customer-dealing/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get customer dealing history for a specific staff member
     *
     * @tags Customer Dealing
     * @name HistoryDetail
     * @summary Get customer dealing history (MANAGERS/SUPER ADMIN)
     * @request GET:/customer-dealing/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/customer-dealing/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated customer dealing statistics across staff (manual daily-check entries only - does not include Store staff's feedback-derived scoring)
     *
     * @tags Customer Dealing
     * @name StatsOverviewList
     * @summary Get customer dealing statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/customer-dealing/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/customer-dealing/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  customerQuotationFollowup = {
    /**
     * @description Update customer & quotation followup status for a staff member. Use status "ok" to reset, or "bad" with violations to mark a missed follow-up. Unlike Appearance/Cleaning/Welcoming Customer/Customer Dealing, a bad mark here does NOT forfeit the whole month's points - it deducts pointsPerBadMark and compounds across multiple bad days (see GET /scoring-config).
     *
     * @tags Customer & Quotation Followup
     * @name CustomerQuotationFollowupUpdate
     * @summary Update staff customer & quotation followup status (MANAGERS/SUPER ADMIN)
     * @request PUT:/customer-quotation-followup/{staffId}
     * @secure
     */
    customerQuotationFollowupUpdate: (
      staffId: number,
      data: {
        /** @example "bad" */
        status?: "ok" | "bad";
        /**
         * Required if status is "bad"
         * @example ["missed_followup"]
         */
        violations: "missed_followup"[];
        /** @example "Did not follow up on a pending quotation" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: object;
        },
        void
      >({
        path: `/customer-quotation-followup/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve customer & quotation followup status for all staff members for a given date. Defaults to OK for all staff, and to today if `date` is omitted.
     *
     * @tags Customer & Quotation Followup
     * @name TodayList
     * @summary Get customer & quotation followup status for all staff for a given date (MANAGERS/SUPER ADMIN)
     * @request GET:/customer-quotation-followup/today
     * @secure
     */
    todayList: (
      query?: {
        /**
         * Date to retrieve (YYYY-MM-DD). Defaults to today.
         * @format date
         */
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            /**
             * @format date
             * @example "2026-08-09"
             */
            date?: string;
            /** @example 50 */
            count?: number;
            /** @example 4 */
            badCount?: number;
            staff?: {
              staffId?: number;
              staffName?: string;
              date?: string;
              status?: "ok" | "bad";
              violations?: "missed_followup"[];
              remarks?: string | null;
              /** @format date-time */
              markedAt?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/customer-quotation-followup/today`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark a missed follow-up for a staff member for a given date (defaults to today). Deducts pointsPerBadMark for the month rather than forfeiting all points.
     *
     * @tags Customer & Quotation Followup
     * @name MarkBadCreate
     * @summary Mark staff customer & quotation followup status as bad (MANAGERS/SUPER ADMIN)
     * @request POST:/customer-quotation-followup/mark-bad/{staffId}
     * @secure
     */
    markBadCreate: (
      staffId: number,
      data: {
        /** @default "bad" */
        status?: "ok" | "bad";
        /**
         * Customer & quotation followup violations to mark
         * @example ["missed_followup"]
         */
        violations: "missed_followup"[];
        /** @example "Did not follow up on a pending quotation" */
        remarks: string;
        /**
         * Date this check applies to (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            status?: string;
            violations?: string[];
            remarks?: string;
            /** @format date-time */
            markedAt?: string;
          };
        },
        void
      >({
        path: `/customer-quotation-followup/mark-bad/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset staff customer & quotation followup status back to OK for a given date (defaults to today)
     *
     * @tags Customer & Quotation Followup
     * @name ResetCreate
     * @summary Reset customer & quotation followup status to OK (MANAGERS/SUPER ADMIN)
     * @request POST:/customer-quotation-followup/reset/{staffId}
     * @secure
     */
    resetCreate: (
      staffId: number,
      data?: {
        /**
         * Date to reset (YYYY-MM-DD). Defaults to today.
         * @format date
         * @example "2026-08-09"
         */
        date?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "ok" */
            status?: string;
          };
        },
        void
      >({
        path: `/customer-quotation-followup/reset/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get customer & quotation followup history for a specific staff member
     *
     * @tags Customer & Quotation Followup
     * @name HistoryDetail
     * @summary Get customer & quotation followup history (MANAGERS/SUPER ADMIN)
     * @request GET:/customer-quotation-followup/history/{staffId}
     * @secure
     */
    historyDetail: (
      staffId: number,
      query?: {
        /**
         * Number of days to look back (default 30)
         * @default 30
         */
        days?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            period?: string;
            stats?: {
              totalDays?: number;
              badDays?: number;
              okDays?: number;
              badPercentage?: string;
            };
            history?: object[];
          };
        },
        void
      >({
        path: `/customer-quotation-followup/history/${staffId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get aggregated customer & quotation followup statistics across staff
     *
     * @tags Customer & Quotation Followup
     * @name StatsOverviewList
     * @summary Get customer & quotation followup statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/customer-quotation-followup/stats/overview
     * @secure
     */
    statsOverviewList: (
      query?: {
        /** @format date */
        startDate?: string;
        /** @format date */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            period?: object;
            totalStaff?: number;
            staffWithBadDays?: number;
            stats?: object[];
          };
        },
        void
      >({
        path: `/customer-quotation-followup/stats/overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  scoring = {
    /**
     * @description Retrieve score breakdown for a staff member for a given month. Shows total score, breakdown by category, and detailed metrics.
     *
     * @tags Scoring
     * @name MonthDetail
     * @summary Get staff score for a specific month
     * @request GET:/scores/{staffId}/month/{month}
     * @secure
     */
    monthDetail: (staffId: number, month: string, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          /** Monthly performance score for a staff member based on attendance, leaves, and appearance */
          data?: StaffScoreResponse;
        },
        void
      >({
        path: `/scores/${staffId}/month/${month}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve score history for a staff member for the last N months. Shows trend over time.
     *
     * @tags Scoring
     * @name HistoryList
     * @summary Get staff score history
     * @request GET:/scores/{staffId}/history
     * @secure
     */
    historyList: (
      staffId: number,
      query?: {
        /**
         * Number of months to look back
         * @default 6
         */
        months?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            /** @example "Last 6 months" */
            period?: string;
            scores?: StaffScoreResponse[];
          };
        },
        void
      >({
        path: `/scores/${staffId}/history`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve all staff scores for a given month with detailed statistics. **Scoring Framework (Total 100 points):** - Attendance: 10 points (late arrivals tracking) - Leaves: 10 points (approved leaves per month) - Appearance: 5 points (dress code violations) - Cleaning Culture: 5 points - Welcoming Customer: 10 points - Customer Dealing: 15 points - Customer & Quotation Followup: 10 points - Meeting: 5 points - Extra Performance: 10 points - Testimonial: 20 points Returns: Staff scores sorted by performance, plus aggregated statistics and performance distribution.
     *
     * @tags Scoring
     * @name MonthlyOverviewList
     * @summary Get all staff scores for a month with statistics (MANAGERS/SUPER ADMIN)
     * @request GET:/scores/monthly-overview
     * @secure
     */
    monthlyOverviewList: (
      query?: {
        /**
         * Month in YYYY-MM format (default current month)
         * @format date
         * @pattern ^\d{4}-\d{2}$
         * @example "2026-06"
         */
        month?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            month?: string;
            count?: number;
            scores?: StaffScoreResponse[];
          };
        },
        void
      >({
        path: `/scores/monthly-overview`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Trigger score calculation for all active staff for a given month. This endpoint analyzes: - **Attendance**: Late arrivals (>30 mins) vs max allowed (3) - **Leaves**: Approved leaves vs monthly limit (2) - **Appearance**: Dress code violation days vs max violations Scores are saved to database for fast retrieval. Can be called: - At month-end to finalize scores - Anytime to recalculate if rules or data changed
     *
     * @tags Scoring
     * @name CalculateMonthlyCreate
     * @summary Calculate monthly scores for all staff (MANAGERS/SUPER ADMIN)
     * @request POST:/scores/calculate-monthly
     * @secure
     */
    calculateMonthlyCreate: (
      data: {
        /**
         * Month in YYYY-MM format to calculate (default current month)
         * @format date
         * @pattern ^\d{4}-\d{2}$
         * @example "2026-06"
         */
        month?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            /** @example "2026-06" */
            month?: string;
            /**
             * Number of staff scores calculated/updated
             * @example 13
             */
            calculatedCount?: number;
            /**
             * Total active staff
             * @example 13
             */
            totalStaff?: number;
            /** All calculated scores */
            scores?: StaffScoreResponse[];
            /** Any errors encountered during calculation */
            errors?: string[] | null;
          };
        },
        void
      >({
        path: `/scores/calculate-monthly`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve the scoring rules and parameters for a given month and department. Each department has its own rubric (see `GET /scoring-config/departments` for the static rule list per department); the returned config only has the rule keys that apply to the requested department populated.
     *
     * @tags Scoring
     * @name ScoringConfigList
     * @summary Get scoring configuration (MANAGERS/SUPER ADMIN)
     * @request GET:/scoring-config
     * @secure
     */
    scoringConfigList: (
      query?: {
        /**
         * Month in YYYY-MM format (default current month)
         * @format date
         * @pattern ^\d{4}-\d{2}$
         * @example "2026-06"
         */
        month?: string;
        /**
         * Department name (default "Store")
         * @example "Store"
         */
        department?: "Store" | "Plywood Godown" | "Glass Godown" | "Hardware";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          /**
           * Scoring rules configuration for a specific month. Controls point allocation for all scoring categories.
           *
           * **Total Score: 100 points**
           * - Attendance: 10 points
           * - Leaves: 10 points
           * - Appearance: 5 points
           * - Cleaning Culture: 5 points
           * - Welcoming Customer: 10 points
           * - Customer Dealing: 15 points
           * - Customer & Quotation Followup: 10 points
           * - Meeting: 5 points
           * - Extra Performance: 10 points
           * - Testimonial: 20 points
           */
          data?: ScoringConfigResponse;
        },
        void
      >({
        path: `/scoring-config`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update the scoring rules and parameters for a month and department. SuperAdmin only. Only the rule keys belonging to the target department's rubric are applied - see `GET /scoring-config/departments` for which keys apply to which department.
     *
     * @tags Scoring
     * @name ScoringConfigUpdate
     * @summary Update scoring configuration (MANAGERS/SUPER ADMIN)
     * @request PUT:/scoring-config
     * @secure
     */
    scoringConfigUpdate: (
      data: {
        /**
         * Month to update
         * @format date
         * @pattern ^\d{4}-\d{2}$
         * @example "2026-06"
         */
        month: string;
        /**
         * Department whose rubric to update
         * @example "Store"
         */
        department: "Store" | "Plywood Godown" | "Glass Godown" | "Hardware";
        attendance?: {
          /** @example 3 */
          maxLateCases?: number;
          /** @example 10 */
          pointsIfNoLate?: number;
          /** @example -10 */
          penaltyIfExceeds?: number;
          /** @example 30 */
          lateThresholdMinutes?: number;
        };
        leaves?: {
          /** @example 2 */
          maxAllowedPerMonth?: number;
          /** @example 10 */
          pointsIfWithinLimit?: number;
          /** @example -10 */
          penaltyIfExceeds?: number;
        };
        /** Late arrival/early leaving/break-overage cases combined, counted per case-day */
        timeKeeping?: {
          /**
           * Max case-days allowed before penalty
           * @example 3
           */
          maxLateCases?: number;
          /** @example 10 */
          pointsIfWithinLimit?: number;
          /**
           * Applied once when mode is "flat" and maxLateCases is exceeded
           * @example -10
           */
          penaltyIfExceeds?: number;
          /**
           * 'flat' (default): penaltyIfExceeds applied once, any excess. 'perExcess': pointsPerExtraCase deducted for every case-day beyond maxLateCases.
           * @default "flat"
           */
          mode?: "flat" | "perExcess";
          /**
           * Used when mode is "perExcess"
           * @example 5
           */
          pointsPerExtraCase?: number;
        };
        /** Casual and medical leave, scored independently each month */
        attendanceLeave?: {
          casual?: {
            /** @example 1 */
            maxAllowedPerMonth?: number;
            /** @example 10 */
            pointsIfWithinLimit?: number;
            /** @example -10 */
            penaltyIfExceeds?: number;
            /**
             * Used when mode is "perExcess" - deducted per unexempt casual leave beyond maxAllowedPerMonth
             * @example 5
             */
            pointsPerExtraLeave?: number;
          };
          medical?: {
            /**
             * Beyond this, the excess leave(s) must be exempted (isExempted) to avoid the penalty
             * @example 1
             */
            maxAllowedPerMonth?: number;
            /** @example -10 */
            penaltyIfExceeds?: number;
            /**
             * Used when mode is "perExcess" - deducted per unproven medical leave beyond maxAllowedPerMonth
             * @example 5
             */
            pointsPerExtraLeave?: number;
          };
          /**
           * 'flat' (default): flat penalty if either cap is exceeded without exemption/proof. 'perExcess': pointsPerExtraLeave deducted per unexempt/unproven excess leave, independently for casual and medical.
           * @default "flat"
           */
          mode?: "flat" | "perExcess";
        };
        appearance?: {
          /** @example true */
          enabled?: boolean;
          /** @example -5 */
          pointsPerViolation?: number;
          /** @example 5 */
          maxPoints?: number;
          /**
           * 'perDay' (default): deducts |pointsPerViolation| for every bad day, recurring. 'flat': forfeits it once, first bad day.
           * @default "perDay"
           */
          mode?: "flat" | "perDay";
          /** @example ["uniform","socks_banyan","hair_beard_moustache"] */
          violations?: string[];
        };
        cleaning?: {
          /** @example true */
          enabled?: boolean;
          /**
           * Full points forfeited for the month if any single day is marked bad (when mode is "flat")
           * @example 5
           */
          maxPoints?: number;
          /**
           * 'flat' (default): forfeits pointsPerBadDay once, first bad day. 'perDay': deducts pointsPerBadDay for every bad day, recurring.
           * @default "flat"
           */
          mode?: "flat" | "perDay";
          /**
           * Points deducted per the mode above
           * @example 5
           */
          pointsPerBadDay?: number;
        };
        welcomingCustomer?: {
          /** @example true */
          enabled?: boolean;
          /**
           * Full points forfeited for the month if any single day is marked bad (when mode is "flat")
           * @example 10
           */
          maxPoints?: number;
          /**
           * 'flat' (default): forfeits pointsPerBadDay once, first bad day. 'perDay': deducts pointsPerBadDay for every bad day, recurring.
           * @default "flat"
           */
          mode?: "flat" | "perDay";
          /**
           * Points deducted per the mode above
           * @example 10
           */
          pointsPerBadDay?: number;
        };
        /** Store-department staff are scored from customer feedback (pointsPerBadFeedback), everyone else from the customer_dealing daily check (mode/pointsPerBadDay) */
        customerDealing?: {
          /** @example true */
          enabled?: boolean;
          /** @example 15 */
          maxPoints?: number;
          /**
           * Store staff only - deducted per completed feedback submission containing at least one "no" answer (not deduplicated per customer)
           * @example 15
           */
          pointsPerBadFeedback?: number;
          /**
           * Non-Store staff only (daily-check based). 'flat' (default): forfeits pointsPerBadDay once, first bad day. 'perDay': deducts pointsPerBadDay for every bad day, recurring.
           * @default "flat"
           */
          mode?: "flat" | "perDay";
          /**
           * Non-Store staff only - points deducted per the mode above
           * @example 15
           */
          pointsPerBadDay?: number;
        };
        /** Customer & quotation follow-up scoring rules */
        customerQuotationFollowup?: {
          /** @example true */
          enabled?: boolean;
          /** @example 10 */
          maxPoints?: number;
          /**
           * 'perDay' (default): pointsPerBadMark deducted per bad day, compounds. 'flat': forfeited once, first bad day.
           * @default "perDay"
           */
          mode?: "flat" | "perDay";
          /**
           * Points deducted per the mode above (perDay compounds - e.g. 2 bad days = -20, floored at 0)
           * @example 10
           */
          pointsPerBadMark?: number;
        };
        meeting?: {
          /** @example true */
          enabled?: boolean;
          /** @example 5 */
          maxPoints?: number;
          /**
           * Full points forfeited for the month once missed meetings exceed this count (excused absences don't count)
           * @example 0
           */
          maxMissedAllowed?: number;
        };
        extraPerformance?: {
          /** @example 10 */
          pointsPerPerformance?: number;
          /** @example 10 */
          maxPointsAllowed?: number;
        };
        testimonial?: {
          /** @example 5 */
          pointsPerTestimonial?: number;
          /** @example 20 */
          maxPointsAllowed?: number;
        };
        /** Plywood Godown only - zero dead stock, marked via the stock_maintenance daily check */
        stockMaintenance?: {
          /** @example true */
          enabled?: boolean;
          /** @example 20 */
          maxPoints?: number;
          /**
           * 'flat' (default): forfeits pointsPerBadDay once, first bad day. 'perDay': deducts pointsPerBadDay for every bad day, recurring.
           * @default "flat"
           */
          mode?: "flat" | "perDay";
          /** @example 20 */
          pointsPerBadDay?: number;
        };
        /** Plywood Godown only - sales returns handled on time, marked via the sales_return_handling daily check */
        salesReturnHandling?: {
          /** @example true */
          enabled?: boolean;
          /** @example 5 */
          maxPoints?: number;
          /**
           * 'flat' (default): forfeits pointsPerBadDay once, first bad day. 'perDay': deducts pointsPerBadDay for every bad day, recurring.
           * @default "flat"
           */
          mode?: "flat" | "perDay";
          /** @example 5 */
          pointsPerBadDay?: number;
        };
        /** Glass Godown only - avoiding wastage, marked via the wastage daily check */
        wastage?: {
          /** @example true */
          enabled?: boolean;
          /** @example 10 */
          maxPoints?: number;
          /**
           * 'flat' (default): forfeits pointsPerBadDay once, first bad day. 'perDay': deducts pointsPerBadDay for every bad day, recurring.
           * @default "flat"
           */
          mode?: "flat" | "perDay";
          /** @example 10 */
          pointsPerBadDay?: number;
        };
        /** Glass Godown only - monthly stock taking, marked via the stock_taking daily check */
        stockTaking?: {
          /** @example true */
          enabled?: boolean;
          /** @example 10 */
          maxPoints?: number;
          /**
           * 'flat' (default): forfeits pointsPerBadDay once, first bad day. 'perDay': deducts pointsPerBadDay for every bad day, recurring.
           * @default "flat"
           */
          mode?: "flat" | "perDay";
          /** @example 10 */
          pointsPerBadDay?: number;
        };
        /** Glass Godown/Hardware only - workflow status updating, marked via the workflow_status daily check */
        workflowStatus?: {
          /** @example true */
          enabled?: boolean;
          /** @example 10 */
          maxPoints?: number;
          /**
           * 'flat' (default): forfeits pointsPerBadDay once, first bad day. 'perDay': deducts pointsPerBadDay for every bad day, recurring.
           * @default "flat"
           */
          mode?: "flat" | "perDay";
          /** @example 10 */
          pointsPerBadDay?: number;
        };
        /** Hardware only - cross-checking packed items with the bill, marked via the packing_bill_cross_check daily check */
        packingBillCrossCheck?: {
          /** @example true */
          enabled?: boolean;
          /** @example 5 */
          maxPoints?: number;
          /**
           * 'flat': forfeits pointsPerBadDay once, first bad day. 'perDay' (default, Hardware): deducts pointsPerBadDay for every bad day, recurring.
           * @default "perDay"
           */
          mode?: "flat" | "perDay";
          /** @example 5 */
          pointsPerBadDay?: number;
        };
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          /**
           * Scoring rules configuration for a specific month. Controls point allocation for all scoring categories.
           *
           * **Total Score: 100 points**
           * - Attendance: 10 points
           * - Leaves: 10 points
           * - Appearance: 5 points
           * - Cleaning Culture: 5 points
           * - Welcoming Customer: 10 points
           * - Customer Dealing: 15 points
           * - Customer & Quotation Followup: 10 points
           * - Meeting: 5 points
           * - Extra Performance: 10 points
           * - Testimonial: 20 points
           */
          data?: ScoringConfigResponse;
        },
        void
      >({
        path: `/scoring-config`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the static 100-point rule breakdown for each department (Store, Plywood Godown, Glass Godown) - the rule keys, categories, and default max points that make up that department's rubric. Drivers have no scoring rubric. Use this to render "how is this department scored" in an admin UI, and to know which `ScoringConfigResponse` rule keys are meaningful for a given department (config keys outside a department's rubric are always absent from its config document).
     *
     * @tags Scoring
     * @name DepartmentsList
     * @summary List scoring rubrics per department (MANAGERS/SUPER ADMIN)
     * @request GET:/scoring-config/departments
     * @secure
     */
    departmentsList: (params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          /** @example {"Store":[{"ruleKey":"timeKeeping","category":"Timing","maxPoints":10},{"ruleKey":"attendanceLeave","category":"Attendance","maxPoints":10},{"ruleKey":"appearance","category":"Appearance","maxPoints":5},{"ruleKey":"welcomingCustomer","category":"Welcoming Customer","maxPoints":10},{"ruleKey":"customerDealing","category":"Customer Dealing","maxPoints":15},{"ruleKey":"customerQuotationFollowup","category":"Customer Follow-up","maxPoints":10},{"ruleKey":"meeting","category":"Attending Meetings","maxPoints":5},{"ruleKey":"cleaning","category":"Cleaning Culture","maxPoints":5},{"ruleKey":"extraPerformance","category":"Extra Performance","maxPoints":10},{"ruleKey":"testimonial","category":"Testimonial","maxPoints":20},{"ruleKey":"majorViolationStore","category":"Major Violations","maxPoints":0}],"Plywood Godown":[{"ruleKey":"timeKeeping","category":"Timing","maxPoints":10},{"ruleKey":"attendanceLeave","category":"Attendance","maxPoints":10},{"ruleKey":"appearance","category":"Appearance","maxPoints":5},{"ruleKey":"customerDealing","category":"Customer Dealing","maxPoints":10},{"ruleKey":"stockMaintenance","category":"Stock Maintenance (zero dead stock)","maxPoints":20},{"ruleKey":"salesReturnHandling","category":"Sales Return Handling","maxPoints":5},{"ruleKey":"meeting","category":"Attending Meetings","maxPoints":5},{"ruleKey":"cleaning","category":"Cleanliness","maxPoints":5},{"ruleKey":"extraPerformance","category":"Extra Performance","maxPoints":10},{"ruleKey":"testimonial","category":"Testimonial","maxPoints":20},{"ruleKey":"majorViolation","category":"Major Violations","maxPoints":0}],"Glass Godown":[{"ruleKey":"timeKeeping","category":"Timing","maxPoints":10},{"ruleKey":"attendanceLeave","category":"Attendance","maxPoints":10},{"ruleKey":"appearance","category":"Appearance","maxPoints":5},{"ruleKey":"wastage","category":"Avoiding Wastage","maxPoints":10},{"ruleKey":"customerDealing","category":"Fair Dealing with Customers/Auto Drivers","maxPoints":15},{"ruleKey":"stockTaking","category":"Stock Taking (monthly)","maxPoints":10},{"ruleKey":"workflowStatus","category":"Work Flow Status Updating","maxPoints":10},{"ruleKey":"meeting","category":"Attending Weekly Meeting","maxPoints":5},{"ruleKey":"cleaning","category":"Cleanliness","maxPoints":5},{"ruleKey":"extraPerformance","category":"Extra Performance","maxPoints":10},{"ruleKey":"testimonial","category":"Testimonials (min 2)","maxPoints":10},{"ruleKey":"majorViolationGlass","category":"Major Violations","maxPoints":0}],"Hardware":[{"ruleKey":"timeKeeping","category":"Timing","maxPoints":10},{"ruleKey":"attendanceLeave","category":"Attendance","maxPoints":10},{"ruleKey":"stockMaintenance","category":"Dead Stock Reporting","maxPoints":5},{"ruleKey":"packingBillCrossCheck","category":"Cross Checking With Bill After Packing","maxPoints":5},{"ruleKey":"stockTaking","category":"Stock Taking (monthly)","maxPoints":20},{"ruleKey":"workflowStatus","category":"Work Flow Status Updating","maxPoints":10},{"ruleKey":"meeting","category":"Attending Meetings","maxPoints":5},{"ruleKey":"cleaning","category":"Cleanliness","maxPoints":5},{"ruleKey":"extraPerformance","category":"Extra Performance","maxPoints":5},{"ruleKey":"salesReturnHandling","category":"Sales Return Handling","maxPoints":5},{"ruleKey":"testimonial","category":"Testimonials (min 4)","maxPoints":20},{"ruleKey":"majorViolationHardware","category":"Major Violations","maxPoints":0}]} */
          data?: Record<
            string,
            {
              /** Key under which this rule's config appears in ScoringConfigResponse */
              ruleKey?: string;
              /** Human-readable category name */
              category?: string;
              maxPoints?: number;
            }[]
          >;
        },
        void
      >({
        path: `/scoring-config/departments`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns which `DailyCheck` categories apply to each department, so a unified daily check screen can render the right set of toggles per staff card instead of a fixed list for everyone. Each category entry includes the API base path its mini-router is mounted at (e.g. `/api/appearance`), matching the per-category endpoints documented under the Appearance/Cleaning/Wastage/etc. tags. Not every rubric category is DailyCheck-backed (e.g. Timing, Meeting, Extra Performance, Testimonial come from other data sources), so this list is a subset of the full rubric returned by `GET /scoring-config/departments`.
     *
     * @tags Scoring
     * @name CategoriesByDepartmentList
     * @summary List DailyCheck categories per department (MANAGERS/SUPER ADMIN)
     * @request GET:/daily-check/categories-by-department
     * @secure
     */
    categoriesByDepartmentList: (params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          /** @example {"Store":[{"category":"appearance","label":"Appearance","apiBasePath":"/api/appearance","violations":["uniform","hair_beard_moustache"]},{"category":"cleaning","label":"Cleaning","apiBasePath":"/api/cleaning","violations":["cleanliness"]},{"category":"welcoming_customer","label":"Welcoming Customer","apiBasePath":"/api/welcoming-customer","violations":["no_greeting","no_smile","ignored_customer"]},{"category":"customer_dealing","label":"Customer Dealing","apiBasePath":"/api/customer-dealing","violations":["poor_customer_dealing"]},{"category":"customer_quotation_followup","label":"Customer & Quotation Follow-up","apiBasePath":"/api/customer-quotation-followup","violations":["missed_followup"]},{"category":"major_violation_store","label":"Major Violations","apiBasePath":"/api/major-violation-store","violations":["mobile_usage","angry_with_customer","conflict_between_staff","billing_mistake"]}],"Plywood Godown":[{"category":"appearance","label":"Appearance","apiBasePath":"/api/appearance","violations":["uniform","hair_beard_moustache"]},{"category":"cleaning","label":"Cleaning","apiBasePath":"/api/cleaning","violations":["cleanliness"]},{"category":"customer_dealing","label":"Customer Dealing","apiBasePath":"/api/customer-dealing","violations":["poor_customer_dealing"]},{"category":"stock_maintenance","label":"Stock Maintenance","apiBasePath":"/api/stock-maintenance","violations":["dead_stock"]},{"category":"sales_return_handling","label":"Sales Return Handling","apiBasePath":"/api/sales-return-handling","violations":["late_sales_return"]},{"category":"major_violation","label":"Major Violations","apiBasePath":"/api/major-violation","violations":["direct_delivery_no_billing","loading_mistake","interfere_md_authority","dead_stock_reporting","item_change_after_billing_not_edited","no_random_stock_updation","mobile_usage","angry_with_customer","conflict_between_staff"]}],"Glass Godown":[{"category":"appearance","label":"Appearance","apiBasePath":"/api/appearance","violations":["uniform","hair_beard_moustache"]},{"category":"cleaning","label":"Cleaning","apiBasePath":"/api/cleaning","violations":["cleanliness"]},{"category":"customer_dealing","label":"Customer Dealing","apiBasePath":"/api/customer-dealing","violations":["poor_customer_dealing"]},{"category":"wastage","label":"Avoiding Wastage","apiBasePath":"/api/wastage","violations":["wastage"]},{"category":"stock_taking","label":"Stock Taking","apiBasePath":"/api/stock-taking","violations":["stock_taking_incomplete"]},{"category":"workflow_status","label":"Workflow Status Updating","apiBasePath":"/api/workflow-status","violations":["workflow_status_not_updated"]},{"category":"major_violation_glass","label":"Major Violations","apiBasePath":"/api/major-violation-glass","violations":["interfere_md_authority","cutting_mistake","mobile_usage","angry_with_customer","conflict_between_staff"]}],"Hardware":[{"category":"cleaning","label":"Cleaning","apiBasePath":"/api/cleaning","violations":["cleanliness"]},{"category":"stock_maintenance","label":"Stock Maintenance","apiBasePath":"/api/stock-maintenance","violations":["dead_stock"]},{"category":"sales_return_handling","label":"Sales Return Handling","apiBasePath":"/api/sales-return-handling","violations":["late_sales_return"]},{"category":"stock_taking","label":"Stock Taking","apiBasePath":"/api/stock-taking","violations":["stock_taking_incomplete"]},{"category":"workflow_status","label":"Workflow Status Updating","apiBasePath":"/api/workflow-status","violations":["workflow_status_not_updated"]},{"category":"packing_bill_cross_check","label":"Cross Checking With Bill After Packing","apiBasePath":"/api/packing-bill-cross-check","violations":["packing_not_cross_checked"]},{"category":"major_violation_hardware","label":"Major Violations","apiBasePath":"/api/major-violation-hardware","violations":["late_sales_return_handling","mobile_usage","conflict_between_staff"]}]} */
          data?: Record<
            string,
            {
              category?: string;
              label?: string;
              apiBasePath?: string;
              violations?: string[];
            }[]
          >;
        },
        void
      >({
        path: `/daily-check/categories-by-department`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  extraPerformance = {
    /**
     * @description Retrieve all performances (pending, approved, rejected) for authenticated user or specific user (SuperAdmin only). **Default behavior:** Returns authenticated user's all performances. **With userId param:** SuperAdmin can view any user's performances.
     *
     * @tags Extra Performance
     * @name ExtraPerformanceList
     * @summary Get all performances
     * @request GET:/extra-performance
     * @secure
     */
    extraPerformanceList: (
      query?: {
        /**
         * (SuperAdmin only) View specific user's performances instead of own
         * @example 2645
         */
        userId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            userId?: number;
            staffName?: string;
            stats?: {
              total?: number;
              approved?: number;
              pending?: number;
              rejected?: number;
            };
            performances?: ExtraPerformanceResponse[];
          };
        },
        void
      >({
        path: `/extra-performance`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff submit evidence of extra performance/achievement for approval by SuperAdmin. Approved submissions award 10 points to monthly score.
     *
     * @tags Extra Performance
     * @name ExtraPerformanceCreate
     * @summary Submit extra performance for approval
     * @request POST:/extra-performance
     * @secure
     */
    extraPerformanceCreate: (
      data: {
        /**
         * Brief title of the performance
         * @example "Led customer training session"
         */
        title: string;
        /**
         * Detailed description of what was accomplished
         * @example "Conducted comprehensive training for 15 customers on new product features"
         */
        description: string;
        /**
         * Date when performance occurred (IST)
         * @format date
         * @example "2026-06-28"
         */
        date: string;
        /**
         * Performance category
         * @example "Training"
         */
        category?:
          | "Training"
          | "Process Improvement"
          | "Customer Excellence"
          | "Team Leadership"
          | "Other";
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** Extra performance submission with approval status */
          data?: ExtraPerformanceResponse;
        },
        void
      >({
        path: `/extra-performance`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve all pending performance submissions across all staff for a given month. SuperAdmin uses this to review and approve/reject submissions.
     *
     * @tags Extra Performance
     * @name PendingList
     * @summary Get pending performances for approval (MANAGERS/SUPER ADMIN)
     * @request GET:/extra-performance/pending
     * @secure
     */
    pendingList: (
      query?: {
        /**
         * Month in YYYY-MM format (default current month)
         * @format date
         * @pattern ^\d{4}-\d{2}$
         * @example "2026-06"
         */
        month?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            month?: string;
            count?: number;
            performances?: ExtraPerformanceResponse[];
          };
        },
        void
      >({
        path: `/extra-performance/pending`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Approve a pending performance submission. Staff will receive 10 points on monthly score.
     *
     * @tags Extra Performance
     * @name ApproveUpdate
     * @summary Approve extra performance (MANAGERS/SUPER ADMIN)
     * @request PUT:/extra-performance/{performanceId}/approve
     * @secure
     */
    approveUpdate: (performanceId: string, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          /** Extra performance submission with approval status */
          data?: ExtraPerformanceResponse;
        },
        void
      >({
        path: `/extra-performance/${performanceId}/approve`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Reject a pending performance submission with a reason.
     *
     * @tags Extra Performance
     * @name RejectUpdate
     * @summary Reject extra performance (MANAGERS/SUPER ADMIN)
     * @request PUT:/extra-performance/{performanceId}/reject
     * @secure
     */
    rejectUpdate: (
      performanceId: string,
      data: {
        /**
         * Reason for rejection
         * @example "Insufficient detail provided"
         */
        rejectionReason: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          /** Extra performance submission with approval status */
          data?: ExtraPerformanceResponse;
        },
        void
      >({
        path: `/extra-performance/${performanceId}/reject`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve approved extra performances for authenticated user or specific user (SuperAdmin only). **Default behavior:** Returns authenticated user's approved performances. **With userId param:** SuperAdmin can view any user's approved performances.
     *
     * @tags Extra Performance
     * @name ApprovedList
     * @summary Get approved performances
     * @request GET:/extra-performance/approved
     * @secure
     */
    approvedList: (
      query?: {
        /**
         * (SuperAdmin only) View specific user's performances instead of own
         * @example 2645
         */
        userId?: number;
        /**
         * Month in YYYY-MM format (default current month)
         * @format date
         * @pattern ^\d{4}-\d{2}$
         * @example "2026-06"
         */
        month?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            month?: string;
            count?: number;
            /** Total points earned (count × 10) */
            totalPoints?: number;
            performances?: ExtraPerformanceResponse[];
          };
        },
        void
      >({
        path: `/extra-performance/approved`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  testimonials = {
    /**
     * @description Any authenticated staff member can write a testimonial about a colleague. Submissions start pending and require approval from a manager/HR/superAdmin before counting toward the reviewee's score - see PUT /testimonials/{testimonialId}/approve. A staff member cannot submit a testimonial about themselves.
     *
     * @tags Testimonials
     * @name TestimonialsCreate
     * @summary Submit a testimonial about another staff member
     * @request POST:/testimonials
     * @secure
     */
    testimonialsCreate: (
      data: {
        /**
         * Staff.id (internal id) of the colleague being reviewed
         * @example 2646
         */
        revieweeStaffId: number;
        /** @example "Anas went out of his way to help close the month-end reconciliation - great teamwork." */
        message: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** A testimonial from one staff member about another, with approval status */
          data?: TestimonialResponse;
        },
        void
      >({
        path: `/testimonials`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Defaults to the authenticated user's own received testimonials (all statuses). Managers/HR/superAdmin may pass ?staffId= to view another staff member's instead.
     *
     * @tags Testimonials
     * @name ReceivedList
     * @summary Get testimonials received by a staff member
     * @request GET:/testimonials/received
     * @secure
     */
    receivedList: (
      query?: {
        /** Admin roles only - Staff.id (internal id) of the staff member whose received testimonials to view */
        staffId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            revieweeUserId?: number;
            stats?: {
              total?: number;
              approved?: number;
              pending?: number;
              rejected?: number;
            };
            testimonials?: TestimonialResponse[];
          };
        },
        void
      >({
        path: `/testimonials/received`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Testimonials
     * @name GivenList
     * @summary Get testimonials the authenticated staff member has given to others
     * @request GET:/testimonials/given
     * @secure
     */
    givenList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            reviewerUserId?: number;
            count?: number;
            testimonials?: TestimonialResponse[];
          };
        },
        void
      >({
        path: `/testimonials/given`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve all pending testimonials across all staff for a given month. Used to review and approve/reject submissions.
     *
     * @tags Testimonials
     * @name PendingList
     * @summary Get pending testimonials for approval (MANAGERS/HR/SUPER ADMIN)
     * @request GET:/testimonials/pending
     * @secure
     */
    pendingList: (
      query?: {
        /**
         * Month in YYYY-MM format (default current month)
         * @format date
         * @pattern ^\d{4}-\d{2}$
         * @example "2026-06"
         */
        month?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            month?: string;
            count?: number;
            testimonials?: TestimonialResponse[];
          };
        },
        void
      >({
        path: `/testimonials/pending`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Company-wide list of approved testimonials for a given month, newest-approved first. For a company-wide "team testimonials" view alongside GET /testimonials/pending.
     *
     * @tags Testimonials
     * @name ApprovedList
     * @summary Get approved testimonials across all staff (MANAGERS/HR/SUPER ADMIN)
     * @request GET:/testimonials/approved
     * @secure
     */
    approvedList: (
      query?: {
        /**
         * Month in YYYY-MM format (default current month)
         * @format date
         * @pattern ^\d{4}-\d{2}$
         * @example "2026-06"
         */
        month?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          data?: {
            month?: string;
            count?: number;
            testimonials?: TestimonialResponse[];
          };
        },
        void
      >({
        path: `/testimonials/approved`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Approve a pending testimonial. The reviewee receives 5 points on their monthly score, capped at 20 points (4 approved testimonials) per month.
     *
     * @tags Testimonials
     * @name ApproveUpdate
     * @summary Approve a testimonial (MANAGERS/HR/SUPER ADMIN)
     * @request PUT:/testimonials/{testimonialId}/approve
     * @secure
     */
    approveUpdate: (testimonialId: string, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          /** A testimonial from one staff member about another, with approval status */
          data?: TestimonialResponse;
        },
        void
      >({
        path: `/testimonials/${testimonialId}/approve`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Reject a pending testimonial with a reason.
     *
     * @tags Testimonials
     * @name RejectUpdate
     * @summary Reject a testimonial (MANAGERS/HR/SUPER ADMIN)
     * @request PUT:/testimonials/{testimonialId}/reject
     * @secure
     */
    rejectUpdate: (
      testimonialId: string,
      data: {
        /** @example "Too vague - please provide a specific example" */
        rejectionReason: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          success?: boolean;
          /** A testimonial from one staff member about another, with approval status */
          data?: TestimonialResponse;
        },
        void
      >({
        path: `/testimonials/${testimonialId}/reject`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  meetings = {
    /**
     * @description Creates a meeting and defaults every active staff member's attendance to "present". Admins later update individuals to absent/excused.
     *
     * @tags Meetings
     * @name MeetingsCreate
     * @summary Create a meeting (MANAGERS/HR/SUPER ADMIN)
     * @request POST:/meetings
     * @secure
     */
    meetingsCreate: (
      data: {
        /** @example "Weekly Sales Review" */
        title: string;
        /**
         * Defaults to now if omitted
         * @format date-time
         * @example "2026-08-09T10:00:00+05:30"
         */
        date?: string;
        /** @example "Discuss Q3 targets" */
        notes?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** A meeting created by an admin, used as the basis for attendance tracking and Meeting scoring */
          data?: MeetingResponse;
        },
        void
      >({
        path: `/meetings`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns meetings sorted by date, most recent first. Optionally filter by date range.
     *
     * @tags Meetings
     * @name MeetingsList
     * @summary List meetings (MANAGERS/HR/SUPER ADMIN)
     * @request GET:/meetings
     * @secure
     */
    meetingsList: (
      query?: {
        /**
         * @format date
         * @example "2026-08-01"
         */
        startDate?: string;
        /**
         * @format date
         * @example "2026-08-31"
         */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: MeetingResponse[];
        },
        void
      >({
        path: `/meetings`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsDetail
     * @summary Get a meeting with its attendance roster (MANAGERS/HR/SUPER ADMIN)
     * @request GET:/meetings/{id}
     * @secure
     */
    meetingsDetail: (id: string, params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            /** A meeting created by an admin, used as the basis for attendance tracking and Meeting scoring */
            meeting?: MeetingResponse;
            attendance?: MeetingAttendanceEntry[];
            absentCount?: number;
            excusedCount?: number;
          };
        },
        void
      >({
        path: `/meetings/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Set a staff member's status to present, absent, or excused. A reason is required when marking excused; excused absences don't count against the Meeting scoring rule.
     *
     * @tags Meetings
     * @name AttendanceUpdate
     * @summary Update a staff member's attendance for a meeting (MANAGERS/HR/SUPER ADMIN)
     * @request PUT:/meetings/{id}/attendance/{staffId}
     * @secure
     */
    attendanceUpdate: (
      id: string,
      staffId: number,
      data: {
        /** @example "excused" */
        status: "present" | "absent" | "excused";
        /**
         * Required when status is excused
         * @example "Approved sick leave"
         */
        reason?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** A single staff member's attendance record for a meeting */
          data?: MeetingAttendanceEntry;
        },
        void
      >({
        path: `/meetings/${id}/attendance/${staffId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name StaffHistoryList
     * @summary Get a staff member's meeting attendance history (MANAGERS/HR/SUPER ADMIN)
     * @request GET:/meetings/staff/{staffId}/history
     * @secure
     */
    staffHistoryList: (
      staffId: number,
      query?: {
        /**
         * Number of months back to include
         * @default 3
         */
        months?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            staffId?: number;
            staffName?: string;
            absentCount?: number;
            excusedCount?: number;
            history?: {
              /** A meeting created by an admin, used as the basis for attendance tracking and Meeting scoring */
              meeting?: MeetingResponse;
              status?: "present" | "absent" | "excused";
              reason?: string | null;
            }[];
          };
        },
        void
      >({
        path: `/meetings/staff/${staffId}/history`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  feedback = {
    /**
     * @description Returns every question in the bank, active and inactive, ordered by `order`.
     *
     * @tags Feedback
     * @name QuestionsList
     * @summary List feedback questions (MANAGERS/HR/SUPER ADMIN)
     * @request GET:/feedback/questions
     * @secure
     */
    questionsList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: FeedbackQuestion[];
        },
        void
      >({
        path: `/feedback/questions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Feedback
     * @name QuestionsCreate
     * @summary Create a feedback question (MANAGERS/HR/SUPER ADMIN)
     * @request POST:/feedback/questions
     * @secure
     */
    questionsCreate: (
      data: {
        /** @example "Was the staff member polite and helpful?" */
        text: string;
        /**
         * Display order (lower first). Defaults to 0.
         * @example 1
         */
        order?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** A yes/no question in the feedback question bank */
          data?: FeedbackQuestion;
        },
        void
      >({
        path: `/feedback/questions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Partial update - only send the fields you want to change. Set `isActive` to false to retire a question without deleting it (questions already sent to customers keep their own text snapshot, so retiring one never changes past submissions).
     *
     * @tags Feedback
     * @name QuestionsPartialUpdate
     * @summary Update or retire a feedback question (MANAGERS/HR/SUPER ADMIN)
     * @request PATCH:/feedback/questions/{id}
     * @secure
     */
    questionsPartialUpdate: (
      id: string,
      data: {
        text?: string;
        isActive?: boolean;
        order?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** A yes/no question in the feedback question bank */
          data?: FeedbackQuestion;
        },
        void
      >({
        path: `/feedback/questions/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Every feedback link sent, across all staff and customers, with the sending staff member's name resolved (staffName). Includes pending/expired links as well as completed ones - filter by status to narrow. This is the full request/response record; for one customer's completed feedback only, see the `feedback` field on GET /ledger/customers/{ledgerId} instead.
     *
     * @tags Feedback
     * @name RequestsList
     * @summary List all feedback requests, any status (MANAGERS/HR/SUPER ADMIN)
     * @request GET:/feedback/requests
     * @secure
     */
    requestsList: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        /** Filter to one status */
        status?: "pending" | "completed" | "expired";
        /** Filter to one staff member (Staff.id, internal id) */
        staffId?: number;
        /** Filter to one customer */
        ledgerId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
          data?: (FeedbackRequest & {
            /** Null if the staff record no longer exists */
            staffName?: string | null;
          })[];
        },
        void
      >({
        path: `/feedback/requests`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a FeedbackRequest for the given customer, snapshotting every currently-active question so later edits to the question bank never change what a customer already answered or is mid-way through. Returns a `token` - the frontend builds the customer-facing link around it (e.g. `https://.../feedback/{token}`) and shares it (WhatsApp, SMS, etc.). staffId is resolved from the authenticated user, not from the request body. Links expire 7 days after creation.
     *
     * @tags Feedback
     * @name RequestsCreate
     * @summary Create a feedback link for a customer (staff)
     * @request POST:/feedback/requests
     * @secure
     */
    requestsCreate: (
      data: {
        /**
         * Rowbest ledger id of the customer to request feedback from
         * @example 1024
         */
        ledgerId: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            /** @example "b6c1a5e2-4f3d-4a1b-9c2e-7d8f6a1b2c3d" */
            token?: string;
            /** @format date-time */
            expiresAt?: string;
          };
        },
        void
      >({
        path: `/feedback/requests`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Staff can only view their own. Managers/HR/superAdmin may view any staff member's.
     *
     * @tags Feedback
     * @name StaffDetail
     * @summary Get a staff member's sent feedback requests
     * @request GET:/feedback/staff/{userId}
     * @secure
     */
    staffDetail: (userId: number, params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: FeedbackRequest[];
        },
        void
      >({
        path: `/feedback/staff/${userId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Feedback requests whose submitting device (fingerprint or IP) also appears on a completed request for a different customer - a signal the same person, possibly the sending staff member, may have answered on behalf of more than one customer. Not auto-blocked at submission time, surfaced here for manual review only.
     *
     * @tags Feedback
     * @name FlaggedList
     * @summary List flagged feedback submissions for review (MANAGERS/HR/SUPER ADMIN)
     * @request GET:/feedback/flagged
     * @secure
     */
    flaggedList: (params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: FeedbackRequest[];
        },
        void
      >({
        path: `/feedback/flagged`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Hit directly by the customer's browser from the link a staff member shared - not an authenticated app request. Returns an empty `questions` array once the link is no longer pending (completed/expired).
     *
     * @tags Feedback
     * @name FeedbackDetail
     * @summary Get a feedback link's questions (public, no auth)
     * @request GET:/feedback/{token}
     * @secure
     */
    feedbackDetail: (token: string, params: RequestParams = {}) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            status?: "pending" | "completed" | "expired";
            /** @example "Sunrise Traders" */
            customerName?: string;
            questions?: {
              questionId?: string;
              text?: string;
            }[];
          };
        },
        void
      >({
        path: `/feedback/${token}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Hit directly by the customer's browser. One-time submission - a link that is already completed or has expired is rejected. The server captures IP address and User-Agent itself (never trusted from the request body); `deviceFingerprint` is an opaque client-generated identifier the frontend is responsible for producing (e.g. a persisted localStorage ID or a fingerprinting library's hash) and is stored as-is, purely as a signal for the flagged-review queue - it is never used to block a submission outright.
     *
     * @tags Feedback
     * @name FeedbackCreate
     * @summary Submit feedback answers (public, no auth)
     * @request POST:/feedback/{token}
     * @secure
     */
    feedbackCreate: (
      token: string,
      data: {
        answers: {
          questionId: string;
          answer: boolean;
        }[];
        /**
         * Opaque client-generated device identifier, frontend's choice of source
         * @example "f3a1c9e0b2d4"
         */
        deviceFingerprint?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            /** @example "completed" */
            status?: string;
          };
        },
        void
      >({
        path: `/feedback/${token}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
