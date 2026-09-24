import type {
  RulesEdition,
  RulesProviderResource,
  RulesReferenceDetails,
  RulesReferenceFact,
  RulesReferenceSection,
  RulesReferenceSummary,
  RulesResourceType
} from '../../../src/domain/entities/RpgRules'

const OPEN5E_ROOT = 'https://api.open5e.com/v2'
const SOURCE_BY_EDITION: Record<RulesEdition, string> = {
  '2014': 'srd-2014',
  '2024': 'srd-2024'
}
const ALLOWED_SOURCES = new Set(Object.values(SOURCE_BY_EDITION))
const SOURCE_URL = 'https://www.dndbeyond.com/srd'

type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {}
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function displayValue(value: unknown): string | null {
  return stringValue(value) ?? (numberValue(value) !== null ? String(value) : null)
}

function nestedName(value: unknown): string | null {
  return stringValue(record(value).name)
}

function documentKey(value: UnknownRecord): string | null {
  return stringValue(value.document) ?? stringValue(record(value.document).key)
}

function editionForSource(source: string): RulesEdition {
  if (source === SOURCE_BY_EDITION['2014']) return '2014'
  if (source === SOURCE_BY_EDITION['2024']) return '2024'
  throw new Error('Open5e returned content outside the approved SRD sources.')
}

function sourceName(value: UnknownRecord, edition: RulesEdition): string {
  return stringValue(record(value.document).name) ?? `System Reference Document ${edition === '2014' ? '5.1' : '5.2'}`
}

function cleanText(value: unknown): string {
  return stringValue(value)?.replace(/\r\n/g, '\n').trim() ?? ''
}

function preview(value: unknown): string {
  const normalized = cleanText(value).replace(/[#*_`>]/g, '').replace(/\s+/g, ' ')
  return normalized.length > 220 ? `${normalized.slice(0, 217).trimEnd()}…` : normalized
}

function providerResources(resourceType: RulesResourceType): RulesProviderResource[] {
  if (resourceType === 'spell') return ['spells']
  if (resourceType === 'creature') return ['creatures']
  if (resourceType === 'equipment') return ['items', 'magicitems']
  return ['rules']
}

function resourceTypeFor(resource: RulesProviderResource): RulesResourceType {
  if (resource === 'spells') return 'spell'
  if (resource === 'creatures') return 'creature'
  if (resource === 'rules') return 'rule'
  return 'equipment'
}

function summaryDescription(value: UnknownRecord, resource: RulesProviderResource): string {
  if (resource === 'creatures') {
    const size = nestedName(value.size)
    const type = nestedName(value.type)
    const challengeRating = displayValue(value.challenge_rating)
    return [size, type, challengeRating ? `Challenge rating ${challengeRating}` : null].filter(Boolean).join(' · ')
  }
  if (resource === 'spells') {
    const level = numberValue(value.level)
    const school = nestedName(value.school)
    return [level === 0 ? 'Cantrip' : level !== null ? `Level ${level}` : null, school].filter(Boolean).join(' · ')
  }
  if (resource === 'items' || resource === 'magicitems') {
    return [nestedName(value.category), nestedName(value.rarity)].filter(Boolean).join(' · ')
  }
  return preview(value.desc)
}

export function mapOpen5eSummary(value: unknown, resource: RulesProviderResource): RulesReferenceSummary {
  const item = record(value)
  const source = documentKey(item)
  if (!source || !ALLOWED_SOURCES.has(source)) {
    throw new Error('Open5e returned content outside the approved SRD sources.')
  }

  const edition = editionForSource(source)
  const key = stringValue(item.key)
  const name = stringValue(item.name)
  if (!key || !name) throw new Error('Open5e returned an invalid rules entry.')

  return {
    key,
    providerResource: resource,
    resourceType: resourceTypeFor(resource),
    name,
    description: summaryDescription(item, resource),
    edition,
    editionLabel: edition === '2014' ? '2014 SRD' : '2024 SRD',
    sourceName: sourceName(item, edition)
  }
}

function fact(label: string, value: unknown): RulesReferenceFact | null {
  const displayed = displayValue(value)
  return displayed ? { label, value: displayed } : null
}

function namedList(value: unknown): string | null {
  if (!Array.isArray(value)) return null
  const names = value.map(nestedName).filter((name): name is string => Boolean(name))
  return names.length ? names.join(', ') : null
}

function section(title: string, body: unknown): RulesReferenceSection | null {
  const text = cleanText(body)
  return text ? { title, body: text } : null
}

function actionSections(value: unknown, fallbackTitle: string): RulesReferenceSection[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const action = record(entry)
    const body = cleanText(action.desc)
    if (!body) return []
    return [{ title: stringValue(action.name) ?? fallbackTitle, body }]
  })
}

