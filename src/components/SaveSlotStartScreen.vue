<template>
  <div class="start-screen">
    <div class="content">
      <h1 class="title">武侠人生</h1>
      <p class="subtitle">选择存档槽位（共 3 个）</p>

      <p v-if="statusMessage" class="status" :class="statusClass">{{ statusMessage }}</p>

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
            <div class="slot-actions">
              <button
                v-if="slot.occupied"
                class="btn btn-secondary"
                :disabled="busy"
                @click="$emit('continue-slot', slot.slotIndex)"
              >
                继续
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
        <p>{{ statusMessage }}</p>
        <button class="btn btn-primary" @click="$emit('retry')">重试</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  'new-game-slot': [slotIndex: number];
  retry: [];
  'update:playerName': [value: string];
  'update:gender': [value: 'male' | 'female'];
}>();

function onNameInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('update:playerName', target.value);
}

const statusMessage = computed(() => {
  if (props.flowMessage) return props.flowMessage;
  if (props.flowState === 'loading') return '正在连接服务器…';
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
