import { computed, reactive, ref } from 'vue';
import type { SessionProgressionPayload } from '../contracts/sessionProgression';
import {
  createWebApiClient,
  WebApiClientError,
  type SaveSlotDto,
  type SessionStartResponse,
} from '../adapters/api/webApiClient';
import { webPlatformStorage } from '../adapters/platform/webPlatformStorage';
import {
  buildActiveActionOverlayCard,
  buildChoiceFeedbackOverlayCard,
  buildPeriodSummaryOverlayCard,
  buildPeriodSummaryOverlayCards,
  buildPlayerDeltaOverlayCard,
  buildStageResultOverlayCard,
  type ProgressionOverlayPayload,
} from '../types/progressionOverlay';
import type { ProgressionAckKind } from '../contracts/sessionProgression';

export type ApiFlowState =
  | 'idle'
  | 'loading'
  | 'auth_error'
  | 'server_unavailable'
  | 'compatibility_error'
  | 'stale_conflict'
  | 'ready';

const apiClient = createWebApiClient();

export function isApiModeEnabled(): boolean {
  return apiClient !== null;
}

function applyProgressionToEngine(
  engineState: {
    sessionPhase: SessionProgressionPayload['sessionPhase'];
    planningOptions: SessionProgressionPayload['planningOptions'];
    activeActionSummary: SessionProgressionPayload['activeActionSummary'];
    disturbanceNarrative: SessionProgressionPayload['disturbanceNarrative'];
    periodSummary: SessionProgressionPayload['periodSummary'];
    passiveNarrative: SessionProgressionPayload['passiveNarrative'];
    currentEvent: SessionStartResponse['nextEvent'];
    availableChoices: Array<{ id: string; text: string; description?: string }>;

    showingDisturbanceNarrative: boolean;
  },
  payload: SessionProgressionPayload,
): void {
  engineState.sessionPhase = payload.sessionPhase;
  engineState.planningOptions = payload.planningOptions ?? [];
  engineState.activeActionSummary = payload.activeActionSummary;
  engineState.disturbanceNarrative = payload.disturbanceNarrative;
  engineState.periodSummary = payload.periodSummary ?? null;
  engineState.passiveNarrative = payload.passiveNarrative ?? null;
  engineState.currentEvent = payload.nextEvent;
  engineState.availableChoices =
    payload.nextEvent?.choices?.filter(choice => choice.available) ?? [];
  engineState.showingDisturbanceNarrative =
    payload.sessionPhase === 'disturbance_narrative';
}

