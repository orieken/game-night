import { XMLParser } from 'fast-xml-parser'
import type { GameCatalogDetails, GameCatalogSummary } from '../../domain/entities/GameCatalog'

interface XmlNode {
  [key: string]: unknown
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  trimValues: true
})

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function asNode(value: unknown): XmlNode {
  return value && typeof value === 'object' ? value as XmlNode : {}
}

function attribute(node: unknown, key = 'value'): string | null {
  const value = asNode(node)[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null
}

function numberAttribute(node: unknown, key = 'value'): number | null {
  const rawValue = attribute(node, key)
  if (rawValue === null || rawValue.trim() === '') return null
  const value = Number(rawValue)
  return Number.isFinite(value) ? value : null
}

function text(node: unknown): string | null {
  return typeof node === 'string' && node.trim() ? node.trim() : null
}

function primaryName(item: XmlNode): string {
  const names = asArray(item.name).map(asNode)
  const primary = names.find((name) => attribute(name, 'type') === 'primary') ?? names[0]
  return attribute(primary) ?? 'Unknown game'
}

function links(item: XmlNode, type: string): string[] {
  return asArray(item.link)
    .map(asNode)
    .filter((link) => attribute(link, 'type') === type)
    .map((link) => attribute(link))
    .filter((value): value is string => Boolean(value))
}

function itemNodes(xml: string): XmlNode[] {
  const root = asNode(parser.parse(xml))
  return asArray(asNode(root.items).item).map(asNode)
}

export function parseBggSearchXml(xml: string): Array<Pick<GameCatalogSummary, 'bggId' | 'name' | 'yearPublished'>> {
  return itemNodes(xml).flatMap((item) => {
    const bggId = numberAttribute(item, 'id')
    if (bggId === null) return []
    return [{ bggId, name: primaryName(item), yearPublished: numberAttribute(item.yearpublished) }]
  })
}

export function parseBggThingsXml(xml: string): GameCatalogDetails[] {
  return itemNodes(xml).flatMap((item) => {
    const bggId = numberAttribute(item, 'id')
    if (bggId === null) return []

    const statistics = asNode(item.statistics)
    const ratings = asNode(statistics.ratings)

    return [{
      bggId,
      name: primaryName(item),
      yearPublished: numberAttribute(item.yearpublished),
      thumbnailUrl: text(item.thumbnail),
      imageUrl: text(item.image),
      description: text(item.description),
      minPlayers: numberAttribute(item.minplayers),
      maxPlayers: numberAttribute(item.maxplayers),
      playingTimeMinutes: numberAttribute(item.playingtime),
      categories: links(item, 'boardgamecategory'),
      mechanics: links(item, 'boardgamemechanic'),
      complexityWeight: numberAttribute(ratings.averageweight),
      sourceUrl: `https://boardgamegeek.com/boardgame/${bggId}`
    }]
  })
}
