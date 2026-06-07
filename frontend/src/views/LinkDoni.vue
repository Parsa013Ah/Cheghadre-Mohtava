<template>
  <div class="link-doni-page">
    <div class="page-header">
      <div>
        <h1>📥 استخراج لینک از لینک‌دونی</h1>
        <p class="subtitle">استخراج لینک گروه‌ها از چنل‌های لینک‌دونی</p>
      </div>
    </div>

    <div class="extract-card card">
      <h3>استخراج لینک جدید</h3>
      <div class="extract-form">
        <div class="form-group">
          <label>اکانت:</label>
          <select v-model="selectedAccountId" class="input">
            <option value="">-- انتخاب اکانت --</option>
            <option v-for="a in store.accounts.data" :key="a.id" :value="a.id">
              {{ a.firstName || a.phone || `اکانت ${a.id}` }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>لینک چنل لینک‌دونی:</label>
          <input v-model="channelLink" class="input" placeholder="https://t.me/..." dir="ltr" />
        </div>
        <div class="form-group">
          <label>تعداد گروه مورد نیاز:</label>
          <input v-model.number="groupCount" class="input" type="number" placeholder="مثال: 50" min="1" />
        </div>
        <button
          class="btn btn-primary btn-lg"
          :disabled="!selectedAccountId || !channelLink || !groupCount || extracting"
          @click="extractLinks"
        >
          {{ extracting ? 'در حال استخراج...' : '🔍 شروع استخراج' }}
        </button>
      </div>
      <div v-if="extractResult" class="extract-result">
        <span class="badge badge-success">✅ {{ extractResult }} لینک جدید استخراج شد</span>
      </div>
    </div>

    <div class="history-section">
      <h3>تاریخچه لینک‌دونی‌ها</h3>
      <div class="channels-list">
        <div v-for="channel in store.linkDoniChannels" :key="channel.id" class="channel-card">
          <div class="channel-info">
            <span class="channel-icon">📢</span>
            <div class="channel-details">
              <span class="channel-title">{{ channel.title || channel.link }}</span>
              <span class="channel-link">{{ channel.link }}</span>
            </div>
          </div>
          <div class="channel-stats">
            <span class="badge badge-info">{{ channel.totalExtracted }} لینک</span>
          </div>
        </div>
      </div>
      <div v-if="store.linkDoniChannels.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>هنوز استخراجی انجام نشده است</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { linkDoniApi } from '../api'

const store = useAppStore()

const selectedAccountId = ref<number | null>(null)
const channelLink = ref('')
const groupCount = ref<number | null>(null)
const extracting = ref(false)
const extractResult = ref<number | null>(null)

onMounted(async () => {
  await store.fetchAccounts(0)
  await store.fetchLinkDoniChannels()
})

async function extractLinks() {
  if (!selectedAccountId.value || !channelLink.value || !groupCount.value) return
  extracting.value = true
  extractResult.value = null
  try {
    const res = await linkDoniApi.extract(selectedAccountId.value, channelLink.value, groupCount.value)
    extractResult.value = res.data.length
    channelLink.value = ''
    groupCount.value = null
    await Promise.all([
      store.fetchGroups(0),
      store.fetchLinkDoniChannels(),
      store.fetchGroupStats(),
    ])
  } catch (error: any) {
    alert(error.response?.data?.message || 'خطا در استخراج لینک')
  } finally {
    extracting.value = false
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.extract-card h3 {
  font-size: 18px;
  margin-bottom: 20px;
}

.extract-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  color: var(--text-secondary);
}

.extract-result {
  margin-top: 16px;
}

.history-section {
  margin-top: 32px;
}

.history-section h3 {
  font-size: 18px;
  margin-bottom: 16px;
}

.channels-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-icon {
  font-size: 20px;
}

.channel-details {
  display: flex;
  flex-direction: column;
}

.channel-title {
  font-weight: 500;
  font-size: 14px;
}

.channel-link {
  font-size: 12px;
  color: var(--text-secondary);
  direction: ltr;
  text-align: left;
}

.channel-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}
</style>
