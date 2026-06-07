<template>
  <div class="accounts-page">
    <div class="page-header">
      <div>
        <h1>👤 مدیریت اکانت‌ها</h1>
        <p class="subtitle">مدیریت اکانت‌های تلگرام - {{ store.accounts.total }} اکانت</p>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">
        ➕ افزودن اکانت
      </button>
    </div>

    <div class="accounts-grid">
      <div v-for="account in store.accounts.data" :key="account.id" class="account-card" @click="goToAccount(account.id)">
        <div class="account-avatar">
          <div v-if="account.profilePhoto" class="avatar-img" :style="{ backgroundImage: `url(${account.profilePhoto})` }"></div>
          <div v-else class="avatar-placeholder">{{ getInitial(account) }}</div>
        </div>
        <div class="account-info">
          <span class="account-name">{{ account.firstName || 'بدون نام' }} {{ account.lastName || '' }}</span>
          <span class="account-phone">{{ account.phone || 'شماره ثبت نشده' }}</span>
        </div>
        <span :class="['badge', statusClass(account.status)]">{{ statusText(account.status) }}</span>
        <span class="account-arrow">←</span>
      </div>

      <div v-if="store.accounts.data.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>هنوز اکانتی اضافه نشده است</p>
        <button class="btn btn-primary" @click="showAddModal = true">➕ افزودن اکانت</button>
      </div>
    </div>

    <div v-if="store.accounts.totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage === 0" @click="changePage(currentPage - 1)">
        ⬅️ قبلی
      </button>
      <button
        v-for="p in store.accounts.totalPages"
        :key="p"
        :class="['page-btn', { active: currentPage === p - 1 }]"
        @click="changePage(p - 1)"
      >
        {{ p }}
      </button>
      <button class="page-btn" :disabled="currentPage >= store.accounts.totalPages - 1" @click="changePage(currentPage + 1)">
        بعدی ➡️
      </button>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h2>📱 افزودن اکانت جدید</h2>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
          شماره تلفن را با کد کشور وارد کنید
        </p>
        <input
          v-model="newPhone"
          class="input"
          placeholder="مثال: +989123456789"
          dir="ltr"
          style="text-align: left;"
        />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAddModal = false">انصراف</button>
          <button class="btn btn-primary" @click="addAccount" :disabled="!newPhone">
            ارسال کد
          </button>
        </div>
      </div>
    </div>

    <div v-if="showVerifyModal" class="modal-overlay" @click.self="showVerifyModal = false">
      <div class="modal">
        <h2>🔑 تایید کد</h2>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
          کد ارسال شده به {{ pendingPhone }} را وارد کنید
        </p>
        <input
          v-model="verifyCode"
          class="input"
          placeholder="کد تایید"
          dir="ltr"
          style="text-align: left;"
        />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showVerifyModal = false">انصراف</button>
          <button class="btn btn-primary" @click="submitCode" :disabled="!verifyCode">
            تایید
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
import { accountApi } from '../api'

const router = useRouter()
const store = useAppStore()

const currentPage = ref(0)
const showAddModal = ref(false)
const showVerifyModal = ref(false)
const newPhone = ref('')
const pendingPhone = ref('')
const pendingAccountId = ref<number | null>(null)
const verifyCode = ref('')

onMounted(() => {
  store.fetchAccounts(0)
})

function changePage(page: number) {
  currentPage.value = page
  store.fetchAccounts(page)
}

function goToAccount(id: number) {
  router.push(`/accounts/${id}`)
}

function getInitial(account: any) {
  if (account.firstName) return account.firstName[0]
  if (account.phone) return account.phone.slice(-2)
  return '?'
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    active: 'badge-success',
    disconnected: 'badge-danger',
    banned: 'badge-danger',
    waiting_code: 'badge-warning',
    waiting_2fa: 'badge-warning',
  }
  return map[status] || 'badge-warning'
}

function statusText(status: string) {
  const map: Record<string, string> = {
    active: '✅ فعال',
    disconnected: '❌ قطع اتصال',
    banned: '🚫 بن شده',
    waiting_code: '📱 منتظر کد',
    waiting_2fa: '🔑 منتظر رمز',
  }
  return map[status] || status
}

async function addAccount() {
  if (!newPhone.value) return
  try {
    const res = await accountApi.sendCode(newPhone.value)
    pendingAccountId.value = res.data.account.id
    pendingPhone.value = newPhone.value
    showAddModal.value = false
    showVerifyModal.value = true
  } catch (error: any) {
    alert(error.response?.data?.message || 'خطا در ارسال کد')
  }
}

async function submitCode() {
  if (!pendingAccountId.value || !verifyCode.value) return
  try {
    await accountApi.verifyCode(pendingAccountId.value, verifyCode.value)
    showVerifyModal.value = false
    verifyCode.value = ''
    newPhone.value = ''
    await store.fetchAccounts(currentPage.value)
  } catch (error: any) {
    if (error.response?.data?.message?.includes('2FA')) {
      alert('اکانت دارای رمز دو مرحله‌ای است. لطفا از طریق پنل اکانت رمز را وارد کنید.')
    } else {
      alert(error.response?.data?.message || 'خطا در تایید کد')
    }
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

.accounts-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.account-card:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
  transform: translateX(-4px);
}

.account-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent), #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.account-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.account-name {
  font-weight: 500;
  font-size: 15px;
}

.account-phone {
  font-size: 13px;
  color: var(--text-secondary);
}

.account-arrow {
  color: var(--text-secondary);
  font-size: 18px;
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
</style>
