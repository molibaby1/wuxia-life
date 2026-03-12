<template>
  <div class="start-screen">
    <div class="content">
      <h1 class="title">武侠人生</h1>
      <p class="subtitle">从呱呱坠地到武林泰斗</p>
      
      <div class="card">
        <div class="form-group">
          <label>你的名字</label>
          <input 
            v-model="name" 
            type="text" 
            class="input" 
            placeholder="请输入名字"
            maxlength="10"
          />
        </div>
        
        <div class="form-group">
          <label>选择性别</label>
          <div class="gender-select">
            <button 
              :class="['gender-btn', { active: gender === 'male' }]"
              @click="gender = 'male'"
            >
              男
            </button>
            <button 
              :class="['gender-btn', { active: gender === 'female' }]"
              @click="gender = 'female'"
            >
              女
            </button>
          </div>
        </div>
        
        <button 
          class="btn btn-primary"
          :disabled="!name"
          @click="startGame"
        >
          开始人生
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['start']);

const name = ref('');
const gender = ref<'male' | 'female'>('male');

const startGame = () => {
  if (name.value.trim()) {
    emit('start', name.value.trim(), gender.value);
  }
};
</script>

<style scoped>
.start-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.content {
  width: 100%;
}

.subtitle {
  text-align: center;
  color: #8b6914;
  margin-bottom: 32px;
  font-size: 16px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--primary-color);
}

.gender-select {
  display: flex;
  gap: 12px;
}

.gender-btn {
  flex: 1;
  padding: 14px;
  border: 2px solid rgba(139, 69, 19, 0.3);
  background: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.2s;
}

.gender-btn:hover {
  border-color: var(--primary-color);
}

.gender-btn.active {
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--secondary-color) 100%);
  color: white;
  border-color: var(--secondary-color);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}
</style>
