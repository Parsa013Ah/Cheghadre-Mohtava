import { defineStore } from 'pinia'
import { accountApi, groupApi, linkDoniApi, messageApi, jobApi } from '../api'

export const useAppStore = defineStore('app', {
  state: () => ({
    accounts: { data: [], total: 0, page: 0, totalPages: 0 },
    groups: { data: [], total: 0, page: 0, totalPages: 0 },
    linkDoniChannels: [],
    jobs: { data: [], total: 0, page: 0, totalPages: 0 },
    loading: false,
    error: null as string | null,
    groupStats: { totalGroups: 0, totalJoined: 0 },
  }),

  actions: {
    async fetchAccounts(page = 0) {
      this.loading = true
      try {
        const res = await accountApi.getAll(page)
        this.accounts = res.data
      } catch (e: any) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async fetchGroups(page = 0) {
      this.loading = true
      try {
        const res = await groupApi.getAll(page)
        this.groups = res.data
      } catch (e: any) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async fetchGroupStats() {
      try {
        const res = await groupApi.getStats()
        this.groupStats = res.data
      } catch {}
    },

    async fetchLinkDoniChannels() {
      try {
        const res = await linkDoniApi.getAll()
        this.linkDoniChannels = res.data
      } catch {}
    },

    async fetchJobs(page = 0) {
      try {
        const res = await jobApi.getAll(page)
        this.jobs = res.data
      } catch {}
    },
  },
})
