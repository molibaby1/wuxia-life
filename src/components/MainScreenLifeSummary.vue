<template>
  <section class="life-summary-card card" aria-label="人生摘要">
    <header class="summary-header">
      <h3>人生摘要</h3>
    </header>

    <div class="summary-rows">
      <div class="summary-row">
        <span class="summary-label">路线</span>
        <span class="summary-value">{{ routeSummary }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">风险</span>
        <span class="summary-value summary-risk">{{ riskSummary }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">倾向</span>
        <span class="summary-value">{{ tendencySummary }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">塑形</span>
        <span class="summary-value">{{ shapingSummary }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  routeSummary: string;
  riskSummary: string;
  tendencySummary: string;
  shapingSummary: string;
}>();
</script>

<style scoped>
.life-summary-card {
  padding: 16px;
  border-radius: 20px;
  background: #fffaf1;
  border: 1px solid rgba(139, 105, 20, 0.12);
}

.summary-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--primary-color);
}

.summary-rows {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.summary-row {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  align-items: start;
}

.summary-label {
  font-size: 13px;
  font-weight: 700;
  color: #8b6914;
}

.summary-value {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-color);
}

.summary-risk {
  color: #8a5a13;
}
</style>
