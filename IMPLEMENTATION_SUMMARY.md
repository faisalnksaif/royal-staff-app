## Summary of Changes Made to Integrate `/attendance/summary/{date}` API

### 1. TypeScript Types (`src/types/index.ts`)
- Added `AttendanceSummaryResponse` interface matching the API response structure:
  ```typescript
  export interface AttendanceSummaryResponse {
    success: boolean;
    date: string; // YYYY-MM-DD
    totalStaff: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    onLeaveCount: number;
    totalWorkHours: number;
    totalBreakTime: number;
    averageWorkHours: number;
    averageBreakTime: number;
    attendanceRate: number;
  }
  ```

### 2. Attendance Service (`src/services/attendanceService.ts`)
- Imported `AttendanceSummaryResponse` type
- Added `getAttendanceSummary(date: string)` function that calls the new endpoint
- Exported the new function in the service object

### 3. Custom Hook (`src/hooks/useAttendanceSummary.ts`)
- Created new hook following the same pattern as `useAttendance`
- Uses React Query with cache key `['attendanceSummary', date]`
- Calls `attendanceService.getAttendanceSummary(date)`

### 4. Attendance Screen (`src/app/(admin)/attendance.tsx`)
- **Imports**: Added `useAttendanceSummary` hook and `AttendanceSummaryResponse` type
- **Data Fetching**: 
  - Keeps existing `useAttendance(today)` for detailed records
  - Adds `useAttendanceSummary(today)` for summary statistics
- **UI Updates**:
  - Modified `SummaryBar` to show data from new endpoint (fallback to old)
  - Added new `ExtendedSummary` component to display additional metrics:
    - Total Staff, Present/Absent/Late/On Leave counts
    - Total Work Hours, Total Break Time
    - Average Work Hours, Average Break Time
    - Attendance Rate (%)
  - Combined loading states from both requests
  - Maintained existing functionality (scan button, refresh, etc.)

### Key Features:
- **Role-Based Access**: Screen already redirects non-admin/manager users (via `useRole`)
- **Error Handling**: Inherits React Query's error states (would show in UI via loading/empty states)
- **Loading States**: Shows indicators when either request is in progress
- **Data Presentation**: 
  - Original summary bar shows core attendance counts
  - Extended section provides detailed analytics for managers/super admins
- **Backward Compatibility**: Falls back to original attendance data if new endpoint fails

### Files Modified:
1. `src/types/index.ts` - Added interface
2. `src/services/attendanceService.ts` - Added service function
3. `src/hooks/useAttendanceSummary.ts` - New hook file
4. `src/app/(admin)/attendance.tsx` - Updated to use new data and display extended summary

The implementation follows existing patterns in the codebase for consistency with TypeScript, service layer, custom hooks, and component structure.