import NetInfo from "@react-native-community/netinfo"
import { attendanceService } from "./attendanceService"
import { offlineScanQueue } from "./offlineScanQueue"

type Listener = () => void

let syncing = false
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((l) => l())
}

// Best-effort: each queued scan is uploaded one at a time so a mid-sync
// network drop only leaves the remaining entries queued, not corrupted.
async function drainQueue(): Promise<void> {
  if (syncing) return
  syncing = true
  try {
    const queue = await offlineScanQueue.getAll()
    for (const entry of queue) {
      try {
        await attendanceService.scanFace(
          entry.photoPath,
          entry.capturedAt,
          entry.lat,
          entry.lng,
          new Date().toISOString()
        )
        await offlineScanQueue.remove(entry.id)
        notify()
      } catch {
        // Still offline, or this entry failed — stop and retry on the next
        // reconnect/foreground event rather than spinning through the rest.
        break
      }
    }
  } finally {
    syncing = false
  }
}

let unsubscribeNetInfo: (() => void) | null = null

function start(): void {
  if (unsubscribeNetInfo) return
  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      drainQueue()
    }
  })
}

function stop(): void {
  unsubscribeNetInfo?.()
  unsubscribeNetInfo = null
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const offlineScanSync = { start, stop, drainQueue, subscribe }
