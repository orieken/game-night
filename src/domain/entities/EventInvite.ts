export interface EventInvite {
  code: string
  groupId: string
  eventId: string
  eventName: string
  eventDate: Date
  location: string | null
  active: boolean
}
