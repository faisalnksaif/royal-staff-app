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
  role: "staff" | "manager" | "superAdmin";
  /** @example true */
  isActive: boolean;
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
    | "noContact"
    | "paid";
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
  /** @example "new_transaction" */
  type: "new_transaction" | "promise_due" | "promise_reminder";
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
   * - Future rules: 75 points (reserved)
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

/**
 * Scoring rules configuration for a specific month. Controls point allocation for all scoring categories.
 *
 * **Total Score: 100 points**
 * - Attendance: 10 points
 * - Leaves: 10 points
 * - Appearance: 5 points
 * - Extra Performance: 10 points
 * - Future rules: 65 points (reserved)
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
     * Maximum approved leaves allowed per month
     * @example 2
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
     * Types of violations to track
     * @example ["uniform","socks_banyan","hair_beard_moustache"]
     */
    violations?: ("uniform" | "socks_banyan" | "hair_beard_moustache")[];
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
          data?: StaffResponse[];
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
     * @description Returns the customer record and its synced transactions, optionally filtered by date range
     *
     * @tags Ledger
     * @name CustomersDetail
     * @summary Get a customer's ledger detail
     * @request GET:/ledger/customers/{ledgerId}
     * @secure
     */
    customersDetail: (
      ledgerId: number,
      query?: {
        /** @format date */
        from_date?: string;
        /** @format date */
        to_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          data?: {
            /** A rowbest customer ledger, as synced into LedgerCustomer */
            customer?: LedgerCustomerResponse;
            /** Synced transactions for this customer */
            entries?: object[];
          };
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
     * @description Computed live against rowbest (not from locally-synced data) for accuracy over arbitrary date ranges
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
     * @description Returns customers currently assigned to this staff (per the ownership cutoff rule in Settings key `ledger_ownership_cutoff_date` - before the cutoff, ownership comes from the manually-maintained staff-customer mapping spreadsheet; after it, ownership is derived dynamically from each customer's most recent matched Sales voucher). Each customer includes its live outstanding balance and a breakdown of which staff have historically sold to them (no single "owner" is forced on the sales-contribution side). Staff can only access their own, managers can access any.
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
         * Filter by follow-up status. `paid` means the customer has at least one follow-up resolved by a payment. `follow_up_insights` in the response is always computed over the full owned set, regardless of this filter.
         * @default "all"
         */
        filter?:
          | "all"
          | "followed_up"
          | "not_followed_up"
          | "paid"
          | "overdue"
          | "open_followup";
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
                | "noContact"
                | "paid"
                | null;
              /** @format date-time */
              next_followup_date?: string | null;
              /** Has an open follow-up whose nextFollowUpDate has passed */
              is_overdue?: boolean;
              /** Sum of promisedAmount across still-open follow-ups */
              total_promised_amount?: number;
            };
          }[];
          /** The filter that was applied to `data` */
          filter?:
            | "all"
            | "followed_up"
            | "not_followed_up"
            | "paid"
            | "overdue"
            | "open_followup";
          totals?: {
            total_outstanding?: number;
            total_staff_sales?: number;
          };
          /** Staff-wide follow-up effectiveness, computed across all owned customers (not just the current page) - answers "how much did we follow up, how much did we actually receive". */
          follow_up_insights?: {
            customers_total?: number;
            /** Owned customers with zero follow-up records ever - a coverage gap */
            customers_never_followed_up?: number;
            /** Owned customers with an open follow-up whose next-followup date has passed */
            customers_overdue_followup?: number;
            total_followups?: number;
            open_followups?: number;
            resolved_followups?: number;
            /** resolved_followups / total_followups * 100 */
            resolution_rate_pct?: number;
            /** @example {"promisedToPay":12,"dispute":2,"noContact":5} */
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
          | "noContact"
          | "paid";
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
          | "noContact"
          | "paid";
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
     * No description
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
          data?: FollowUpResponse[];
        },
        any
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
        /** Shorthand date filter - `today` or `this_month`. Overrides startDate/endDate if both given. */
        period?: "today" | "this_month";
        /**
         * Custom range start (YYYY-MM-DD), ignored if period=this_month
         * @format date
         */
        startDate?: string;
        /**
         * Custom range end (YYYY-MM-DD), ignored if period=this_month
         * @format date
         */
        endDate?: string;
        /** Filter to a single customer by the legacy string customerId */
        customerId?: string;
        /** Filter to a single customer by ledger_id (takes precedence over customerId if both given) */
        ledgerId?: number;
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
              noContact?: number;
              paid?: number;
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
            totalFollowUps?: number;
            uniqueStaffCount?: number;
            uniqueCustomerCount?: number;
            promisedToPay?: number;
            promisedPartial?: number;
            dispute?: number;
            noContact?: number;
            paid?: number;
            totalPromisedAmount?: number;
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
              noContact?: number;
              paid?: number;
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
  attendance = {
    /**
     * @description Scan staff member's fingerprint for attendance marking. Public endpoint (no auth required). Toggle between check-in and check-out automatically. Supports multiple sessions per day.
     *
     * @tags Attendance
     * @name ScanCreate
     * @summary Scan fingerprint for attendance (check-in/check-out)
     * @request POST:/attendance/scan
     * @secure
     */
    scanCreate: (
      data: {
        /**
         * Staff ID to identify the employee
         * @example 2645
         */
        staffId: number;
        /**
         * Base64 encoded fingerprint template from device sensor
         * @format byte
         * @example "QmFzZTY0RW5jb2RlZEZpbmdlcnByaW50VGVtcGxhdGU="
         */
        fingerprintTemplate: Blob;
        /**
         * @format date-time
         * @example "2026-06-29T09:30:45.123Z"
         */
        timestamp: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example true */
          matched?: boolean;
          staff?: {
            /** @example 2645 */
            id?: number;
            /** @example "ANAS" */
            name?: string;
          };
          /**
           * Fingerprint match confidence (0-1), 0.90+ required
           * @example 0.95
           */
          confidence?: number;
          /** @example "checkIn" */
          action?: "checkIn" | "checkOut";
          attendance?: {
            id?: string;
            staffId?: number;
            /** @example "2026-06-29" */
            date?: string;
            /** @example 1 */
            sessionCount?: number;
            /** Multiple sessions for breaks and meals */
            sessions?: {
              sessionNumber?: number;
              /** @format date-time */
              checkIn?: string;
              /** @format date-time */
              checkOut?: string | null;
              workHours?: number | null;
            }[];
            /** @example 2.5 */
            totalWorkHours?: number;
            /** @example 0.5 */
            totalBreakTime?: number;
            status?: "present" | "absent" | "late";
          };
        },
        void
      >({
        path: `/attendance/scan`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Register a staff member's fingerprint for attendance recognition. Requires 3 scans minimum for optimal accuracy. Progressive enrollment (call this endpoint 3 times).
     *
     * @tags Attendance
     * @name EnrollCreate
     * @summary Enroll staff member's fingerprint
     * @request POST:/attendance/enroll/{staffId}
     * @secure
     */
    enrollCreate: (
      staffId: number,
      data: {
        /**
         * Base64 encoded fingerprint template from device sensor
         * @format byte
         * @example "QmFzZTY0RW5jb2RlZEZpbmdlcnByaW50VGVtcGxhdGU="
         */
        fingerprintTemplate: Blob;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Fingerprint enrolled successfully" */
          message?: string;
          /**
           * Current enrollment count (1, 2, or 3)
           * @example 1
           */
          enrollmentCount?: number;
          /**
           * true when enrollmentCount reaches 3
           * @example false
           */
          readyForAttendance?: boolean;
        },
        void
      >({
        path: `/attendance/enroll/${staffId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
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
            status?: "present" | "absent" | "late";
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
              totalWorkHours?: number;
            };
            records?: {
              date?: string;
              /** Number of sessions (breaks/meals) */
              sessionCount?: number;
              /** Detailed session breakdown */
              sessions?: object[];
              totalWorkHours?: number;
              totalBreakTime?: number;
              status?: string;
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

    /**
     * @description Check if staff member has completed fingerprint enrollment and is ready for attendance scanning.
     *
     * @tags Attendance
     * @name BiometricStatusDetail
     * @summary Get biometric fingerprint enrollment status
     * @request GET:/attendance/biometric-status/{staffId}
     * @secure
     */
    biometricStatusDetail: (staffId: number, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          staffId?: number;
          name?: string;
          enrolled?: boolean;
          /** Number of fingerprints enrolled (0-3) */
          enrollmentCount?: number;
          /** true when enrollmentCount >= 3 */
          readyForAttendance?: boolean;
          /** @format date-time */
          enrolledAt?: string | null;
        },
        any
      >({
        path: `/attendance/biometric-status/${staffId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Remove all fingerprint enrollment data for a staff member. They can re-enroll afterward. Requires owner or superAdmin role.
     *
     * @tags Attendance
     * @name BiometricEnrollmentDelete
     * @summary Delete fingerprint enrollment (reset)
     * @request DELETE:/attendance/biometric-enrollment/{staffId}
     * @secure
     */
    biometricEnrollmentDelete: (staffId: number, params: RequestParams = {}) =>
      this.http.request<
        {
          success?: boolean;
          /** @example "Biometric enrollment cleared" */
          message?: string;
        },
        void
      >({
        path: `/attendance/biometric-enrollment/${staffId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  leaves = {
    /**
     * @description Staff requests a leave. Requires approval from superAdmin. Maximum 3 leaves per month, 12 per year.
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
        /**
         * For medical leaves exceeding monthly limit
         * @default false
         */
        isException?: boolean;
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
              /** @format date-time */
              approvedAt?: string | null;
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
            leaveUsedThisYear?: number;
            leaveUsedThisMonth?: number;
            /** @example 3 */
            monthlyLimit?: number;
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
     * @summary Get all leave requests (SUPER ADMIN ONLY)
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
     * @description Approve a pending leave request. Automatically deducts from leave balance.
     *
     * @tags Leaves
     * @name ApproveUpdate
     * @summary Approve leave request (SUPER ADMIN ONLY)
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
     * @description Reject a pending leave request with reason
     *
     * @tags Leaves
     * @name RejectUpdate
     * @summary Reject leave request (SUPER ADMIN ONLY)
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
     * @summary Get leave statistics (SUPER ADMIN ONLY)
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
  appearance = {
    /**
     * @description Update appearance status for a staff member. Use status "ok" to reset, or "bad" with violations to mark violations.
     *
     * @tags Appearance
     * @name AppearanceUpdate
     * @summary Update staff appearance (SUPER ADMIN ONLY)
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
        violations?: ("uniform" | "socks_banyan" | "hair_beard_moustache")[];
        /** @example "Wrinkled uniform, mismatched socks" */
        remarks?: string | null;
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
     * @description Retrieve appearance status for all staff members for today. Defaults to OK for all staff.
     *
     * @tags Appearance
     * @name TodayList
     * @summary Get today's appearance for all staff (SUPER ADMIN ONLY)
     * @request GET:/appearance/today
     * @secure
     */
    todayList: (params: RequestParams = {}) =>
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
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark specific appearance violations for a staff member for today
     *
     * @tags Appearance
     * @name MarkBadCreate
     * @summary Mark staff appearance as bad (SUPER ADMIN ONLY)
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
        remarks?: string | null;
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
     * @description Reset staff appearance status back to OK for today
     *
     * @tags Appearance
     * @name ResetCreate
     * @summary Reset appearance to OK (SUPER ADMIN ONLY)
     * @request POST:/appearance/reset/{staffId}
     * @secure
     */
    resetCreate: (staffId: number, params: RequestParams = {}) =>
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
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get appearance history for a specific staff member
     *
     * @tags Appearance
     * @name HistoryDetail
     * @summary Get appearance history (SUPER ADMIN ONLY)
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
     * @summary Get appearance statistics (SUPER ADMIN ONLY)
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
     * @description Retrieve all staff scores for a given month with detailed statistics. **Scoring Framework (Total 100 points):** - Attendance: 10 points (late arrivals tracking) - Leaves: 10 points (approved leaves per month) - Appearance: 5 points (dress code violations) - Future rules: 75 points (reserved for expansion) Returns: Staff scores sorted by performance, plus aggregated statistics and performance distribution.
     *
     * @tags Scoring
     * @name MonthlyOverviewList
     * @summary Get all staff scores for a month with statistics (SUPER ADMIN ONLY)
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
     * @summary Calculate monthly scores for all staff (SUPER ADMIN ONLY)
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
     * @description Retrieve the scoring rules and parameters for a given month.
     *
     * @tags Scoring
     * @name ScoringConfigList
     * @summary Get scoring configuration (SUPER ADMIN ONLY)
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
           * - Extra Performance: 10 points
           * - Future rules: 65 points (reserved)
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
     * @description Update the scoring rules and parameters for a month. SuperAdmin only.
     *
     * @tags Scoring
     * @name ScoringConfigUpdate
     * @summary Update scoring configuration (SUPER ADMIN ONLY)
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
        month?: string;
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
        appearance?: {
          /** @example true */
          enabled?: boolean;
          /** @example -5 */
          pointsPerViolation?: number;
          /** @example 5 */
          maxPoints?: number;
          /** @example ["uniform","socks_banyan","hair_beard_moustache"] */
          violations?: string[];
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
           * - Extra Performance: 10 points
           * - Future rules: 65 points (reserved)
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
     * @summary Get pending performances for approval (SUPER ADMIN ONLY)
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
     * @summary Approve extra performance (SUPER ADMIN ONLY)
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
     * @summary Reject extra performance (SUPER ADMIN ONLY)
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
}
