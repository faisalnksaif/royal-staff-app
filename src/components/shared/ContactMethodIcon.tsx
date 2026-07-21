import { Phone, MessageSquare, Mail, UserCheck, MessageCircle } from "lucide-react-native"
import type { ContactMethod } from "../../types"

interface Props {
  method: ContactMethod
  color: string
  size?: number
}

export default function ContactMethodIcon({ method, color, size = 12 }: Props) {
  const p = { size, color, strokeWidth: 1.75 }
  switch (method) {
    case "phoneCall":  return <Phone {...p} />
    case "sms":        return <MessageSquare {...p} />
    case "email":      return <Mail {...p} />
    case "inPerson":   return <UserCheck {...p} />
    case "whatsapp":   return <MessageCircle {...p} />
  }
}
