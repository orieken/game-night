<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { format } from 'date-fns'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import type { Game } from '@/domain/entities/Game'
import type { GameNight } from '@/domain/entities/GameNight'
import type { GameSession, SessionResultInput } from '@/domain/entities/GameSession'
import type { GroupMember } from '@/domain/entities/Group'
import { validateSessionPlayers, validateSessionResults } from '@/domain/sessionValidation'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useToastStore } from '@/stores/toastStore'

const props = defineProps<{
  groupId: string
  event: GameNight
  games: Game[]
  members: GroupMember[]
  isHost: boolean
}>()

interface ResultDraft {
  placement: number | null
  score: number | null
}

const authStore = useAuthStore()
const store = useSessionStore()
const toastStore = useToastStore()
const starting = ref(false)
const selectedGameId = ref('')
const selectedPlayerIds = ref<string[]>([])
const notes = ref('')
const formError = ref<string | null>(null)
const editingSessionId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const resultDrafts = reactive<Record<string, ResultDraft>>({})

const eventGames = computed(() => props.games.filter((game) => props.event.selectedGameIds.includes(game.id)))
const canStart = computed(() => props.isHost && props.event.status === 'upcoming')

function gameFor(session: GameSession) {
  return props.games.find((game) => game.id === session.gameId)
}

function memberName(userId: string) {
  return props.members.find((member) => member.userId === userId)?.displayName ?? 'Group member'
}

function beginResults(session: GameSession) {
  editingSessionId.value = session.id
  formError.value = null
  for (const player of session.players) {
    resultDrafts[player.userId] = {
      placement: player.placement,
      score: player.score
    }
  }
}

function stopEditingResults() {
  editingSessionId.value = null
  formError.value = null
}

async function startSession() {
  const game = eventGames.value.find((item) => item.id === selectedGameId.value)
  if (!game || !authStore.user) {
    formError.value = 'Choose a game before starting a session.'
    return
  }

  const validationError = validateSessionPlayers(game, selectedPlayerIds.value)
  if (validationError) {
    formError.value = validationError
    return
  }

  const session = await store.startSession(
    props.groupId,
    props.event.id,
    game.id,
    authStore.user.id,
    selectedPlayerIds.value,
    notes.value.trim() || null
  )
  if (!session) {
    toastStore.show(store.error ?? 'Unable to start the session.', 'error')
    return
  }

  starting.value = false
  selectedGameId.value = ''
  selectedPlayerIds.value = []
  notes.value = ''
  formError.value = null
  toastStore.show(`${game.name} session started.`, 'success')
}

async function saveResults(session: GameSession) {
  const results: SessionResultInput[] = session.players.map((player) => ({
    userId: player.userId,
    placement: Number(resultDrafts[player.userId]?.placement),
    score: resultDrafts[player.userId]?.score === null || resultDrafts[player.userId]?.score === undefined
      ? null
      : Number(resultDrafts[player.userId].score)
  }))
  const validationError = validateSessionResults(session.players.map((player) => player.userId), results)
  if (validationError) {
    formError.value = validationError
    return
  }

  const saved = await store.saveResults(props.groupId, props.event.id, session.id, results)
  if (saved) {
    stopEditingResults()
    toastStore.show('Session results saved.', 'success')
  } else {
    toastStore.show(store.error ?? 'Unable to save results.', 'error')
  }
}

async function removeSession(session: GameSession) {
  const removed = await store.deleteSession(props.groupId, props.event.id, session.id)
  confirmingDeleteId.value = null
  if (removed) toastStore.show('Session deleted.', 'success')
  else toastStore.show(store.error ?? 'Unable to delete the session.', 'error')
}

watch(
  () => [props.groupId, props.event.id],
  () => void store.fetchSessions(props.groupId, props.event.id),
  { immediate: true }
)
</script>

