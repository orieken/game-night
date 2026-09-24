<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import type { RulesEdition, RulesReferenceSummary, RulesResourceType } from '@/domain/entities/RpgRules'
import { useRpgRulesStore } from '@/stores/rpgRulesStore'

const rulesStore = useRpgRulesStore()
const query = ref('')
const edition = ref<RulesEdition>('2024')
const resourceType = ref<RulesResourceType>('spell')
let searchTimer: number | null = null

const resourceOptions: Array<{ value: RulesResourceType; label: string }> = [
  { value: 'spell', label: 'Spells' },
  { value: 'creature', label: 'Creatures' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'rule', label: 'Rules' }
]

function queueSearch() {
  if (searchTimer) globalThis.clearTimeout(searchTimer)
  if (query.value.trim().length < 2) {
    rulesStore.clear()
    return
  }
  searchTimer = globalThis.setTimeout(
    () => void rulesStore.search(query.value, resourceType.value, edition.value),
    350
  )
}

async function selectEntry(result: RulesReferenceSummary) {
  await rulesStore.selectEntry(result)
  globalThis.document.querySelector('#rules-entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch([query, edition, resourceType], queueSearch)
onUnmounted(() => {
  if (searchTimer) globalThis.clearTimeout(searchTimer)
  rulesStore.clear()
})
</script>

<template>
  <div class="mx-auto max-w-6xl">
    <PageHeader
      eyebrow="Optional reference"
      title="5e rules library"
      description="Look up open 2014 or 2024 SRD material without leaving your campaign. This reference never controls character or campaign data."
    />

    <section class="rounded-2xl border border-white/10 bg-[#181d27] p-5 sm:p-6" aria-labelledby="rules-search-heading">
      <div class="flex flex-col gap-1">
        <h2 id="rules-search-heading" class="text-lg font-bold text-white">Search the open rules</h2>
        <p class="text-sm text-slate-400">Choose an edition and category, then enter at least two characters.</p>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-[1fr_12rem_12rem]">
        <div>
          <label for="rules-query" class="app-label">Name or title</label>
          <input id="rules-query" v-model="query" type="search" class="app-field" placeholder="Try fireball, goblin, or combat" autocomplete="off">
        </div>
        <div>
          <label for="rules-edition" class="app-label">Edition</label>
          <select id="rules-edition" v-model="edition" class="app-field">
            <option value="2024">2024 SRD</option>
            <option value="2014">2014 SRD</option>
          </select>
        </div>
        <div>
          <label for="rules-category" class="app-label">Category</label>
          <select id="rules-category" v-model="resourceType" class="app-field">
            <option v-for="option in resourceOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </div>
    </section>

    <div v-if="rulesStore.error" class="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5" role="alert">
      <p class="font-semibold text-amber-100">Rules lookup is temporarily unavailable</p>
      <p class="mt-1 text-sm leading-6 text-amber-100/80">{{ rulesStore.error }}</p>
      <div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
        <router-link to="/campaigns" class="text-[#57d2a4] hover:text-[#85e4c3]">Continue to campaigns</router-link>
        <router-link to="/characters" class="text-[#57d2a4] hover:text-[#85e4c3]">Continue to characters</router-link>
      </div>
    </div>

    <LoadingState v-if="rulesStore.loading" class="mt-5" label="Searching the rules reference…" />

    <section v-else-if="rulesStore.results.length" class="mt-6" aria-labelledby="rules-results-heading">
      <h2 id="rules-results-heading" class="text-lg font-bold text-white">Results</h2>
      <ul class="mt-3 grid gap-3 md:grid-cols-2">
        <li v-for="result in rulesStore.results" :key="`${result.providerResource}:${result.key}`">
          <button
            type="button"
            class="h-full w-full rounded-2xl border border-white/10 bg-[#181d27] p-5 text-left transition hover:border-[#57d2a4]/50 hover:bg-[#222938] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57d2a4]"
            :aria-label="`View ${result.name} from the ${result.editionLabel}`"
            @click="selectEntry(result)"
          >
            <span class="flex items-start justify-between gap-3">
              <strong class="text-white">{{ result.name }}</strong>
              <span class="shrink-0 rounded-full bg-[#8b5cf6]/15 px-2.5 py-1 text-xs font-semibold text-[#c4b5fd]">{{ result.editionLabel }}</span>
            </span>
            <span v-if="result.description" class="mt-2 block text-sm leading-6 text-slate-400">{{ result.description }}</span>
          </button>
        </li>
      </ul>
    </section>

    <section v-else-if="rulesStore.hasSearched && !rulesStore.error" class="mt-6 rounded-2xl border border-white/10 bg-[#181d27] p-8 text-center">
      <h2 class="font-bold text-white">No matching open rules</h2>
      <p class="mt-2 text-sm text-slate-400">Try a shorter term, another category, or the other SRD edition.</p>
    </section>

    <LoadingState v-if="rulesStore.loadingDetails" class="mt-6" label="Loading rule details…" />

    <article v-else-if="rulesStore.selected" id="rules-entry" tabindex="-1" class="mt-8 scroll-mt-6 rounded-3xl border border-[#57d2a4]/25 bg-[#181d27] p-6 sm:p-8">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.16em] text-[#57d2a4]">{{ rulesStore.selected.editionLabel }}</p>
          <h2 class="mt-2 text-2xl font-bold text-white sm:text-3xl">{{ rulesStore.selected.name }}</h2>
        </div>
        <span class="w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-semibold capitalize text-slate-300">{{ rulesStore.selected.resourceType }}</span>
      </div>

      <dl v-if="rulesStore.selected.facts.length" class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="item in rulesStore.selected.facts" :key="item.label" class="rounded-xl bg-white/5 p-4">
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ item.label }}</dt>
          <dd class="mt-1 text-sm text-slate-100">{{ item.value }}</dd>
        </div>
      </dl>

      <div v-if="rulesStore.selected.description" class="mt-7 whitespace-pre-line text-sm leading-7 text-slate-200">{{ rulesStore.selected.description }}</div>

      <section v-for="section in rulesStore.selected.sections" :key="`${section.title}:${section.body.slice(0, 24)}`" class="mt-7 border-t border-white/10 pt-6">
        <h3 class="font-bold text-white">{{ section.title }}</h3>
        <p class="mt-2 whitespace-pre-line text-sm leading-7 text-slate-300">{{ section.body }}</p>
      </section>
    </article>

    <aside class="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-xs leading-6 text-slate-400" aria-label="Rules content attribution">
      <p v-if="edition === '2014'">
        This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at
        <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer" class="text-[#57d2a4] hover:text-[#85e4c3]">D&amp;D Beyond</a>.
        The SRD 5.1 is licensed under the
        <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer" class="text-[#57d2a4] hover:text-[#85e4c3]">Creative Commons Attribution 4.0 International License</a>.
      </p>
      <p v-else>
        This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at
        <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer" class="text-[#57d2a4] hover:text-[#85e4c3]">D&amp;D Beyond</a>.
        The SRD 5.2 is licensed under the
        <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer" class="text-[#57d2a4] hover:text-[#85e4c3]">Creative Commons Attribution 4.0 International License</a>.
      </p>
      <p class="mt-2">Rules data is provided through Open5e. Symbaroum-specific rules and other third-party sources are intentionally excluded.</p>
    </aside>
  </div>
</template>
