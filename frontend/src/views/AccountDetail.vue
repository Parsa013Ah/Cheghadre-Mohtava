<template>
  <div class="account-detail">
    <div class="page-header">
      <button class="btn btn-ghost" @click="router.push('/accounts')">
        ← بازگشت به لیست
      </button>
    </div>

    <div v-if="loading" class="loading-state">در حال بارگذاری...</div>

    <div v-else-if="account" class="detail-content">
      <div class="profile-section card">
        <div class="profile-avatar">
          <div v-if="account.profilePhoto" class="avatar-img" :style="{ backgroundImage: `url(${account.profilePhoto})` }"></div>
          <div v-else class="avatar-placeholder">{{ getInitial(account) }}</div>
        </div>
        <div class="profile-info">
          <h2>{{ account.firstName || 'بدون نام' }} {{ account.lastName || '' }}</h2>
          <p class="profile-phone">{{ account.phone || 'شماره ثبت نشده' }}</p>
          <p class="profile-bio">{{ account.bio || 'بدون بیو' }}</p>
          <span :class="['badge', statusClass(account.status)]">{{ statusText(account.status) }}</span>
        </div>
      </div>

      <div class="actions-section">
        <h3>تنظیمات اکانت</h3>
        <div class="actions-grid">
          <div class="action-card">
            <span class="action-icon">✏️</span>
            <span class="action-title">تغییر نام</span>
            <div class="input-group">
              <input v-model="editFirstName" class="input" placeholder="نام جدید" />
              <button class="btn btn-primary btn-sm" @click="updateName">ذخیره</button>
            </div>
          </div>

          <div class="action-card">
            <span class="action-icon">📝</span>
            <span class="action-title">تغییر بیو</span>
            <div class="input-group">
              <textarea v-model="editBio" class="input" placeholder="بیو جدید" rows="2"></textarea>
              <button class="btn btn-primary btn-sm" @click="updateBio">ذخیره</button>
            </div>
          </div>

          <div class="action-card danger-zone">
            <span class="action-icon">🔴</span>
            <span class="action-title">قطع اتصال</span>
            <p class="action-desc">اکانت از ربات خارج می‌شود</p>
            <button class="btn btn-danger btn-sm" @click="disconnect">قطع اتصال</button>
          </div>

          <div class="action-card danger-zone">
            <span class="action-icon">🗑️</span>
            <span class="action-title">حذف اکانت</span>
            <p class="action-desc">اکانت به طور کامل حذف می‌شود</p>
            <button class="btn btn-danger btn-sm" @click="removeAccount">حذف</button>
          </div>
          <div class="action-card danger-zone">
            <span class="action-icon">🗑️</span>
            <span class="action-title">پاک کردن پیوی‌ها</span>
            <p class="action-desc">تمام چت‌های خصوصی اکانت پاک می‌شود</p>
            <button class="btn btn-danger btn-sm" :disabled="deletingPv" @click="deletePrivateChats">
              {{ deletingPv ? 'در حال حذف...' : 'پاک کردن پیوی‌ها' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="account.status === 'waiting_2fa'" class="card" style="margin-top: 16px;">
        <h3>🔑 ورود رمز دو مرحله‌ای</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin: 8px 0;">
          این اکانت دارای رمز دو مرحله‌ای است. لطفا رمز را وارد کنید.
        </p>
        <div class="input-group" style="max-width: 300px;">
          <input v-model="twoFAPassword" class="input" type="password" placeholder="رمز دو مرحله‌ای" />
          <button class="btn btn-primary btn-sm" @click="submit2FA">تایید</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { accountApi } from '../api'
import { useAppStore } from '../stores/app'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const account = ref<any>(null)
const loading = ref(true)
const editFirstName = ref('')
const editBio = ref('')
const twoFAPassword = ref('')
const deletingPv = ref(false)

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const res = await accountApi.getOne(id)
    account.value = res.data
    editFirstName.value = account.value.firstName || ''
    editBio.value = account.value.bio || ''
  } catch {
    alert('خطا در دریافت اطلاعات اکانت')
    router.push('/accounts')
  } finally {
    loading.value = false
  }
})

function getInitial(acc: any) {
  if (acc.firstName) return acc.firstName[0]
  if (acc.phone) return acc.phone.slice(-2)
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

async function updateName() {
  if (!editFirstName.value) return
  try {
    await accountApi.updateProfile(account.value.id, { firstName: editFirstName.value })
    account.value.firstName = editFirstName.value
    alert('نام با موفقیت تغییر کرد')
  } catch {
    alert('خطا در تغییر نام')
  }
}

async function updateBio() {
  try {
    await accountApi.updateProfile(account.value.id, { bio: editBio.value })
    account.value.bio = editBio.value
    alert('بیو با موفقیت تغییر کرد')
  } catch {
    alert('خطا در تغییر بیو')
  }
}

async function disconnect() {
  if (!confirm('آیا از قطع اتصال اکانت اطمینان دارید؟')) return
  try {
    await accountApi.disconnect(account.value.id)
    account.value.status = 'disconnected'
    alert('اکانت با موفقیت قطع اتصال شد')
  } catch {
    alert('خطا در قطع اتصال')
  }
}

async function deletePrivateChats() {
  if (!confirm('آیا از پاک کردن تمام پیوی‌های این اکانت اطمینان دارید؟ این عمل قابل بازگشت نیست.')) return
  deletingPv.value = true
  try {
    const res = await accountApi.deletePrivateChats(account.value.id)
    alert(`${res.data.count} پیوی با موفقیت پاک شد`)
  } catch {
    alert('خطا در پاک کردن پیوی‌ها')
  } finally {
    deletingPv.value = false
  }
}

async function removeAccount() {
  if (!confirm('آیا از حذف اکانت اطمینان دارید؟ این عمل قابل بازگشت نیست.')) return
  try {
    await accountApi.remove(account.value.id)
    alert('اکانت حذف شد')
    router.push('/accounts')
  } catch {
    alert('خطا در حذف اکانت')
  }
}

async function submit2FA() {
  if (!twoFAPassword.value) return
  try {
    await accountApi.verify2FA(account.value.id, twoFAPassword.value)
    account.value.status = 'active'
    twoFAPassword.value = ''
    alert('اکانت با موفقیت فعال شد')
    await store.fetchAccounts()
  } catch {
    alert('رمز اشتباه است')
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: var(--text-secondary);
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
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
  font-size: 28px;
  font-weight: 700;
  color: white;
}

.profile-info h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.profile-phone {
  color: var(--text-secondary);
  font-size: 14px;
}

.profile-bio {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 4px 0;
}

.actions-section {
  margin-top: 24px;
}

.actions-section h3 {
  font-size: 18px;
  margin-bottom: 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-icon {
  font-size: 24px;
}

.action-title {
  font-size: 16px;
  font-weight: 700;
}

.action-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group textarea {
  resize: none;
}

.danger-zone {
  border-color: rgba(244, 67, 54, 0.3);
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