export function useApiGameEngine() {
  const flowState = ref<ApiFlowState>('idle');
  const flowMessage = ref('');
  const saveSlots = ref<SaveSlotDto[]>([]);
  const deviceToken = ref<string | null>(null);
  const activeSession = ref<SessionStartResponse | null>(null);
  const isProcessing = ref(false);

  const engineState = reactive({
    sessionPhase: 'story_event' as SessionProgressionPayload['sessionPhase'],
    planningOptions: [] as SessionProgressionPayload['planningOptions'],
    activeActionSummary: null as SessionProgressionPayload['activeActionSummary'],
    disturbanceNarrative: null as SessionProgressionPayload['disturbanceNarrative'],
    periodSummary: null as SessionProgressionPayload['periodSummary'],
    passiveNarrative: null as SessionProgressionPayload['passiveNarrative'],
    showingDisturbanceNarrative: false,
    currentEvent: null as SessionStartResponse['nextEvent'],
    availableChoices: [] as Array<{ id: string; text: string; description?: string }>,

    lastChoiceFeedback: null as string | null,
    lastOutcomeText: null as string | null,
    progressionOverlay: null as ProgressionOverlayPayload | null,
    automaticAdvanceError: null as string | null,
  });

  const slotVersion = computed(() => activeSession.value?.slot.version ?? 0);
  const snapshotId = computed(() => activeSession.value?.snapshot.id ?? '');

  function applySessionResponse(response: SessionStartResponse): void {
    activeSession.value = response;
    applyProgressionToEngine(engineState, response);
    engineState.lastChoiceFeedback = null;
    engineState.lastOutcomeText = null;
    engineState.progressionOverlay = null;
    engineState.automaticAdvanceError = null;
  }

  function applyProgressionResponse(payload: SessionProgressionPayload): void {
    if (!activeSession.value) return;
    activeSession.value = {
      ...activeSession.value,
      ...payload,
      slot: {
        ...activeSession.value.slot,
        version: payload.slotVersion,
        snapshotId: payload.snapshotId,
      },
      snapshot: { ...activeSession.value.snapshot, id: payload.snapshotId },
    };
    applyProgressionToEngine(engineState, payload);
  }

  function mapApiError(error: unknown): void {
    if (!(error instanceof WebApiClientError)) {
      flowState.value = 'server_unavailable';
      flowMessage.value = '服务器不可用';
      return;
    }
    if (error.category === 'auth') {
      flowState.value = 'auth_error';
      flowMessage.value = error.message;
      return;
    }
    if (error.category === 'conflict') {
      flowState.value = 'stale_conflict';
      flowMessage.value = '进度已在其他窗口更新，请重新加载存档';
      return;
    }
    if (error.code === 'ENGINE_VERSION_UNSUPPORTED' || error.code === 'CATALOG_VERSION_UNSUPPORTED') {
      flowState.value = 'compatibility_error';
      flowMessage.value = error.message;
      return;
    }
    flowState.value = 'server_unavailable';
    flowMessage.value = error.message;
  }

  async function bootstrap(): Promise<void> {
    if (!apiClient) return;
    flowState.value = 'loading';
    const ready = await apiClient.healthReady();
    if (!ready) {
      flowState.value = 'server_unavailable';
      flowMessage.value = '后端未就绪';
      return;
    }
    deviceToken.value = await apiClient.ensureDeviceToken();
    saveSlots.value = await apiClient.listSaves(deviceToken.value);
    flowState.value = 'ready';
    flowMessage.value = '';
  }

  async function refreshSaves(): Promise<void> {
    if (!apiClient || !deviceToken.value) return;
    saveSlots.value = await apiClient.listSaves(deviceToken.value);
  }

  async function startNewGameInSlot(
    slotIndex: number,
    playerName: string,
    gender: 'male' | 'female',
    confirmOverwrite?: boolean,
  ): Promise<boolean> {
    if (!apiClient || !deviceToken.value) return false;
    try {
      flowState.value = 'loading';
      const response = await apiClient.createSession({
        deviceToken: deviceToken.value,
        slotIndex,
        playerName,
        gender,
        confirmOverwrite,
      });
      applySessionResponse(response);
      flowState.value = 'ready';
      await refreshSaves();
      return true;
    } catch (error) {
      mapApiError(error);
      return false;
    }
  }

  async function continueSlot(slotIndex: number): Promise<boolean> {
    if (!apiClient || !deviceToken.value) return false;
    try {
      flowState.value = 'loading';
      const response = await apiClient.restoreSession(deviceToken.value, slotIndex);
      applySessionResponse(response);
      if (response.sessionPhase === 'period_summary' && response.periodSummary) {
        const resultCards = buildPeriodSummaryOverlayCards(
          `period-${response.snapshot.id}`,
          response.periodSummary,
        );
        const next = await requestProgressionAck('period_summary');
        applyProgressionResponse(next);
        engineState.progressionOverlay = { cards: resultCards };
      } else if (response.sessionPhase === 'action_summary' && response.activeActionSummary) {
        const resultCard = buildActiveActionOverlayCard(
          `active-action-restored-${response.snapshot.id}`,
          response.activeActionSummary,
        );
        const next = await requestProgressionAck('action_summary');
        applyProgressionResponse(next);
        engineState.progressionOverlay = { cards: [resultCard] };
      }
      flowState.value = 'ready';
      return true;
    } catch (error) {
      mapApiError(error);
      return false;
    }
  }

  async function handleChoice(choice: { id: string }): Promise<void> {
    if (!apiClient || !deviceToken.value || !activeSession.value || isProcessing.value) return;
    const eventId = engineState.currentEvent?.eventId;
    if (!eventId) return;
    const completedStageTitle = engineState.currentEvent?.title || '上一阶段';
    const selectedChoice = engineState.currentEvent?.choices?.find(item => item.id === choice.id);
    isProcessing.value = true;
    try {
      const sessionId = webPlatformStorage.getSessionId();
      const sessionToken = webPlatformStorage.getSessionToken();
      if (!sessionId || !sessionToken) throw new WebApiClientError('auth', 'UNAUTHORIZED', '会话失效', 401);
      const result = await apiClient.executeChoice({
        deviceToken: deviceToken.value,
        sessionId,
        sessionToken,
        expectedSlotVersion: activeSession.value.slot.version,
        expectedSnapshotId: activeSession.value.snapshot.id,
        eventId,
        choiceId: choice.id,
      });
      applyProgressionResponse(result);
      engineState.lastChoiceFeedback = result.feedback?.player.narrativeResult ?? null;
      const overlayCard = result.feedback
          ? buildChoiceFeedbackOverlayCard(
            `choice-${eventId}-${choice.id}`,
            completedStageTitle,
            selectedChoice?.text || '已选择',
            result.feedback,
            [selectedChoice?.text, selectedChoice?.description],
          )
        : null;
      engineState.progressionOverlay = overlayCard ? { cards: [overlayCard] } : null;
    } catch (error) {
      mapApiError(error);
    } finally {
      isProcessing.value = false;
    }
  }

  async function handleActiveAction(actionId: string): Promise<void> {
    if (!apiClient || !deviceToken.value || !activeSession.value || isProcessing.value) return;
    if (engineState.sessionPhase !== 'active_planning') return;
    isProcessing.value = true;
    try {
      const sessionId = webPlatformStorage.getSessionId();
      const sessionToken = webPlatformStorage.getSessionToken();
      if (!sessionId || !sessionToken) throw new WebApiClientError('auth', 'UNAUTHORIZED', '会话失效', 401);
      const result = await apiClient.executeActiveAction({
        deviceToken: deviceToken.value,
        sessionId,
        sessionToken,
        expectedSlotVersion: activeSession.value.slot.version,
        expectedSnapshotId: activeSession.value.snapshot.id,
        actionId,
      });
      engineState.progressionOverlay = result.activeActionSummary
        ? {
            cards: [
              buildActiveActionOverlayCard(`active-action-${actionId}`, result.activeActionSummary),
            ],
          }
        : null;
      applyProgressionResponse(result);
      engineState.automaticAdvanceError = null;
      if (result.sessionPhase === 'action_summary') {
        try {
          const next = await requestProgressionAck('action_summary');
          applyProgressionResponse(next);
          flowState.value = 'ready';
          flowMessage.value = '';
        } catch (error) {
          mapApiError(error);
          engineState.automaticAdvanceError = flowMessage.value || '下一阶段载入失败，请重试';
        }
      }
    } catch (error) {
      mapApiError(error);
    } finally {
      isProcessing.value = false;
    }
  }

  async function requestProgressionAck(ackKind: ProgressionAckKind): Promise<SessionProgressionPayload> {
    if (!apiClient || !deviceToken.value || !activeSession.value) {
      throw new WebApiClientError('auth', 'UNAUTHORIZED', '会话失效', 401);
    }
    const sessionId = webPlatformStorage.getSessionId();
    const sessionToken = webPlatformStorage.getSessionToken();
    if (!sessionId || !sessionToken) {
      throw new WebApiClientError('auth', 'UNAUTHORIZED', '会话失效', 401);
    }
    return apiClient.acknowledgeProgression({
      deviceToken: deviceToken.value,
      sessionId,
      sessionToken,
      expectedSlotVersion: activeSession.value.slot.version,
      expectedSnapshotId: activeSession.value.snapshot.id,
      ackKind,
    });
  }

  async function handleProgressionAck(): Promise<void> {
    if (!apiClient || !deviceToken.value || !activeSession.value || isProcessing.value) return;
    const ackKind =
      engineState.sessionPhase === 'disturbance_narrative'
        ? 'disturbance'
        : engineState.sessionPhase === 'action_summary'
          ? 'action_summary'
          : engineState.sessionPhase === 'period_summary'
            ? 'period_summary'
            : engineState.sessionPhase === 'passive_progression'
              ? 'passive_continue'
              : engineState.sessionPhase === 'story_event' &&
                  engineState.currentEvent?.isAutomatic === true &&
                  engineState.availableChoices.length === 0
                ? 'story_automatic'
                : null;
    if (!ackKind) return;
    const playerBeforeStage = { ...activeSession.value.player };
    const completedStoryTitle = engineState.currentEvent?.title || '上一阶段';
    const completedDisturbance = engineState.disturbanceNarrative;
    isProcessing.value = true;
    engineState.automaticAdvanceError = null;
    try {
      if (ackKind === 'passive_continue') {
        const periodResult = await requestProgressionAck('passive_continue');
        applyProgressionResponse(periodResult);
        if (periodResult.sessionPhase === 'period_summary' && periodResult.periodSummary) {
          const resultCards = buildPeriodSummaryOverlayCards(
            `period-${periodResult.snapshotId}`,
            periodResult.periodSummary,
          );
          const next = await requestProgressionAck('period_summary');
          applyProgressionResponse(next);
          engineState.progressionOverlay = { cards: resultCards };
        }
      } else {
        let resultCards = ackKind === 'period_summary' && engineState.periodSummary
          ? buildPeriodSummaryOverlayCards(
              `period-${activeSession.value.snapshot.id}`,
              engineState.periodSummary,
            )
          : null;
        const result = await requestProgressionAck(ackKind);
        applyProgressionResponse(result);
        if (ackKind === 'story_automatic') {
          resultCards = result.periodSummary
            ? buildPeriodSummaryOverlayCards(`event-${result.snapshotId}`, result.periodSummary)
            : [buildPlayerDeltaOverlayCard(
                `event-${result.snapshotId}`,
                completedStoryTitle,
                playerBeforeStage,
                result.player,
              )];
        } else if (ackKind === 'disturbance' && completedDisturbance) {
          resultCards = [buildStageResultOverlayCard(
            `disturbance-${completedDisturbance.disturbanceId}`,
            completedDisturbance.title,
            [completedDisturbance.impactSummary],
          )];
        }
        if (resultCards) {
          engineState.progressionOverlay = { cards: resultCards };
        }
      }
      flowState.value = 'ready';
      flowMessage.value = '';
    } catch (error) {
      mapApiError(error);
      if (ackKind === 'action_summary' || ackKind === 'passive_continue' || ackKind === 'period_summary') {
        engineState.automaticAdvanceError = flowMessage.value || '下一阶段载入失败，请重试';
      }
    } finally {
      isProcessing.value = false;
    }
  }

  async function saveCurrentGame(): Promise<boolean> {
    if (!apiClient || !deviceToken.value || !activeSession.value) return false;
    const sessionId = webPlatformStorage.getSessionId();
    const sessionToken = webPlatformStorage.getSessionToken();
    if (!sessionId || !sessionToken) return false;
    try {
      const result = await apiClient.manualSave({
        deviceToken: deviceToken.value,
        sessionId,
        sessionToken,
        expectedSlotVersion: activeSession.value.slot.version,
        expectedSnapshotId: activeSession.value.snapshot.id,
      }) as {
        slot: { version: number; snapshotId: string | null };
        snapshot: { id: string };
      };
      activeSession.value = {
        ...activeSession.value,
        slot: {
          ...activeSession.value.slot,
          version: result.slot.version,
          snapshotId: result.slot.snapshotId,
        },
        snapshot: { id: result.snapshot.id, contentHash: activeSession.value.snapshot.contentHash },
      };
      return true;
    } catch (error) {
      mapApiError(error);
      return false;
    }
  }

  return {
    flowState,
    flowMessage,
    saveSlots,
    deviceToken,
    activeSession,
    engineState,
    isProcessing,
    slotVersion,
    snapshotId,
    bootstrap,
    refreshSaves,
    startNewGameInSlot,
    continueSlot,
    handleChoice,
    handleActiveAction,
    handleProgressionAck,
    saveCurrentGame,
  };
}