<template>
  <section class="rounded-2xl border border-white/10 bg-[#181d27] p-6 sm:p-8">
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-bold text-white">Game sessions</h2>
        <p class="mt-1 text-sm text-slate-400">Start a game, record results, and keep the event history together.</p>
      </div>
      <AppButton v-if="canStart && !starting" :disabled="!eventGames.length" @click="starting = true">Start session</AppButton>
    </div>

    <p v-if="canStart && !eventGames.length" class="mt-5 rounded-xl bg-white/5 p-4 text-sm text-slate-400">
      Select at least one game for this event before starting a session.
    </p>

    <form v-if="starting" class="mt-6 space-y-5 rounded-xl border border-[#8b5cf6]/25 bg-[#8b5cf6]/5 p-5" @submit.prevent="startSession">
      <div>
        <label for="session-game" class="app-label">Game</label>
        <select id="session-game" v-model="selectedGameId" required class="app-field">
          <option value="" disabled>Choose a game</option>
          <option v-for="game in eventGames" :key="game.id" :value="game.id">{{ game.name }} · {{ game.minPlayers }}–{{ game.maxPlayers }} players</option>
        </select>
      </div>

      <fieldset>
        <legend class="text-sm font-semibold text-slate-300">Players</legend>
        <div class="mt-2 grid gap-3 sm:grid-cols-2">
          <label v-for="member in members" :key="member.userId" class="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200">
            <input v-model="selectedPlayerIds" type="checkbox" :value="member.userId" class="h-5 w-5 rounded border-white/20 bg-[#10131a] text-[#8b5cf6]">
            {{ member.displayName }}
          </label>
        </div>
      </fieldset>

      <div>
        <label for="session-notes" class="app-label">Notes <span class="text-slate-400">(optional)</span></label>
        <textarea id="session-notes" v-model="notes" rows="2" class="app-field"></textarea>
      </div>
      <p v-if="formError" class="text-sm text-red-300" role="alert">{{ formError }}</p>
      <div class="flex gap-3">
        <AppButton type="submit" :loading="store.loading">Start game</AppButton>
        <AppButton variant="secondary" @click="starting = false">Cancel</AppButton>
      </div>
    </form>

    <ErrorState v-if="store.error" class="mt-5" :message="store.error" :retryable="false" />
    <LoadingState v-if="store.loading && !store.sessions.length" class="mt-6" label="Loading session history…" />

    <div v-else-if="store.sessions.length" class="mt-6 space-y-4">
      <article v-for="session in store.sessions" :key="session.id" class="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-bold text-white">{{ gameFor(session)?.name ?? 'Unknown game' }}</h3>
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider" :class="session.status === 'completed' ? 'bg-[#57d2a4]/10 text-[#57d2a4]' : 'bg-amber-400/10 text-amber-300'">{{ session.status.replace('_', ' ') }}</span>
            </div>
            <p class="mt-1 text-xs text-slate-400">Started {{ format(session.startedAt, 'MMM d, yyyy · h:mm a') }}</p>
            <p v-if="session.notes" class="mt-3 text-sm text-slate-400">{{ session.notes }}</p>
          </div>
          <div v-if="isHost" class="flex gap-2">
            <AppButton v-if="editingSessionId !== session.id" variant="secondary" @click="beginResults(session)">{{ session.status === 'completed' ? 'Edit results' : 'Enter results' }}</AppButton>
            <AppButton v-if="confirmingDeleteId !== session.id" variant="ghost" @click="confirmingDeleteId = session.id">Delete</AppButton>
          </div>
        </div>

        <form v-if="editingSessionId === session.id" class="mt-5 border-t border-white/10 pt-5" @submit.prevent="saveResults(session)">
          <div class="grid gap-3">
            <div v-for="player in session.players" :key="player.userId" class="grid items-end gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-[1fr_8rem_8rem]">
              <p class="self-center font-medium text-white">{{ memberName(player.userId) }}</p>
              <label class="text-xs text-slate-400">Placement
                <input v-model.number="resultDrafts[player.userId].placement" type="number" min="1" :max="session.players.length" required class="app-field mt-1 !px-3">
              </label>
              <label class="text-xs text-slate-400">Score
                <input v-model.number="resultDrafts[player.userId].score" type="number" placeholder="Optional" class="app-field mt-1 !px-3">
              </label>
            </div>
          </div>
          <p v-if="formError" class="mt-3 text-sm text-red-300" role="alert">{{ formError }}</p>
          <div class="mt-4 flex gap-3">
            <AppButton type="submit" :loading="store.loading">Save results</AppButton>
            <AppButton variant="secondary" @click="stopEditingResults">Cancel</AppButton>
          </div>
        </form>

        <ol v-else-if="session.status === 'completed'" class="mt-5 space-y-2 border-t border-white/10 pt-4">
          <li v-for="player in [...session.players].sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999))" :key="player.userId" class="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 text-sm">
            <span class="text-slate-200"><strong class="mr-3 text-white">#{{ player.placement }}</strong>{{ memberName(player.userId) }}</span>
            <span class="text-slate-400">{{ player.score === null ? 'No score' : `${player.score} pts` }}</span>
          </li>
        </ol>
        <ul v-else class="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <li v-for="player in session.players" :key="player.userId" class="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300">{{ memberName(player.userId) }}</li>
        </ul>

        <div v-if="confirmingDeleteId === session.id" class="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p class="text-sm text-red-100">Delete this session and all of its results? This cannot be undone.</p>
          <div class="mt-3 flex gap-3">
            <AppButton variant="danger" :loading="store.loading" @click="removeSession(session)">Delete session</AppButton>
            <AppButton variant="secondary" @click="confirmingDeleteId = null">Keep session</AppButton>
          </div>
        </div>
      </article>
    </div>
    <p v-else class="mt-6 rounded-xl bg-white/5 p-4 text-sm text-slate-400">No games have been played at this event yet.</p>
  </section>
</template>
