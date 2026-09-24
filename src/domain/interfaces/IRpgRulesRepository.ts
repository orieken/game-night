import type {
  RulesEdition,
  RulesProviderResource,
  RulesReferenceDetails,
  RulesReferenceSummary,
  RulesResourceType
} from '@/domain/entities/RpgRules'

export interface IRpgRulesRepository {
  search(query: string, resourceType: RulesResourceType, edition: RulesEdition): Promise<RulesReferenceSummary[]>
  getDetails(resource: RulesProviderResource, key: string): Promise<RulesReferenceDetails>
}