function detailsFor(value: UnknownRecord, resource: RulesProviderResource): Pick<RulesReferenceDetails, 'facts' | 'sections'> {
  const facts: Array<RulesReferenceFact | null> = []
  const sections: Array<RulesReferenceSection | null> = []

  if (resource === 'spells') {
    const components = [value.verbal ? 'V' : null, value.somatic ? 'S' : null, value.material ? 'M' : null].filter(Boolean).join(', ')
    facts.push(
      fact('Level', numberValue(value.level) === 0 ? 'Cantrip' : value.level),
      fact('School', nestedName(value.school)),
      fact('Casting time', value.casting_time),
      fact('Range', value.range_text),
      fact('Duration', value.duration),
      fact('Components', components),
      fact('Classes', namedList(value.classes))
    )
    sections.push(section('At higher levels', value.higher_level), section('Material', value.material_specified))
  } else if (resource === 'creatures') {
    facts.push(
      fact('Size', nestedName(value.size)),
      fact('Type', nestedName(value.type)),
      fact('Challenge rating', value.challenge_rating),
      fact('Armor class', value.armor_class),
      fact('Hit points', value.hit_points),
      fact('Hit dice', value.hit_dice),
      fact('Alignment', value.alignment),
      fact('Languages', record(value.languages).as_string)
    )
    sections.push(...actionSections(value.traits, 'Trait'), ...actionSections(value.actions, 'Action'))
  } else if (resource === 'items' || resource === 'magicitems') {
    facts.push(
      fact('Category', nestedName(value.category)),
      fact('Rarity', nestedName(value.rarity)),
      fact('Cost', value.cost),
      fact('Weight', value.weight ? `${value.weight} ${stringValue(value.weight_unit) ?? ''}`.trim() : null),
      fact('Attunement', value.requires_attunement === true ? 'Required' : value.requires_attunement === false ? 'Not required' : null)
    )
    const weapon = record(value.weapon)
    const armor = record(value.armor)
    facts.push(fact('Damage', weapon.damage_dice), fact('Armor class', armor.ac_display))
    sections.push(section('Attunement', value.attunement_detail))
  }

  return {
    facts: facts.filter((entry): entry is RulesReferenceFact => Boolean(entry)),
    sections: sections.filter((entry): entry is RulesReferenceSection => Boolean(entry))
  }
}

export function mapOpen5eDetails(value: unknown, resource: RulesProviderResource): RulesReferenceDetails {
  const item = record(value)
  const summary = mapOpen5eSummary(item, resource)
  const detail = detailsFor(item, resource)
  return {
    ...summary,
    description: cleanText(item.desc) || summary.description,
    facts: detail.facts,
    sections: detail.sections,
    sourceUrl: SOURCE_URL
  }
}

async function requestOpen5e(path: string): Promise<unknown> {
  try {
    const response = await fetch(`${OPEN5E_ROOT}${path}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'GameNight/1.0 (https://rieken-game-night.netlify.app/)' },
      signal: AbortSignal.timeout(8_000)
    })
    if (!response.ok) throw new Error(`Open5e request failed with status ${response.status}.`)
    return await response.json()
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error('The rules reference timed out. Campaigns and characters are still available.')
    }
    if (error instanceof Error && error.message.startsWith('Open5e request failed')) {
      throw new Error('The rules reference is unavailable right now. Campaigns and characters are still available.')
    }
    throw error
  }
}

export async function searchRules(
  query: string,
  resourceType: RulesResourceType,
  edition: RulesEdition
): Promise<RulesReferenceSummary[]> {
  const source = SOURCE_BY_EDITION[edition]
  const resources = providerResources(resourceType)
  const resultSets = await Promise.all(resources.map(async (resource) => {
    const params = new URLSearchParams({
      name__icontains: query,
      document__key__in: source,
      limit: resourceType === 'equipment' ? '10' : '20'
    })
    const payload = record(await requestOpen5e(`/${resource}/?${params}`))
    if (!Array.isArray(payload.results)) throw new Error('Open5e returned an invalid response.')

    return payload.results
      .filter((item) => documentKey(record(item)) === source)
      .map((item) => mapOpen5eSummary(item, resource))
  }))

  return resultSets.flat().sort((left, right) => left.name.localeCompare(right.name)).slice(0, 20)
}

export async function getRuleDetails(resource: RulesProviderResource, key: string): Promise<RulesReferenceDetails | null> {
  const payload = await requestOpen5e(`/${resource}/${encodeURIComponent(key)}/`)
  const item = record(payload)
  if (!Object.keys(item).length) return null
  return mapOpen5eDetails(item, resource)
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': status === 200 ? 'public, max-age=300, s-maxage=3600' : 'no-store' }
  })
}

export function rulesErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unexpected rules reference error.'
  const status = message.includes('invalid') || message.includes('outside') ? 502 : 503
  return json({ error: message }, status)
}
