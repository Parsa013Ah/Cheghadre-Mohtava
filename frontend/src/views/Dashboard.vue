<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>📊 داشبورد</h1>
      <p class="subtitle">خلاصه وضعیت ربات تبلیغاتی</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon accounts-icon">👤</div>
        <div class="stat-info">
          <span class="stat-value">{{ store.accounts.total }}</span>
          <span class="stat-label">اکانت‌ها</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon groups-icon">👥</div>
        <div class="stat-info">
          <span class="stat-value">{{ store.groupStats.totalGroups }}</span>
          <span class="stat-label">گروه‌ها</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon join-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ store.groupStats.totalJoined }}</span>
          <span class="stat-label">عضویت‌ها</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon source-icon">📥</div>
        <div class="stat-info">
          <span class="stat-value">{{ store.linkDoniChannels.length }}</span>
          <span class="stat-label">منابع لینک</span>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2>عملیات سریع</h2>
      <div class="actions-grid">
        <router-link to="/accounts" class="action-card">
          <span class="action-icon">➕</span>
          <span class="action-title">افزودن اکانت</span>
          <span class="action-desc">اضافه کردن اکانت تلگرام جدید</span>
        </router-link>
        <router-link to="/link-doni" class="action-card">
          <span class="action-icon">📥</span>
          <span class="action-title">استخراج لینک</span>
          <span class="action-desc">استخراج لینک گروه از چنل‌های لینک‌دونی</span>
        </router-link>
        <router-link to="/groups" class="action-card">
          <span class="action-icon">📋</span>
          <span class="action-title">عضویت در گروه‌ها</span>
          <span class="action-desc">عضویت اکانت‌ها در گروه‌های استخراج شده</span>
        </router-link>
        <router-link to="/groups" class="action-card">
          <span class="action-icon">📤</span>
          <span class="action-title">ارسال پیام</span>
          <span class="action-desc">ارسال پیام به گروه‌ها</span>
        </router-link>
      </div>
    </div>

    <div class="recent-section">
      <h2>آخرین فعالیت‌ها</h2>
      <div class="card">
        <div v-if="store.jobs.data.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>هنوز فعالیتی ثبت نشده است</p>
        </div>
        <div v-else class="activity-list">
          <div v-for="job in store.jobs.data.slice(0, 5)" :key="job.id" class="activity-item">
            <div class="activity-icon">
              <span v-if="job.type === 'join'">📋</span>
              <span v-else-if="job.type === 'leave'">🚪</span>
              <span v-else-if="job.type === 'send_message'">📤</span>
              <span v-else>📥</span>
            </div>
            <div class="activity-info">
              <span class="activity-type">{{ jobTypeText(job.type) }}</span>
              <span class="activity-date">{{ formatDate(job.createdAt) }}</span>
            </div>
            <span :class="['badge', job.status === 'completed' ? 'badge-success' : job.status === 'failed' ? 'badge-danger' : 'badge-warning']">
              {{ jobStatusText(job.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

onMounted(async () => {
  await store.fetchLinkDoniChannels()
  await store.fetchJobs()
})

function jobTypeText(type: string) {
  const map: Record<string, string> = {
    join: 'عضویت در گروه',
    leave: 'خروج از گروه',
    send_message: 'ارسال پیام',
    extract_links: 'استخراج لینک',
  }
  return map[type] || type
}

function jobStatusText(status: string) {
  const map: Record<string, string> = {
    pending: 'در انتظار',
    running: 'در حال اجرا',
    completed: 'تکمیل شده',
    failed: 'ناموفق',
  }
  return map[status] || status
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  })
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.accounts-icon { background: rgba(108, 99, 255, 0.15); }
.groups-icon { background: rgba(76, 175, 80, 0.15); }
.join-icon { background: rgba(33, 150, 243, 0.15); }
.source-icon { background: rgba(255, 152, 0, 0.15); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.quick-actions {
  margin-top: 32px;
}

.quick-actions h2, .recent-section h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.2);
}

.action-icon {
  font-size: 32px;
}

.action-title {
  font-size: 14px;
  font-weight: 700;
}

.action-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.recent-section {
  margin-top: 32px;
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

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 20px;
}

.activity-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.activity-type {
  font-weight: 500;
  font-size: 14px;
}

.activity-date {
  font-size: 12px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .stats-grid, .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
