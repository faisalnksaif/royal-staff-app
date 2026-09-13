import { useState } from "react"
import { ActivityIndicator, Pressable } from "react-native"
import { Sheet } from "lucide-react-native"
import Toast from "react-native-toast-message"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing } from "../../constants/theme"
import type { AppError } from "../../types"

interface Props {
  /** Runs the download. Errors are surfaced as a toast, not thrown. */
  onExport: () => Promise<void>
  /** Disabled while the underlying list is still loading - nothing to export yet. */
  disabled?: boolean
}

/**
 * Header-bar Excel export button, styled to match RefreshButton.
 *
 * Owns its own pending state rather than taking one as a prop: an export is a
 * one-shot action with no cache entry behind it, so react-query isn't involved
 * and there's no shared state for a parent to hold.
 */
export default function ExportButton({ onExport, disabled = false }: Props) {
  const { colors } = useTheme()
  const [isExporting, setIsExporting] = useState(false)

  async function handlePress() {
    if (isExporting || disabled) return
    setIsExporting(true)
    try {
      await onExport()
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Export failed",
        text2: (error as AppError)?.message ?? "Could not generate the Excel file",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isExporting}
      hitSlop={8}
      accessibilityLabel="Export to Excel"
      style={{ padding: spacing[2], cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1 } as any}
    >
      {isExporting
        ? <ActivityIndicator size="small" color={colors.accent} />
        : <Sheet size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
    </Pressable>
  )
}
