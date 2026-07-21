import { View, StyleSheet } from "react-native"
import AppText from "../ui/AppText"

export interface TimelineEvent {
  icon: React.ReactNode
  text: string
  color: string
}

interface EventRowProps {
  icon: React.ReactNode
  text: string
  color: string
  isLast: boolean
}

function EventRow({ icon, text, color, isLast }: EventRowProps) {
  return (
    <View style={styles.eventRow}>
      <View style={styles.eventDotCol}>
        <View style={[styles.eventDot, { backgroundColor: color }]} />
        {!isLast && <View style={[styles.eventLine, { backgroundColor: color + "40" }]} />}
      </View>
      <View style={[styles.eventText, !isLast && styles.eventTextSpaced]}>
        <View style={styles.eventTextInner}>
          {icon}
          <AppText variant="caption" style={{ color, flex: 1, fontSize: 12 }}>{text}</AppText>
        </View>
      </View>
    </View>
  )
}

interface Props {
  events: TimelineEvent[]
}

export default function FollowUpTimeline({ events }: Props) {
  if (events.length === 0) return null
  return (
    <View>
      {events.map((ev, i) => (
        <EventRow key={i} icon={ev.icon} text={ev.text} color={ev.color} isLast={i === events.length - 1} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  eventRow: { flexDirection: "row" },
  eventDotCol: { width: 18, alignItems: "center", paddingTop: 3 },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventLine: { width: 1.5, flex: 1, marginTop: 3, borderRadius: 1 },
  eventText: { flex: 1, paddingLeft: 8 },
  eventTextSpaced: { paddingBottom: 12 },
  eventTextInner: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
})
