import api from './client'

export const accountApi = {
  getAll: (page = 0, limit = 5) => api.get('/accounts', { params: { page, limit } }),
  getOne: (id: number) => api.get(`/accounts/${id}`),
  sendCode: (phone: string) => api.post('/accounts/send-code', { phone }),
  verifyCode: (id: number, code: string) => api.post(`/accounts/${id}/verify-code`, { code }),
  verify2FA: (id: number, password: string) => api.post(`/accounts/${id}/verify-2fa`, { password }),
  updateProfile: (id: number, data: { firstName?: string; bio?: string }) =>
    api.put(`/accounts/${id}/profile`, data),
  disconnect: (id: number) => api.post(`/accounts/${id}/disconnect`),
  remove: (id: number) => api.delete(`/accounts/${id}`),
}

export const groupApi = {
  getAll: (page = 0, limit = 10) => api.get('/groups', { params: { page, limit } }),
  getOne: (id: number) => api.get(`/groups/${id}`),
  getStats: () => api.get('/groups/stats'),
  getAccounts: (id: number) => api.get(`/groups/${id}/accounts`),
  remove: (id: number) => api.delete(`/groups/${id}`),
}

export const linkDoniApi = {
  getAll: () => api.get('/link-doni'),
  extract: (accountId: number, channelLink: string, count: number) =>
    api.post('/link-doni/extract', { accountId, channelLink, count }),
  remove: (id: number) => api.delete(`/link-doni/${id}`),
}

export const messageApi = {
  send: (accountId: number, groupId: number, message: string) =>
    api.post('/messages/send', { accountId, groupId, message }),
  sendMultiple: (accountId: number, groupIds: number[], message: string) =>
    api.post('/messages/send-multiple', { accountId, groupIds, message }),
}

export const jobApi = {
  getAll: (page = 0, limit = 10) => api.get('/jobs', { params: { page, limit } }),
  getOne: (id: number) => api.get(`/jobs/${id}`),
}
