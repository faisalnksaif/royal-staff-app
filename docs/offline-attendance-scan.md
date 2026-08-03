# Offline attendance scan — API contract change

## Problem

The scanner app captures a face photo + GPS + timestamp and POSTs it to
`/attendance/scan` immediately. If the device has no network at capture
time, the request fails. The app now queues the scan locally (photo +
metadata) and retries the same endpoint once connectivity returns —
potentially minutes or hours later.

## What the client sends differently on a synced (queued) scan

`POST /attendance/scan` (multipart/form-data) gains one new optional field:

| field | type | sent when | meaning |
|---|---|---|---|
| `timestamp` | ISO 8601 string | always (existing field) | device wall-clock at the moment the photo was captured |
| `capturedAtDeviceNow` | ISO 8601 string | only on a queued/offline scan being synced | device wall-clock at the moment this HTTP request is being sent (i.e. "now", from the device's clock) |

On a normal online scan, `capturedAtDeviceNow` is absent and today's
behavior is unchanged: the server should timestamp the attendance record
using its own receive time (`serverReceivedAt`), same as now.

## How to compute the attendance timestamp when `capturedAtDeviceNow` is present

```
deviceOffsetMs   = serverReceivedAt - capturedAtDeviceNow   // clock skew + latency at send time
attendanceTime   = timestamp + deviceOffsetMs
```

Rationale: rather than trusting the device's absolute clock (which can be
wrong or deliberately altered), we trust the *elapsed device time* between
capture and send, and re-anchor it to the server's clock. This corrects for
a device whose clock is simply off by a fixed amount, without letting a
manipulated clock silently forge the recorded attendance time.

Store both values on the attendance record:
- `attendanceTime` (computed above) — authoritative, used everywhere today.
- `clientReportedAt` (= `timestamp`, the raw device capture time) — audit-only, for admin review if a discrepancy is ever questioned. Not used for status/lateness calculations.

## Edge cases

- If `capturedAtDeviceNow` is absent → behave exactly as today (`attendanceTime = serverReceivedAt`).
- If `deviceOffsetMs` is large (e.g. > 24h) or negative, consider flagging the record for admin review rather than silently accepting it — the client cannot guarantee the queued photo survived reboots/reinstalls with clock continuity, and a large delta may indicate a tampered device clock rather than a genuinely long offline period.
- Multiple queued scans sync sequentially, oldest first, each as its own independent request — no batching.
