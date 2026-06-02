import { computed, reactive, ref } from 'vue';
import {
  createWebApiClient,
  WebApiClientError,
  type SaveSlotDto,
  type SessionStartResponse,
} from '../adapters/api/webApiClient';
import { webPlatformStorage } from '../adapters/platform/webPlatformStorage';

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

export function useApiGameEngine() {
  const flowState = ref<ApiFlowState>('idle');
  const flowMessage = ref('');
  const saveSlots = ref<SaveSlotDto[]>([]);
  const deviceToken = ref<string | null>(null);
  const activeSession = ref<SessionStartResponse | null>(null);
  const isProcessing = ref(false);

  const engineState = reactive({
    currentEvent: null as SessionStartResponse['nextEvent'],
    availableChoices: [] as Array<{ id: string; text: string }>,
    lastChoiceFeedback: null as string | null,
    lastOutcomeText: null as string | null,
  });

  const slotVersion = computed(() => activeSession.value?.slot.version ?? 0);
  const snapshotId = computed(() => activeSession.value?.snapshot.id ?? '');

  function applySessionResponse(response: SessionStartResponse): void {
    activeSession.value = response;
    engineState.currentEvent = response.nextEvent;
    engineState.availableChoices =
      response.nextEvent?.choices?.filter(choice => choice.available) ?? [];
    engineState.lastChoiceFeedback = null;
    engineState.lastOutcomeText = null;
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
      }) as {
        slotVersion: number;
        snapshotId: string;
        nextEvent: SessionStartResponse['nextEvent'];
        feedback?: { summary?: string };
      };
      activeSession.value = {
        ...activeSession.value,
        slot: {
          ...activeSession.value.slot,
          version: result.slotVersion,
          snapshotId: result.snapshotId,
        },
        snapshot: { ...activeSession.value.snapshot, id: result.snapshotId },
        nextEvent: result.nextEvent,
      };
      engineState.currentEvent = result.nextEvent;
      engineState.availableChoices =
        result.nextEvent?.choices?.filter(c => c.available) ?? [];
      engineState.lastChoiceFeedback = result.feedback?.summary ?? null;
    } catch (error) {
      mapApiError(error);
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
    saveCurrentGame,
  };
}
