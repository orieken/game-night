<script setup lang="ts">
import { computed, watch } from 'vue'
import { format } from 'date-fns'
import { useRoute } from 'vue-router'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { usePublicStoryHighlightStore } from '@/stores/publicStoryHighlightStore'

const route = useRoute()
const storyStore = usePublicStoryHighlightStore()
const groupId = computed(() => typeof route.params.groupId === 'string' ? route.params.groupId : null)
const campaignId = computed(() => typeof route.params.campaignId === 'string' ? route.params.campaignId : null)
const logId = computed(() => typeof route.params.logId === 'string' ? route.params.logId : null)

async function loadHighlight() {
  storyStore.reset()
  if (groupId.value && campaignId.value && logId.value) await storyStore.fetchPublic(groupId.value, campaignId.value, logId.value)
}

watch([groupId, campaignId, logId], () => void loadHighlight(), { immediate: true })
</script>

<template>
  <main class="min-h-screen bg-[#10131a] px-4 py-12 text-[#f7f1e6] sm:px-8">
    <div class="mx-auto max-w-3xl">
      <RouterLink to="/" class="inline-flex items-center gap-3 text-lg font-bold text-white"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[#ff6b5e] text-xl text-[#10131a]">✦</span>Game Night</RouterLink>
      <LoadingState v-if="storyStore.loading" class="mt-16" label="Opening the story…" />
      <ErrorState v-else-if="storyStore.error" class="mt-16" message="This public story is unavailable or has been unpublished." :retryable="false" />
      <article v-else-if="storyStore.currentHighlight?.published" class="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-[#181d27] shadow-2xl shadow-black/20">
        <div class="bg-gradient-to-r from-[#33255e] via-[#253453] to-[#174638] px-6 py-10 sm:px-10"><p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#57d2a4]">A story from {{ storyStore.currentHighlight.campaignName }}</p><h1 class="display-title mt-3 text-3xl font-bold text-white sm:text-5xl">{{ storyStore.currentHighlight.title }}</h1><p class="mt-4 text-sm text-slate-300">Session {{ storyStore.currentHighlight.sessionNumber }} · {{ format(storyStore.currentHighlight.sessionDate, 'MMMM d, yyyy') }}</p></div>
        <div class="px-6 py-8 sm:px-10 sm:py-12"><p class="whitespace-pre-wrap text-lg leading-8 text-slate-200">{{ storyStore.currentHighlight.excerpt }}</p><p class="mt-10 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">This is a deliberately published story highlight. Private campaign recaps, character data, and DM notes are not included.</p></div>
      </article>
      <ErrorState v-else class="mt-16" message="This public story is unavailable or has been unpublished." :retryable="false" />
    </div>
  </main>
</template>
