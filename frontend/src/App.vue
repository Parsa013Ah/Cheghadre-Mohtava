<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🤖</span>
          <span class="logo-text">ربات تبلیغاتی</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="nav-active">
          <span class="nav-icon">📊</span>
          <span class="nav-text">داشبورد</span>
        </router-link>
        <router-link to="/accounts" class="nav-item" active-class="nav-active">
          <span class="nav-icon">👤</span>
          <span class="nav-text">اکانت‌ها</span>
          <span v-if="store.accounts.total" class="nav-badge">{{ store.accounts.total }}</span>
        </router-link>
        <router-link to="/groups" class="nav-item" active-class="nav-active">
          <span class="nav-icon">👥</span>
          <span class="nav-text">گروه‌ها</span>
          <span v-if="store.groups.total" class="nav-badge">{{ store.groups.total }}</span>
        </router-link>
        <router-link to="/link-doni" class="nav-item" active-class="nav-active">
          <span class="nav-icon">📥</span>
          <span class="nav-text">لینک‌دونی</span>
        </router-link>
        <router-link to="/settings" class="nav-item" active-class="nav-active">
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">تنظیمات</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="bot-status" :class="{ online: botOnline }">
          <span class="status-dot"></span>
          <span>{{ botOnline ? 'ربات فعال' : 'ربات غیرفعال' }}</span>
        </div>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from './stores/app'

const store = useAppStore()
const botOnline = ref(true)

onMounted(async () => {
  await store.fetchAccounts()
  await store.fetchGroups()
  await store.fetchGroupStats()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-nav {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-active {
  background: rgba(108, 99, 255, 0.1);
  color: var(--accent);
}

.nav-active::before {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
}

.nav-badge {
  margin-right: auto;
  background: var(--accent);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.bot-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
}

.bot-status.online .status-dot {
  background: var(--success);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.main-content {
  flex: 1;
  margin-right: 240px;
  padding: 24px;
}
</style>
