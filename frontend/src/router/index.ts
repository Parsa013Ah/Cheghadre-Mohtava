import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Accounts from '../views/Accounts.vue'
import AccountDetail from '../views/AccountDetail.vue'
import Groups from '../views/Groups.vue'
import LinkDoni from '../views/LinkDoni.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/accounts', name: 'Accounts', component: Accounts },
  { path: '/accounts/:id', name: 'AccountDetail', component: AccountDetail },
  { path: '/groups', name: 'Groups', component: Groups },
  { path: '/link-doni', name: 'LinkDoni', component: LinkDoni },
  { path: '/settings', name: 'Settings', component: Settings },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
