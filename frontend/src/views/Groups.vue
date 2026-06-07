<template>
  <div class="groups-page">
    <div class="page-header">
      <h1>👥 مدیریت گروه‌ها</h1>
      <p class="subtitle">مدیریت گروه‌های استخراج شده و عملیات گروهی</p>
    </div>

    <div class="action-buttons">
      <button class="btn btn-primary" @click="router.push('/link-doni')">
        📥 استخراج از لینک‌دونی
      </button>
      <button class="btn btn-success" @click="showJoinModal = true">
        📋 عضویت در گروه‌ها
      </button>
      <button class="btn btn-danger" @click="showLeaveModal = true">
        🚪 خروج از گروه‌ها
      </button>
      <button class="btn btn-warning" @click="showSendModal = true">
        📤 ارسال پیام
      </button>
    </div>

    <div class="stats-row">
      <div class="stat-chip">
        <span class="stat-label">تعداد گروه‌ها</span>
        <span class="stat-value">{{ store.groups.total }}</span>
      </div>
      <div class="stat-chip">
        <span class="stat-label">عضویت‌های موفق</span>
        <span class="stat-value">{{ store.groupStats.totalJoined }}</span>
      </div>
    </div>

    <div class="groups-list">
      <div v-for="group in store.groups.data" :key="group.id" class="group-card">
        <div class="group-info">
          <div class="group-icon">👥</div>
          <div class="group-details">
            <span class="group-title">{{ group.title || 'بدون عنوان' }}</span>
            <span class="group-link">{{ group.link }}</span>
          </div>
        </div>
        <div class="group-meta">
          <span class="badge badge-info">{{ group.joinedAccountsCount || 0 }} عضویت</span>
          <span v-if="group.sourceChannel" class="source-badge">{{ group.sourceChannel }}</span>
        </div>
      </div>

      <div v-if="store.groups.data.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>هنوز گروهی استخراج نشده است</p>
        <button class="btn btn-primary" @click="router.push('/link-doni')">استخراج لینک</button>
      </div>
    </div>

    <div v-if="store.groups.totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage === 0" @click="changePage(currentPage - 1)">
        ⬅️ قبلی
      </button>
      <button
        v-for="p in store.groups.totalPages"
        :key="p"
        :class="['page-btn', { active: currentPage === p - 1 }]"
        @click="changePage(p - 1)"
      >
        {{ p }}
      </button>
      <button class="page-btn" :disabled="currentPage >= store.groups.totalPages - 1" @click="changePage(currentPage + 1)">
        بعدی ➡️
      </button>
    </div>

    <!-- Join Modal -->
    <div v-if="showJoinModal" class="modal-overlay" @click.self="showJoinModal = false">
      <div class="modal">
        <h2>📋 عضویت در گروه‌ها</h2>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
          نحوه عضویت را انتخاب کنید:
        </p>
        <div class="join-options">
          <button class="btn btn-success btn-lg" style="width: 100%;" @click="joinAll">
            همه اکانت‌ها به همه گروه‌ها
          </button>
          <button class="btn btn-primary btn-lg" style="width: 100%;" @click="distributeJoin">
            تقسیم گروه‌ها بین اکانت‌ها
          </button>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showJoinModal = false">انصراف</button>
        </div>
      </div>
    </div>

    <!-- Leave Modal -->
    <div v-if="showLeaveModal" class="modal-overlay" @click.self="showLeaveModal = false">
      <div class="modal">
        <h2>🚪 خروج از گروه‌ها</h2>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
          نوع خروج را انتخاب کنید:
        </p>
        <div class="join-options">
          <button class="btn btn-danger btn-lg" style="width: 100%;" @click="leaveAll">
            خروج از همه گروه‌ها (همه اکانت‌ها)
          </button>
          <button class="btn btn-warning btn-lg" style="width: 100%;" @click="showLeaveGroupSelect = true">
            خروج از گروه خاص
          </button>
        </div>
        <div v-if="showLeaveGroupSelect" style="margin-top: 16px;">
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">گروه را انتخاب کنید:</p>
          <select v-model="selectedLeaveGroupId" class="input">
            <option value="">-- انتخاب گروه --</option>
            <option v-for="g in store.groups.data" :key="g.id" :value="g.id">
              {{ g.title || g.link }}
            </option>
          </select>
          <button class="btn btn-danger" style="margin-top: 8px; width: 100%;" :disabled="!selectedLeaveGroupId" @click="leaveSpecificGroup">
            خروج از این گروه
          </button>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showLeaveModal = false">بستن</button>
        </div>
      </div>
    </div>

    <!-- Send Message Modal -->
    <div v-if="showSendModal" class="modal-overlay" @click.self="showSendModal = false">
      <div class="modal">
        <h2>📤 ارسال پیام</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 13px; color: var(--text-secondary);">گروه مورد نظر:</label>
            <select v-model="sendGroupId" class="input">
              <option value="">-- انتخاب گروه --</option>
              <option v-for="g in store.groups.data" :key="g.id" :value="g.id">
                {{ g.title || g.link }}
              </option>
            </select>
          </div>
          <div>
            <label style="font-size: 13px; color: var(--text-secondary);">اکانت:</label>
            <select v-model="sendAccountId" class="input">
              <option value="">-- انتخاب اکانت --</option>
              <option v-for="a in store.accounts.data" :key="a.id" :value="a.id">
                {{ a.firstName || a.phone || `اکانت ${a.id}` }}
              </option>
            </select>
          </div>
          <div>
            <label style="font-size: 13px; color: var(--text-secondary);">متن پیام:</label>
            <textarea v-model="sendMessageText" class="input" rows="4" placeholder="متن پیام را وارد کنید..."></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showSendModal = false">انصراف</button>
          <button class="btn btn-warning" :disabled="!sendGroupId || !sendAccountId || !sendMessageText" @click="sendMessage">
            ارسال پیام
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { messageApi } from '../api'

