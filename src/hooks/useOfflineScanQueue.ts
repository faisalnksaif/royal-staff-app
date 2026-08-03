import { useCallback, useEffect, useState } from "react"
import { offlineScanQueue } from "../services/offlineScanQueue"
import { offlineScanSync } from "../services/offlineScanSync"

export function useOfflineScanQueue() {
  const [pendingCount, setPendingCount] = useState(0)

  const refresh = useCallback(() => {
    offlineScanQueue.count().then(setPendingCount)
  }, [])

  useEffect(() => {
    offlineScanSync.start()
    refresh()
    const unsubscribe = offlineScanSync.subscribe(refresh)
    return unsubscribe
  }, [refresh])

  return { pendingCount, refresh }
}
