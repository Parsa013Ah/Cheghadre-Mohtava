<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>⚙️ تنظیمات</h1>
      <p class="subtitle">تنظیمات ربات و API</p>
    </div>

    <div class="settings-grid">
      <div class="card">
        <h3>🤖 تنظیمات ربات</h3>
        <div class="form-group">
          <label>توکن ربات</label>
          <div class="input-group">
            <input v-model="botToken" class="input" type="password" placeholder="توکن ربات تلگرام" />
            <button class="btn btn-primary btn-sm" @click="saveBotToken">ذخیره</button>
          </div>
        </div>
        <div class="bot-status-display">
          <span class="status-label">وضعیت ربات:</span>
          <span class="badge badge-success">🟢 فعال</span>
        </div>
      </div>

      <div class="card">
        <h3>🔑 تنظیمات API</h3>
        <div class="form-group">
          <label>API ID</label>
          <input v-model="apiId" class="input" type="password" placeholder="MTProto API ID" />
        </div>
        <div class="form-group">
          <label>API Hash</label>
          <input v-model="apiHash" class="input" type="password" placeholder="MTProto API Hash" />
        </div>
        <button class="btn btn-primary" @click="saveApiSettings">ذخیره تنظیمات API</button>
      </div>
    </div>

    <div class="card info-card">
      <h3>📊 اطلاعات سیستم</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">نسخه</span>
          <span class="info-value">1.0.0</span>
        </div>
        <div class="info-item">
          <span class="info-label">API Base URL</span>
          <span class="info-value" dir="ltr">http://localhost:3000/api</span>
        </div>
        <div class="info-item">
          <span class="info-label">تعداد اکانت‌ها</span>
          <span class="info-value">{{ store.accounts.total }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">تعداد گروه‌ها</span>
          <span class="info-value">{{ store.groups.total }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const botToken = ref(localStorage.getItem('BOT_TOKEN') || '')
const apiId = ref(localStorage.getItem('API_ID') || '')
const apiHash = ref(localStorage.getItem('API_HASH') || '')

function saveBotToken() {
  if (!botToken.value) return
  localStorage.setItem('BOT_TOKEN', botToken.value)
  alert('توکن ربات ذخیره شد. برای اعمال تغییرات سرور را ریستارت کنید.')
}

function saveApiSettings() {
  if (!apiId.value || !apiHash.value) return
  localStorage.setItem('API_ID', apiId.value)
  localStorage.setItem('API_HASH', apiHash.value)
  alert('تنظیمات API ذخیره شد. برای اعمال تغییرات سرور را ریستارت کنید.')
}
</script>

<style scoped>
.page-header h1 {
  font-size: 24px;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.card h3 {
  font-size: 18px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.bot-status-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.status-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-card {
  margin-top: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