const router = useRouter()
const store = useAppStore()

const currentPage = ref(0)
const showJoinModal = ref(false)
const showLeaveModal = ref(false)
const showLeaveGroupSelect = ref(false)
const showSendModal = ref(false)
const selectedLeaveGroupId = ref<number | null>(null)
const sendGroupId = ref<number | null>(null)
const sendAccountId = ref<number | null>(null)
const sendMessageText = ref('')

onMounted(() => {
  store.fetchGroups(0)
  store.fetchGroupStats()
  store.fetchAccounts(0)
})

function changePage(page: number) {
  currentPage.value = page
  store.fetchGroups(page)
}

function joinAll() {
  showJoinModal.value = false
  alert('عملیات عضویت همه اکانت‌ها در همه گروه‌ها شروع شد.')
}

function distributeJoin() {
  showJoinModal.value = false
  alert('عملیات تقسیم گروه‌ها بین اکانت‌ها شروع شد.')
}

function leaveAll() {
  showLeaveModal.value = false
  alert('عملیات خروج از همه گروه‌ها شروع شد.')
}

async function leaveSpecificGroup() {
  if (!selectedLeaveGroupId.value) return
  showLeaveModal.value = false
  alert('عملیات خروج از گروه شروع شد.')
}

async function sendMessage() {
  if (!sendGroupId.value || !sendAccountId.value || !sendMessageText.value) return
  try {
    await messageApi.send(sendAccountId.value, sendGroupId.value, sendMessageText.value)
    showSendModal.value = false
    sendMessageText.value = ''
    alert('پیام با موفقیت ارسال شد')
  } catch {
    alert('خطا در ارسال پیام')
  }
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
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

.stat-chip {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.group-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-icon {
  font-size: 24px;
}

.group-details {
  display: flex;
  flex-direction: column;
}

.group-title {
  font-weight: 500;
  font-size: 14px;
}

.group-link {
  font-size: 12px;
  color: var(--text-secondary);
  direction: ltr;
  text-align: left;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-badge {
  background: rgba(108, 99, 255, 0.1);
  color: var(--accent);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin-bottom: 16px;
}

.join-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
