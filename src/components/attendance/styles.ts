import { StyleSheet } from "react-native"
import { spacing, radii, colors as palette } from "../../constants/theme"

export const sharedStyles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.success.default,
    borderWidth: 2,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  timelineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    width: 108,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineTimes: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    flexShrink: 0,
    minWidth: 78,
  },
  timeDash: {
    width: 16,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing[2],
    flexShrink: 0,
  },
})
