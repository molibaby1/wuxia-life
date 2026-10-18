<template>
  <div class="start-screen">
    <div class="content">
      <h1 class="title">武侠人生</h1>
      <p class="subtitle">选择存档槽位（共 3 个）</p>

      <p v-if="statusMessage" class="status" :class="statusClass" role="alert">{{ statusMessage }}</p>

      <div v-if="flowState === 'loading'" class="card">加载中…</div>

      <template v-else-if="flowState === 'ready'">
        <div class="slots">
          <div v-for="slot in slots" :key="slot.slotIndex" class="slot-card">
            <div class="slot-head">
              <span>槽位 {{ slot.slotIndex }}</span>
              <span class="badge">{{ slot.occupied ? '有存档' : '空' }}</span>
            </div>
            <p v-if="slot.occupied" class="slot-meta">
              {{ slot.label }} · {{ slot.age ?? '?' }} 岁
              <span v-if="slot.terminal">（已终结）</span>
            </p>
            <p v-else class="slot-meta">暂无存档</p>
            <p v-if="slot.progressionCheckpointState === 'legacy_unknown'" class="checkpoint-warning" role="status">
              此旧存档的待确认结果无法恢复。默认保留存档；若继续，旧结果展示将无法找回，已保存事实不会撤销或重算。
            </p>
            <p v-else-if="slot.progressionCheckpointState === 'invalid'" class="checkpoint-error" role="alert">
              存档进度检查点缺损，已阻止继续。不能通过放弃旧结果解锁此存档。
            </p>
            <div class="slot-actions">
              <button
                v-if="slot.occupied"
                class="btn btn-secondary"
                :disabled="busy || slot.progressionCheckpointState === 'invalid'"
                @click="slot.progressionCheckpointState === 'legacy_unknown' ? (legacyConfirmationSlot = slot.slotIndex) : $emit('continue-slot', slot.slotIndex)"
              >
                {{ slot.progressionCheckpointState === 'legacy_unknown' ? '查看旧档选择' : '继续' }}
              </button>
              <button
                class="btn btn-primary"
                :disabled="busy || !props.playerName"
                @click="$emit('new-game-slot', slot.slotIndex)"
              >
                {{ slot.occupied ? '新人生（覆盖）' : '新人生' }}
              </button>
            </div>
          </div>
        </div>

        <section v-if="legacyConfirmationSlot !== null" class="legacy-confirmation" role="dialog" aria-modal="true" aria-labelledby="legacy-confirmation-title">
          <h2 id="legacy-confirmation-title">旧存档的待确认结果无法恢复</h2>
          <p>继续后，这些旧结果展示将无法找回；已保存的人生事实不会撤销，也不会重新结算。</p>
          <div class="slot-actions">
            <button class="btn btn-primary" :disabled="busy" @click="legacyConfirmationSlot = null">
              保留旧存档、暂不继续
            </button>
            <button class="btn btn-secondary" :disabled="busy" @click="$emit('discard-legacy-slot', legacyConfirmationSlot); legacyConfirmationSlot = null">
              确认放弃无法恢复的旧结果，从已保存事实继续
            </button>
          </div>
        </section>

        <div class="card player-form">
          <div class="form-group">
            <label>你的名字</label>
            <input :value="playerName" type="text" class="input" maxlength="10" placeholder="请输入名字" @input="onNameInput" />
          </div>
          <div class="form-group">
            <label>选择性别</label>
            <div class="gender-select">
              <button :class="['gender-btn', { active: gender === 'male' }]" @click="$emit('update:gender', 'male')">男</button>
              <button :class="['gender-btn', { active: gender === 'female' }]" @click="$emit('update:gender', 'female')">女</button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="card">
        <button class="btn btn-primary" @click="$emit('retry')">重试</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ApiFlowState } from '../composables/useApiGameEngine';
import type { SaveSlotDto } from '../adapters/api/webApiClient';

const props = defineProps<{
  slots: SaveSlotDto[];
  flowState: ApiFlowState;
  flowMessage: string;
  busy: boolean;
  playerName: string;
  gender: 'male' | 'female';
}>();

const emit = defineEmits<{
  'continue-slot': [slotIndex: number];
  'discard-legacy-slot': [slotIndex: number];
  'new-game-slot': [slotIndex: number];
  retry: [];
  'update:playerName': [value: string];
  'update:gender': [value: 'male' | 'female'];
}>();

const legacyConfirmationSlot = ref<number | null>(null);

function onNameInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('update:playerName', target.value);
}

const statusMessage = computed(() => {
  if (props.flowMessage) return props.flowMessage;
  if (props.flowState === 'loading') return '正在连接服务器…';
  if (props.flowState === 'configuration_error') return '未配置正式游戏 API 地址';
  if (props.flowState === 'auth_error') return '设备身份验证失败';
  if (props.flowState === 'server_unavailable') return '服务器不可用';
  if (props.flowState === 'compatibility_error') return '存档版本不兼容';
  if (props.flowState === 'stale_conflict') return '存档冲突，请刷新后重试';
  return '';
});

const statusClass = computed(() => {
  if (props.flowState === 'ready') return '';
  return 'status-error';
});

</script>

<style scoped>
.start-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.slots {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}
.slot-card {
  background: white;
  border: 1px solid rgba(139, 69, 19, 0.2);
  border-radius: 8px;
  padding: 12px;
}
.slot-head {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}
.badge {
  font-size: 12px;
  color: #8b6914;
}
.slot-meta {
  margin: 8px 0;
  color: #555;
  font-size: 14px;
}
.checkpoint-warning,
.checkpoint-error {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.5;
}
.checkpoint-warning { color: #75510a; }
.checkpoint-error { color: #a33; }
.legacy-confirmation {
  position: fixed;
  z-index: 10;
  inset: 50% auto auto 50%;
  width: min(92vw, 520px);
  transform: translate(-50%, -50%);
  padding: 20px;
  background: white;
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.legacy-confirmation .slot-actions { flex-wrap: wrap; }
.slot-actions {
  display: flex;
  gap: 8px;
}
.status {
  text-align: center;
  margin-bottom: 12px;
}
.status-error {
  color: #a33;
}
.player-form {
  margin-top: 8px;
}
</style>
