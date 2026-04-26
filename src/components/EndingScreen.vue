<template>
  <div class="ending-screen">
    <div class="content">
      <div class="poster card">
        <div class="poster-header">
          <h2 class="title">{{ player?.title }}</h2>
        </div>
        
        <div class="poster-content">
          <p class="name">{{ player?.name }}</p>
          <p class="age">享年 {{ player?.age }} 岁</p>
          <p v-if="player?.sect" class="sect">{{ player.sect }}弟子</p>
        </div>
        
        <div class="death-reason">
          <p>{{ player?.deathReason }}</p>
        </div>
        
        <div class="final-stats">
          <h3>人生回顾</h3>
          <div class="stats-grid">
            <div class="stat">
              <span class="label">功力</span>
              <span class="value">{{ player?.martialPower }}</span>
            </div>
            <div class="stat">
              <span class="label">外功</span>
              <span class="value">{{ player?.externalSkill }}</span>
            </div>
            <div class="stat">
              <span class="label">内功</span>
              <span class="value">{{ player?.internalSkill }}</span>
            </div>
            <div class="stat">
              <span class="label">轻功</span>
              <span class="value">{{ player?.qinggong }}</span>
            </div>
            <div class="stat">
              <span class="label">侠义值</span>
              <span class="value">{{ player?.chivalry }}</span>
            </div>
            <div class="stat">
              <span class="label">银两</span>
              <span class="value">{{ player?.money }}</span>
            </div>
          </div>
        </div>
        
        <div class="epitaph">
          <p>「 {{ player?.title }} 」</p>
        </div>
      </div>
      
      <div class="actions">
        <button class="btn btn-primary" @click="share">
          分享给朋友
        </button>
        <button class="btn" @click="restart">
          再来一局
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['restart']);
const props = defineProps<{
  player: {
    name?: string;
    title?: string;
    age?: number;
    sect?: string;
    deathReason?: string;
    martialPower?: number;
    externalSkill?: number;
    internalSkill?: number;
    qinggong?: number;
    chivalry?: number;
    money?: number;
  } | null;
}>();
const player = props.player;

const share = () => {
  const shareText = `${player?.name}的武侠人生：${player?.deathReason}，获得称号「${player?.title}」！快来试试你的武侠人生吧！`;
  
  if (navigator.share) {
    navigator.share({
      title: '武侠人生',
      text: shareText,
    }).catch(console.error);
  } else {
    navigator.clipboard.writeText(shareText).then(() => {
      alert('已复制到剪贴板，快分享给朋友吧！');
    }).catch(() => {
      alert(shareText);
    });
  }
};

const restart = () => {
  emit('restart');
};
</script>

<style scoped>
.ending-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.content {
  width: 100%;
}

.poster {
  margin-bottom: 24px;
  text-align: center;
}

.poster-header {
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.poster-header .title {
  font-size: 24px;
  margin: 0;
}

.poster-content .name {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.poster-content .age {
  font-size: 18px;
  color: #8b6914;
  margin-bottom: 4px;
}

.poster-content .sect {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.death-reason {
  background: rgba(139, 69, 19, 0.1);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.death-reason p {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-color);
}

.final-stats {
  margin-bottom: 20px;
}

.final-stats h3 {
  font-size: 18px;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat {
  background: rgba(218, 165, 32, 0.1);
  padding: 12px;
  border-radius: 8px;
}

.stat .label {
  display: block;
  font-size: 12px;
  color: #8b6914;
  margin-bottom: 4px;
}

.stat .value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
}

.epitaph {
  font-style: italic;
  color: var(--secondary-color);
  font-size: 18px;
  padding: 12px;
  border-top: 1px dashed rgba(139, 69, 19, 0.3);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
