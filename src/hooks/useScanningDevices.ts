import { useQuery } from "@tanstack/react-query"
import { scanningDeviceService } from "../services/scanningDeviceService"

export function useScanningDevices() {
  return useQuery({
    queryKey: ["scanning-devices"],
    queryFn: () => scanningDeviceService.getScanningDevices(),
  })
}
