export const E2E_USER = {
  email: 'host@example.com',
  password: 'playwright123!',
  displayName: 'Test Host'
} as const

export const E2E_GUEST = {
  email: 'guest@example.com',
  password: 'playwright123!',
  displayName: 'Test Guest'
} as const

export const E2E_GAME = {
  id: 'azul',
  name: 'Azul'
} as const

export const E2E_HEROQUEST_GAME = {
  id: 'heroquest',
  name: 'HeroQuest'
} as const

export const E2E_CAMPAIGN = {
  id: 'davokar-campaign',
  name: 'E2E Davokar Campaign'
} as const

export const E2E_CHARACTER = {
  id: 'aric-ironfoot',
  name: 'Aric Ironfoot'
} as const

export const E2E_RSVP_EVENTS = {
  public: 'rsvp-public',
  full: 'rsvp-full',
  invitedPrivate: 'rsvp-private-invited',
  uninvitedPrivate: 'rsvp-private-uninvited'
} as const
