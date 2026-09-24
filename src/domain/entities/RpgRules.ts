export type RulesEdition = '2014' | '2024'
export type RulesResourceType = 'spell' | 'creature' | 'equipment' | 'rule'
export type RulesProviderResource = 'spells' | 'creatures' | 'items' | 'magicitems' | 'rules'

export interface RulesReferenceSummary {
  key: string
  providerResource: RulesProviderResource
  resourceType: RulesResourceType
  name: string
  description: string
  edition: RulesEdition
  editionLabel: string
  sourceName: string
}

export interface RulesReferenceFact {
  label: string
  value: string
}

export interface RulesReferenceSection {
  title: string
  body: string
}

export interface RulesReferenceDetails extends RulesReferenceSummary {
  facts: RulesReferenceFact[]
  sections: RulesReferenceSection[]
  sourceUrl: string
}
